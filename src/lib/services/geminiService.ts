import { GoogleGenerativeAI, Part, SchemaType } from "@google/generative-ai";
import { getTenant } from "./tenantService";
import { createTurno } from "./agendaService";
import { serviceManagement } from "./serviceManagement";
import { availabilityService } from "./availabilityService";
import { format } from "date-fns";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Intenta obtener un modelo probando diferentes alias y versiones de API si falla.
 */
async function getGenerativeModelWithFallback(config: any) {
    const modelsToTry = [
        { name: config.model, api: 'v1beta' }, // Intento primario (el configurado)
        { name: "gemini-flash-latest", api: 'v1beta' },
        { name: "gemini-2.5-flash", api: 'v1beta' },
        { name: "gemini-2.0-flash", api: 'v1beta' },
    ];

    let lastError: any = null;
    for (const modelInfo of modelsToTry) {
        try {
            console.log(`Intentando Gemini con ${modelInfo.name} (${modelInfo.api})...`);
            const model = genAI.getGenerativeModel(
                { ...config, model: modelInfo.name }, 
                { apiVersion: modelInfo.api as any }
            );
            // Verificamos si responde con un ping básico (esto puede ser opcional, pero ayuda a detectar 404 antes de enviar todo el historial)
            return model;
        } catch (e) {
            lastError = e;
            console.warn(`Fallo con ${modelInfo.name} (${modelInfo.api}):`, e);
        }
    }
    throw lastError;
}


export interface ChatMessage {
    role: "user" | "model";
    parts: Part[];
}

export interface AudioData {
    data: string; // base64
    mimeType: string;
}

/**
 * Servicio para interactuar con Google Gemini para las agentes Noemí y Verónica
 */
export const geminiService = {
    /**
     * Generar respuesta de Noemí (Ventas) con capacidad de agendamiento
     */
    async chatNoemi(tenantId: string, userMessage: string, history: ChatMessage[] = [], context: { userName?: string, whatsapp?: string } = {}, audio?: AudioData) {
        const tenant = await getTenant(tenantId);
        if (!tenant || !tenant.ai_config?.noemi?.active) return null;

        // 1. Obtener servicios del salón para el contexto
        const servicios = await serviceManagement.getAllSubtratamientos(tenantId);
        const serviciosContext = servicios.map(s => `- ${s.nombre}: $${s.precio} (${s.duracion_minutos} min)`).join("\n");

        const model = await getGenerativeModelWithFallback({ 
            model: "gemini-flash-latest",
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
                }, {
                    name: "consultar_disponibilidad",
                    description: "Consulta los horarios disponibles para un tratamiento en una fecha específica.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            servicioNombre: { type: SchemaType.STRING, description: "Nombre del servicio/tratamiento" },
                            fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" }
                        },
                        required: ["servicioNombre", "fecha"]
                    }
                }]
            }]
        });

        const now = new Date();
        const fechaActual = format(now, 'yyyy-MM-dd');
        const diaSemana = format(now, 'EEEE', { locale: require('date-fns/locale').es });

        const systemPrompt = `
            Eres Noemí, la experta en ventas de "${tenant.nombre_salon}".
            Tu objetivo es cerrar ventas agendando turnos en la agenda.
            
            Fecha actual: ${fechaActual} (${diaSemana})
            
            Información del cliente:
            - Nombre: ${context.userName || "Desconocido (Preguntar si es necesario)"}
            - WhatsApp: ${context.whatsapp || "Desconocido"}
            
            Servicios disponibles:
            ${serviciosContext}
            
            Instrucciones CRÍTICAS:
            - PERSISTENCIA: No repitas preguntas o consejos que ya diste anteriormente en esta conversación. Revisa el historial para mantener la fluidez.
            - DISPONIBILIDAD: No preguntes "¿Qué día y hora te queda bien?". En su lugar, usa "consultar_disponibilidad" para ver qué hay libre y PROPÓN tú 2 o 3 opciones al cliente.
            - Si el cliente te dice un día (ej: "mañana", "el jueves"), usa "consultar_disponibilidad" para ese día.
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

        const userParts: Part[] = [];
        if (audio) {
            userParts.push({
                inlineData: {
                    data: audio.data,
                    mimeType: audio.mimeType
                }
            });
        }
        userParts.push({ text: userMessage || (audio ? "Por favor, escucha este audio y responde al cliente." : "") });

        let result = await chat.sendMessage(userParts);
        let response = result.response;
        let call = response.functionCalls()?.[0];

        // Manejo de Tool Calls en bucle (máximo 2 por si acaso)
        let iterations = 0;
        while (call && iterations < 2) {
            iterations++;
            
            if (call.name === "agendar_turno_pendiente") {
                const args = call.args as any;
                try {
                    const servicioEncontrado = servicios.find(s => s.nombre.toLowerCase().includes(args.servicioNombre.toLowerCase()));
                    
                    await createTurno(tenantId, {
                        clienteAbreviado: args.clienteNombre,
                        nombre: args.clienteNombre,
                        tratamientoAbreviado: args.servicioNombre,
                        duracionMinutos: servicioEncontrado?.duracion_minutos || 60,
                        boxId: "box-1",
                        fecha: args.fecha,
                        horaInicio: args.hora,
                        whatsapp: args.whatsapp || context.whatsapp || "",
                        status: 'PENDIENTE',
                        total: servicioEncontrado?.precio || 0,
                        tratamientoId: servicioEncontrado?.tratamientoId || ""
                    });

                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: "agendar_turno_pendiente",
                            response: { content: "Turno creado exitosamente con estatus PENDIENTE." }
                        }
                    }]);
                } catch (error) {
                    console.error("Error en agendar_turno_pendiente:", error);
                    return "Lo siento, tuve un problema al agendar. ¿Probamos de nuevo?";
                }
            } else if (call.name === "consultar_disponibilidad") {
                const args = call.args as any;
                try {
                    const servicioEncontrado = servicios.find(s => s.nombre.toLowerCase().includes(args.servicioNombre.toLowerCase()));
                    if (!servicioEncontrado) {
                        result = await chat.sendMessage([{
                            functionResponse: {
                                name: "consultar_disponibilidad",
                                response: { content: "Error: El servicio indicado no existe." }
                            }
                        }]);
                    } else {
                        const slots = await availabilityService.getAvailableSlots(tenantId, servicioEncontrado.tratamientoId, new Date(args.fecha + 'T12:00:00'));
                        result = await chat.sendMessage([{
                            functionResponse: {
                                name: "consultar_disponibilidad",
                                response: { content: `Horarios libres para ${args.fecha}: ${slots.length > 0 ? slots.join(", ") : "No hay disponibilidad para este día."}` }
                            }
                        }]);
                    }
                } catch (error) {
                    console.error("Error en consultar_disponibilidad:", error);
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: "consultar_disponibilidad",
                            response: { content: "Error técnico al consultar disponibilidad." }
                        }
                    }]);
                }
            }
            
            response = result.response;
            call = response.functionCalls()?.[0];
        }

        return `⚡ ${response.text()}`;
    },

    /**
     * Generar respuesta de Verónica (Recordatorios)
     */
    async chatVeronica(tenantId: string, userMessage: string, history: ChatMessage[] = [], audio?: AudioData) {
        const tenant = await getTenant(tenantId);
        if (!tenant || !tenant.ai_config?.veronica?.active) return null;

        const model = await getGenerativeModelWithFallback({ model: "gemini-flash-latest" });

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

        const userParts: Part[] = [];
        if (audio) {
            userParts.push({
                inlineData: {
                    data: audio.data,
                    mimeType: audio.mimeType
                }
            });
        }
        userParts.push({ text: userMessage || (audio ? "Por favor, escucha este audio y responde al cliente." : "") });

        const result = await chat.sendMessage(userParts);
        const responseText = result.response.text();
        return `⚡ ${responseText}`;
    }
};
