import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

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

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Reset Spa Agent", "Desktop", "1.0.0"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("\n📲 ESCANEA ESTE CÓDIGO CON TU WHATSAPP:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexión cerrada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                // Agregar un pequeño delay para reconexiones en loop
                setTimeout(connectToWhatsApp, 5000);
            } else {
                console.log("🔴 Sesión cerrada permanentemente. Elimina la carpeta 'auth_info_baileys' para escanear de nuevo.");
                fs.rmSync(authFolder, { recursive: true, force: true });
                process.exit(0);
            }
        } else if (connection === 'open') {
            console.log('\n✅ ¡Conectado exitosamente!');
            console.log('🤖 La IA ya está monitoreando y respondiendo mensajes.');
            console.log('Para detener la IA, simplemente cierra esta ventana.\n');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.message) continue;
            
            const sender = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            
            // Extraer el texto del mensaje (soporta texto plano o respuesta a otro mensaje)
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (!text || !sender || fromMe) continue;
            if (sender.includes('@g.us') || sender === 'status@broadcast') continue;

            try {
                // 1. Activar estado "Escribiendo" y delay humano localmente
                await sock.sendPresenceUpdate('composing', sender);
                const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
                await new Promise(r => setTimeout(r, delay));

                // 2. Procesar respuesta mediante nuestro servidor Vercel
                const response = await axios.post(`${SERVER_URL}/api/ai/sync-agent`, {
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

            } catch (error: any) {
                console.error(`[!!] Error al procesar mensaje de ${sender.split('@')[0]}:`, error?.response?.data || error.message);
                await sock.sendPresenceUpdate('paused', sender);
            }
        }
    });
}

connectToWhatsApp();
