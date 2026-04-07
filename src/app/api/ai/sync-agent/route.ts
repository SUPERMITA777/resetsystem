import { NextResponse } from "next/server";
import { getTenant } from "@/lib/services/tenantService";
import { geminiService } from "@/lib/services/geminiService";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Endpoint Síncrono para el Agente Local (.exe).
 * En lugar de enviar la respuesta de vuelta a una URL, 
 * responde directamente en el cuerpo del HTTP Response.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Estructura esperada desde el EXE:
        // { tenantId: "resetspa", sender: "549110000000@s.whatsapp.net", text: "Hola" }
        const { tenantId, sender, text } = body;

        if (!tenantId || !sender || !text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const tenant = await getTenant(tenantId);
        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // 1. Ignorar mensajes de grupos, status, o de la propia instancia
        if (sender.includes("@g.us") || sender === "status@broadcast" || sender.includes("me")) {
            return NextResponse.json({ status: "ignored" });
        }

        // 2. Verificar Frases de Control (Mute/Resume)
        const isPauseCommand = text.toLowerCase() === tenant.ai_config?.noemi?.pause_phrase?.toLowerCase();
        const isResumeCommand = text.toLowerCase() === tenant.ai_config?.noemi?.resume_phrase?.toLowerCase();
        const clientRef = doc(db, "tenants", tenant.slug, "ai_muted_chats", sender);

        if (isPauseCommand) {
            const { setDoc } = await import("firebase/firestore");
            await setDoc(clientRef, { mutedAt: new Date().toISOString() });
            return NextResponse.json({ reply: "⚡ Entendido, pauso mis respuestas automáticas. Un asistente humano te contactará a la brevedad." });
        }

        if (isResumeCommand) {
            const { deleteDoc } = await import("firebase/firestore");
            await deleteDoc(clientRef);
            return NextResponse.json({ reply: "⚡ IA Reactivada. ¡Hola de nuevo! ¿En qué puedo ayudarte?" });
        }

        // 3. Verificar si el chat está silenciado
        const muteSnap = await getDoc(clientRef);
        if (muteSnap.exists()) {
            return NextResponse.json({ status: "ignored_muted" });
        }

        // 4. Procesar con Gemini (A este punto, el delay y el typing lo gestiona el propio EXE local).
        const responseText = await geminiService.chatNoemi(tenant.slug, text);

        if (!responseText) {
            return NextResponse.json({ status: "ignored_empty_response" });
        }

        // 5. Retornar la respuesta síncronamente al EXE
        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("Error en Sync Webhook:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
