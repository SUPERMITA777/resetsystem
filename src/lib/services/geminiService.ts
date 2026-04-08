import { GoogleGenerativeAI, Part, SchemaType } from "@google/generative-ai";
import { getTenant } from "./tenantService";
import { createTurno, getTurnosPorWhatsApp, updateTurno } from "./agendaService";
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
                            servicioNombre: { type: SchemaType.STRING, description: "Nombre del tratamiento" },
                            subtratamientoNombre: { type: SchemaType.STRING, description: "Nombre del subtratamiento (especificidad)" },
                            fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" },
                            hora: { type: SchemaType.STRING, description: "Hora en formato HH:mm" },
                            whatsapp: { type: SchemaType.STRING, description: "Número de WhatsApp del cliente" }
                        },
                        required: ["clienteNombre", "servicioNombre", "subtratamientoNombre", "fecha", "hora"]
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
                }, {
                    name: "buscar_mis_turnos",
                    description: "Busca los turnos que tiene el cliente agendados por su WhatsApp.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            whatsapp: { type: SchemaType.STRING, description: "Número de WhatsApp del cliente" }
                        },
                        required: ["whatsapp"]
                    }
                }, {
                    name: "modificar_turno",
                    description: "Modifica un turno existente (reprogramar, cambiar status, etc.).",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            turnoId: { type: SchemaType.STRING, description: "ID del turno a modificar" },
                            data: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    fecha: { type: SchemaType.STRING, description: "Nueva fecha YYYY-MM-DD" },
                                    horaInicio: { type: SchemaType.STRING, description: "Nueva hora HH:mm" },
                                    status: { type: SchemaType.STRING, enum: ["PENDIENTE", "RESERVADO", "CONFIRMADO", "CANCELADO", "COMPLETADO"] },
                                    tratamientoAbreviado: { type: SchemaType.STRING },
                                    subtratamientoAbreviado: { type: SchemaType.STRING }
                                }
                            }
                        },
                        required: ["turnoId", "data"]
                    }
                }]
            }]
        });

        const now = new Date();
        const fechaActual = format(now, 'yyyy-MM-dd');
        const diaSemana = format(now, 'EEEE', { locale: require('date-fns/locale').es });

        const systemPrompt = `
            Eres Noemí, la experta en ventas de "${tenant.nombre_salon}".
            Tu objetivo es gestionar la agenda de forma profesional y eficiente.
            
            Fecha actual: ${fechaActual} (${diaSemana})
            
            Información del cliente:
            - Nombre: ${context.userName || "Desconocido"}
            - WhatsApp: ${context.whatsapp || "Desconocido"}
            
            Servicios disponibles:
            ${serviciosContext}
            
            Instrucciones CRÍTICAS:
            - PERSISTENCIA: No repitas preguntas que ya se respondieron. Usa el historial.
            - SIN DUPLICADOS: Si el cliente quiere cambiar, reagendar o cancelar, usa 'buscar_mis_turnos' primero para encontrar su cita y luego 'modificar_turno'. NO crees una cita nueva.
            - FICHA COMPLETA: Es OBLIGATORIO recolectar tanto el TRATAMIENTO como el SUBTRATAMIENTO. 
              Si dicen "Limpieza facial", pregunta qué tipo (Classic, Premium, etc.) antes de agendar.
            - DISPONIBILIDAD: Propón 2 o 3 opciones usando 'consultar_disponibilidad'.
            - Una vez que tengas Nombre, Tratamiento, Subtratamiento, Fecha y Hora, usa "agendar_turno_pendiente".
            - Sé amable, usa emojis y tono "${tenant.ai_config.noemi.tone}".
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
                        subtratamientoAbreviado: args.subtratamientoNombre,
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
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: "agendar_turno_pendiente",
                            response: { content: "Error al agendar el turno." }
                        }
                    }]);
                }
            } else if (call.name === "buscar_mis_turnos") {
                const args = call.args as any;
                try {
                    const turnos = await getTurnosPorWhatsApp(tenantId, args.whatsapp);
                    const proximos = turnos.filter(t => t.status !== "CANCELADO");
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: "buscar_mis_turnos",
                            response: { content: `Turnos encontrados: ${proximos.map(t => `${t.fecha} ${t.horaInicio} (${t.tratamientoAbreviado}) ID:${t.id}`).join(", ") || "Ninguno."}` }
                        }
                    }]);
                } catch (error) {
                    result = await chat.sendMessage([{ functionResponse: { name: "buscar_mis_turnos", response: { content: "Error al buscar turnos." } } }]);
                }
            } else if (call.name === "modificar_turno") {
                const args = call.args as any;
                try {
                    await updateTurno(tenantId, args.turnoId, args.data);
                    result = await chat.sendMessage([{
                        functionResponse: {
                            name: "modificar_turno",
                            response: { content: "Turno modificado exitosamente." }
                        }
                    }]);
                } catch (error) {
                    result = await chat.sendMessage([{ functionResponse: { name: "modificar_turno", response: { content: "Error al modificar." } } }]);
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
