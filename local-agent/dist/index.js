"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = require("@whiskeysockets/baileys");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Configuración Base
const SERVER_URL = process.env.RESET_API_URL || "https://resetsystem.com"; // En prod usar dominio real.
const authFolder = path.join(process.cwd(), 'auth_info_baileys');
// Argumento CLI: node index.js [tenantId]
const tenantId = process.argv[2] || process.env.TENANT_ID;
if (!tenantId) {
    console.error("❌ ERROR CRÍTICO: No se proporcionó el Código de Salón (Tenant ID).");
    console.error("Uso: AgenteResetSpa.exe <tu_salon>");
    console.error("Ejemplo: AgenteResetSpa.exe resetspa");
    process.exit(1);
}
async function connectToWhatsApp() {
    console.log(`\n========================================`);
    console.log(`⚡ AGENTE IA - RESET SYSTEM ⚡`);
    console.log(`Salón configurado: [${tenantId}]`);
    console.log(`========================================\n`);
    console.log("Iniciando servicio... por favor espera.");
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(authFolder);
    const sock = (0, baileys_1.makeWASocket)({
        auth: state,
        printQRInTerminal: false,
        browser: ["Reset Spa Agent", "Desktop", "1.0.0"],
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("\n📲 ESCANEA ESTE CÓDIGO CON TU WHATSAPP:");
            qrcode_terminal_1.default.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
            console.log('❌ Conexión cerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                // Agregar un pequeño delay para reconexiones en loop
                setTimeout(connectToWhatsApp, 5000);
            }
            else {
                console.log("🔴 Sesión cerrada permanentemente. Elimina la carpeta 'auth_info_baileys' para escanear de nuevo.");
                fs.rmSync(authFolder, { recursive: true, force: true });
                process.exit(0);
            }
        }
        else if (connection === 'open') {
            console.log('\n✅ ¡Conectado exitosamente!');
            console.log('🤖 La IA ya está monitoreando y respondiendo mensajes.');
            console.log('Para detener la IA, simplemente cierra esta ventana.\n');
        }
    });
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify')
            return;
        for (const msg of messages) {
            if (!msg.message)
                continue;
            const sender = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            // Extraer el texto del mensaje (soporta texto plano o respuesta a otro mensaje)
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (!text || !sender || fromMe)
                continue;
            if (sender.includes('@g.us') || sender === 'status@broadcast')
                continue;
            try {
                // 1. Activar estado "Escribiendo" y delay humano localmente
                await sock.sendPresenceUpdate('composing', sender);
                const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
                await new Promise(r => setTimeout(r, delay));
                // 2. Procesar respuesta mediante nuestro servidor Vercel
                const response = await axios_1.default.post(`${SERVER_URL}/api/ai/sync-agent`, {
                    tenantId,
                    sender,
                    text
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000 // 30 segundos max para que Gemini responda
                });
                const data = response.data;
                // 3. Responder al cliente directamente desde este socket
                if (data.reply) {
                    await sock.sendPresenceUpdate('paused', sender);
                    await sock.sendMessage(sender, { text: data.reply });
                    console.log(`[>>] Respondido a ${sender.split('@')[0]}`);
                }
            }
            catch (error) {
                console.error(`[!!] Error al procesar mensaje de ${sender.split('@')[0]}:`, error?.response?.data || error.message);
                await sock.sendPresenceUpdate('paused', sender);
            }
        }
    });
}
connectToWhatsApp();
