import { GoogleGenerativeAI, Part, SchemaType } from "@google/generative-ai";
import { getTenant } from "./tenantService";
import { createTurno } from "./agendaService";
import { serviceManagement } from "./serviceManagement";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);


export interface ChatMessage {
    role: "user" | "model";
    parts: Part[];
}

/**
 * Servicio para interactuar con Google Gemini para las agentes Noemí y Verónica
 */
export const geminiService = {
    /**
     * Generar respuesta de Noemí (Ventas) con capacidad de agendamiento
     */
    async chatNoemi(tenantId: string, userMessage: string, history: ChatMessage[] = []) {
        const tenant = await getTenant(tenantId);
        if (!tenant || !tenant.ai_config?.noemi?.active) return null;

        // 1. Obtener servicios del salón para el contexto
        const servicios = await serviceManagement.getAllSubtratamientos(tenantId);
        const serviciosContext = servicios.map(s => `- ${s.nombre}: $${s.precio} (${s.duracion_minutos} min)`).join("\n");

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: [{
                functionDeclarations: [{
                    name: "agendar_turno_pendiente",
                    description: "Crea una solicitud de turno en la agenda con estatus PENDIENTE.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            clienteNombre: { type: SchemaType.STRING, description: "Nombre del cliente" },
                            servicioNombre: { type: SchemaType.STRING, description: "Nombre del servicio/tratamiento" },
                            fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" },
                            hora: { type: SchemaType.STRING, description: "Hora en formato HH:mm" },
                            whatsapp: { type: SchemaType.STRING, description: "Número de WhatsApp del cliente" }
                        },
                        required: ["clienteNombre", "servicioNombre", "fecha", "hora"]
                    }
                }]
            }]
        }, { apiVersion: 'v1' });

        const systemPrompt = `
            Eres Noemí, la experta en ventas de "${tenant.nombre_salon}".
            Tu objetivo es cerrar ventas agendando turnos en la agenda.
            
            Servicios disponibles:
            ${serviciosContext}
            
            Instrucciones:
            - Sé amable, usa emojis y mantén el tono "${tenant.ai_config.noemi.tone}".
            - Si el cliente quiere un turno, verifica que el servicio exista en la lista.
            - Una vez que tengas Nombre, Servicio, Fecha y Hora, usa la función "agendar_turno_pendiente".
            - IMPORTANTE: Dile al cliente que el turno ha sido solicitado y que el administrador lo confirmará en breve.
            - Si te preguntan algo que no sabes, di que consultarás con el equipo humano.
            - Tus reglas personalizadas: ${tenant.ai_config.noemi.rules || "Ninguna."}
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "¡Hola! Soy Noemí. Estoy lista para ayudar a los clientes de " + tenant.nombre_salon + " a encontrar su momento ideal." }] },
                ...history
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        const call = response.functionCalls()?.[0];

        if (call && call.name === "agendar_turno_pendiente") {
            const args = call.args as any;
            try {
                // Buscar el ID del tratamiento/subtratamiento basándose en el nombre (búsqueda simple)
                const servicioEncontrado = servicios.find(s => s.nombre.toLowerCase().includes(args.servicioNombre.toLowerCase()));
                
                await createTurno(tenantId, {
                    clienteAbreviado: args.clienteNombre,
                    nombre: args.clienteNombre,
                    tratamientoAbreviado: args.servicioNombre,
                    duracionMinutos: servicioEncontrado?.duracion_minutos || 60,
                    boxId: "box-1", // Por defecto a box-1, ajustable
                    fecha: args.fecha,
                    horaInicio: args.hora,
                    whatsapp: args.whatsapp || "",
                    status: 'PENDIENTE', // Requisito del usuario
                    total: servicioEncontrado?.precio || 0,
                    tratamientoId: servicioEncontrado?.tratamientoId || ""
                });

                const toolResponse = await chat.sendMessage([{
                    functionResponse: {
                        name: "agendar_turno_pendiente",
                        response: { content: "Turno creado exitosamente con estatus PENDIENTE." }
                    }
                }]);
                return `⚡ ${toolResponse.response.text()}`;
            } catch (error) {
                console.error("Error en function call agendar_turno:", error);
                return "Lo siento, tuve un problema técnico al intentar agendar tu turno. ¿Podrías intentar de nuevo en unos minutos?";
            }
        }

        return `⚡ ${response.text()}`;
    },

    /**
     * Generar respuesta de Verónica (Recordatorios)
     */
    async chatVeronica(tenantId: string, userMessage: string, history: ChatMessage[] = []) {
        const tenant = await getTenant(tenantId);
        if (!tenant || !tenant.ai_config?.veronica?.active) return null;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

        const systemPrompt = `
            Eres Verónica, la asistente de recordatorios de "${tenant.nombre_salon}".
            Tu objetivo es confirmar la asistencia de los clientes. 
            Eres eficiente, clara y amable.
            
            Timing configurado: ${tenant.ai_config.veronica.timing}
            
            Si el cliente confirma (SI), agradece y dile que lo esperamos.
            Si el cliente cancela (NO), dile que es una pena y ofrécele reagendar para otro día.
            Si tiene una duda compleja, dile que un humano se pondrá en contacto pronto.
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Hola, soy Verónica. Estoy lista para gestionar los recordatorios de " + tenant.nombre_salon }] },
                ...history
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();
        return `⚡ ${responseText}`;
    }
};
