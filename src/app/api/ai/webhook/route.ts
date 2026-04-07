import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/services/tenantService";
import { geminiService } from "@/lib/services/geminiService";
import { createTurno } from "@/lib/services/agendaService";

/**
 * Webhook principal para recibir mensajes de WhatsApp/Instagram (Evolution API)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("AI Webhook: Mensaje recibido", body);

        // 1. Identificar el Tenant
        const instanceName = body.instance || body.instanceName;
        if (!instanceName) {
            return NextResponse.json({ error: "No instance name detected" }, { status: 400 });
        }

        const tenant = await getTenant(instanceName);
        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // 2. Extraer datos del mensaje
        const messageData = {
            sender: body.data?.key?.remoteJid || body.data?.from,
            text: body.data?.message?.conversation || body.data?.content || "",
            isGroup: body.data?.key?.remoteJid?.includes("@g.us"),
            timestamp: body.data?.messageTimestamp || Date.now()
        };

        if (messageData.isGroup || !messageData.text) {
            return NextResponse.json({ status: "ignored" });
        }

        // 3. Lógica de Silencio (Secret Phrases)
        const noemiConfig = tenant.ai_config?.noemi;
        const pausePhrase = noemiConfig?.pause_phrase?.toLowerCase() || "quiero hablar con sole";
        const resumePhrase = noemiConfig?.resume_phrase?.toLowerCase() || "noemi continua con tu trabajo";
        const incomingText = messageData.text.toLowerCase().trim();

        // 3a. Detectar frase de PAUSA
        if (incomingText.includes(pausePhrase)) {
            const { db } = await import("@/lib/firebase");
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "tenants", tenant.slug, "ai_muted_chats", messageData.sender), {
                mutedAt: Date.now(),
                reason: "secret_phrase"
            });
            // No respondemos nada, o podríamos enviar un mensaje de "Pasando con un humano..." via Evolution
            return NextResponse.json({ status: "muted_by_phrase", sender: messageData.sender });
        }

        // 3b. Detectar frase de REANUDAR
        if (incomingText.includes(resumePhrase)) {
            const { db } = await import("@/lib/firebase");
            const { doc, deleteDoc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "tenants", tenant.slug, "ai_muted_chats", messageData.sender));
            
            // Aquí SI le pedimos a Noemí que salude de nuevo
            const responseText = "¡Entendido! Ya estoy aquí de nuevo para ayudarte. ¿En qué nos quedamos?";
            // Enviar vía Evolution API (próximamente)
            return NextResponse.json({ status: "resumed_by_phrase", reply: responseText });
        }

        // 3c. Verificar si el chat está silenciado
        const { db } = await import("@/lib/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const muteSnap = await getDoc(doc(db, "tenants", tenant.slug, "ai_muted_chats", messageData.sender));
        
        if (muteSnap.exists()) {
            console.log(`AI Webhook: Chat ${messageData.sender} está silenciado. Ignorando.`);
            return NextResponse.json({ status: "ignored_muted_chat" });
        }

        // --- EFECTO HUMANO ---
        // 1. Activar estado "Escribiendo"
        const { evolutionService } = await import("@/lib/services/evolutionService");
        await evolutionService.sendPresence(
            tenant.slug, 
            messageData.sender.split("@")[0], // Número limpio
            'composing',
            tenant.ai_config?.evolution_api_url
        );

        // 2. Espera Aleatoria (2-4 segundos)
        const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        // ---------------------

        // 4. Elegir Agente (Noemí o Verónica)
        const { geminiService } = await import("@/lib/services/geminiService");
        const responseText = await geminiService.chatNoemi(tenant.slug, messageData.text);

        if (!responseText) {
            return NextResponse.json({ status: "no_ai_response" });
        }

        // 5. Lógica de Agendamiento Automático (Extracción de Intento)
        // TODO: Implementar extracción de parámetros real con Gemini.
        if (responseText.includes("AGENDAR_TURNO_TRIGGER")) {
             // Lógica de agendamiento como PENDIENTE
        }

        return NextResponse.json({ 
            status: "success", 
            reply: responseText, 
            agent: "Noemí" 
        });

    } catch (error) {
        console.error("AI Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
