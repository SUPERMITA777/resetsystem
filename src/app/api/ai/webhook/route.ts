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

        // 3. Elegir Agente (Noemí o Verónica)
        // Por simplicidad, si es un mensaje de texto normal, va a Noemí (Ventas).
        // En una etapa avanzada, podríamos detectar si es respuesta a un recordatorio de Verónica.
        
        const responseText = await geminiService.chatNoemi(tenant.slug, messageData.text);

        if (!responseText) {
            return NextResponse.json({ status: "no_ai_response" });
        }

        // 4. Lógica de Agendamiento Automático (Extracción de Intento)
        // Si Noemí detecta que el cliente quiere agendar, podríamos usar un prompt estructurado
        // para extraer { fecha, hora, servicio }. 
        // Por ahora, simularemos que si el texto contiene "AGENDAR_TURNO", creamos un pendiente.
        
        // TODO: Implementar extracción de parámetros real con Gemini.
        if (responseText.includes("AGENDAR_TURNO_TRIGGER")) {
             // Lógica de agendamiento como PENDIENTE
             // await createTurno(tenant.slug, { ...datos, status: 'PENDIENTE' });
        }

        // 5. Enviar Respuesta vía Evolution API
        // Esto requiere una llamada POST a la instancia de Evolution API del cliente.
        // const evolutionResponse = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, { ... });

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
