import { NextResponse } from "next/server";
import { geminiService } from "@/lib/services/geminiService";
import { getTenantServer } from "@/lib/services/serverDb";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * Endpoint Síncrono para el Agente Local (.exe).
 * En lugar de enviar la respuesta de vuelta a una URL, 
 * responde directamente en el cuerpo del HTTP Response.
 */
export async function POST(req: Request) {
    let collection = "";
    let action = "";
    let docId = "";

    try {
        const body = await req.json();
        console.log("[SyncAgent] Received request:", JSON.stringify(body));
        
        collection = body.collection;
        action = body.action;
        docId = body.docId;
        const { tenantId, sender, text, fromMe } = body;

        if (!tenantId || !sender || !text) {
            console.error("[SyncAgent] Missing required fields:", { tenantId, sender, text });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- MODO DIAGNÓSTICO (DEBUG) ---
        if (text === "DEBUG_MODELS") {
            const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            const modelList = data.models?.map((m: any) => m.name.replace("models/", "")).join(", ") || "No se encontraron modelos";
            return NextResponse.json({ reply: `🚨 DIAGNÓSTICO: Modelos disponibles en este entorno: ${modelList}` });
        }

        console.log("[SyncAgent] Fetching tenant info for:", tenantId);
        const tenant = await getTenantServer(tenantId);
        if (!tenant) {
            console.error("[SyncAgent] Tenant not found:", tenantId);
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // 1. Ignorar mensajes de grupos, status, o de la propia instancia
        if (sender.includes("@g.us") || sender === "status@broadcast" || sender.includes("me")) {
            return NextResponse.json({ status: "ignored" });
        }

        // 2. Verificar Frases de Control (Mute/Resume)
        const isPauseCommand = text.toLowerCase() === tenant.ai_config?.noemi?.pause_phrase?.toLowerCase();
        const isResumeCommand = text.toLowerCase() === tenant.ai_config?.noemi?.resume_phrase?.toLowerCase();
        
        const adminDb = getAdminDb();
        const clientRef = adminDb.collection("tenants").doc(tenant.slug).collection("ai_muted_chats").doc(sender);

        if (isPauseCommand) {
            await clientRef.set({ mutedAt: new Date().toISOString() });
            // Si el comando lo envió el dueño (fromMe), no enviar auto-respuesta al cliente.
            if (fromMe) return NextResponse.json({ status: "paused_by_owner" });
            return NextResponse.json({ reply: "⚡ Entendido, pauso mis respuestas automáticas. Un asistente humano te contactará a la brevedad." });
        }

        if (isResumeCommand) {
            await clientRef.delete();
            if (fromMe) return NextResponse.json({ status: "resumed_by_owner" });
            return NextResponse.json({ reply: "⚡ IA Reactivada. ¡Hola de nuevo! ¿En qué puedo ayudarte?" });
        }

        // Si el mensaje fue enviado por el humano (dueño) y no es un comando, ignorarlo
        if (fromMe) {
            return NextResponse.json({ status: "ignored_from_me" });
        }

        // 3. Verificar si el chat está silenciado
        const muteSnap = await clientRef.get();
        if (muteSnap.exists) {
            return NextResponse.json({ status: "ignored_muted" });
        }

        // 4. Procesar con Gemini (A este punto, el delay y el typing lo gestiona el propio EXE local).
        console.log("[SyncAgent] Invoking geminiService.chatNoemi for:", tenant.slug);
        const responseText = await geminiService.chatNoemi(tenant.slug, text);

        if (!responseText) {
            console.warn("[SyncAgent] Gemini returned empty response");
            return NextResponse.json({ status: "ignored_empty_response" });
        }

        console.log("[SyncAgent] Gemini success response length:", responseText.length);
        // 5. Retornar la respuesta síncronamente al EXE
        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("[SyncAgent] Global Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
