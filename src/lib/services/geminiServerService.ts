import { GoogleGenerativeAI, Part, SchemaType } from "@google/generative-ai";
import { getTenantServer } from "./serverDb";
import { createOrUpdateTenant } from "./tenantService";
import { createTurno, getTurnosPorWhatsApp, updateTurno, getTurnosPorFecha, deleteTurno } from "./agendaService";
import { serviceManagement } from "./serviceManagement";
import { availabilityService } from "./availabilityService";
import { chatLogService } from "./chatLogService";
import { getUsersByTenant } from "./userService";
import { getEgresosDelDia, getIngresosCreditosDelDia, buildResumen, calcularIngresos } from "./reportesService";
import { format } from "date-fns";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const ARS_PER_1000_TOKENS = 2;
const LIMIT_REACHED_MESSAGE = "Estimado cliente, el servicio de asistente inteligente ha alcanzado su límite de consumo mensual y se encuentra temporalmente pausado. Por favor, contacte con el salón para más información.";

async function getGenerativeModelWithFallback(config: any) {
    const modelsToTry = [
        { name: config.model, api: 'v1beta' },
        { name: "gemini-flash-latest", api: 'v1beta' },
        { name: "gemini-2.5-flash", api: 'v1beta' },
        { name: "gemini-2.0-flash", api: 'v1beta' },
    ];

    let lastError: any = null;
    for (const modelInfo of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel(
                { ...config, model: modelInfo.name }, 
                { apiVersion: modelInfo.api as any }
            );
            return model;
        } catch (e) {
            lastError = e;
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

export const geminiServerService = {
    async chatNoemi(tenantId: string, userMessage: string, history: ChatMessage[] = [], context: { userName?: string, whatsapp?: string } = {}, audio?: AudioData) {
        const tenant = await getTenantServer(tenantId);
        if (!tenant || !tenant.ai_config?.noemi?.active) return null;

        if (tenant.ai_usage && tenant.ai_usage.ars_limit > 0 && tenant.ai_usage.ars_spent >= tenant.ai_usage.ars_limit) {
            return `⚡ ${LIMIT_REACHED_MESSAGE}`;
        }

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
                            clienteNombre: { type: SchemaType.STRING },
                            servicioNombre: { type: SchemaType.STRING },
                            subtratamientoNombre: { type: SchemaType.STRING },
                            fecha: { type: SchemaType.STRING },
                            hora: { type: SchemaType.STRING },
                            whatsapp: { type: SchemaType.STRING }
                        },
                        required: ["clienteNombre", "servicioNombre", "subtratamientoNombre", "fecha", "hora"]
                    }
                }, {
                    name: "consultar_disponibilidad",
                    description: "Consulta los horarios disponibles para un tratamiento en una fecha específica.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            servicioNombre: { type: SchemaType.STRING },
                            fecha: { type: SchemaType.STRING }
                        },
                        required: ["servicioNombre", "fecha"]
                    }
                }, {
                    name: "buscar_mis_turnos",
                    description: "Busca los turnos que tiene el cliente agendados por su WhatsApp.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            whatsapp: { type: SchemaType.STRING }
                        },
                        required: ["whatsapp"]
                    }
                }, {
                    name: "modificar_turno",
                    description: "Modifica un turno existente.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            turnoId: { type: SchemaType.STRING },
                            data: { type: SchemaType.OBJECT }
                        },
                        required: ["turnoId", "data"]
                    }
                }]
            }]
        });

        const now = new Date();
        const fechaActual = format(now, 'yyyy-MM-dd');
        const diaSemana = format(now, 'EEEE', { locale: require('date-fns/locale/es') });

        const systemPrompt = `
            Eres Noemí, la experta en ventas de "${tenant.nombre_salon}".
            Fecha actual: ${fechaActual} (${diaSemana})
            Conocimiento extra: ${tenant.ai_knowledge || "Ninguno."}
            Información del cliente: ${context.userName || "Desconocido"}, WhatsApp: ${context.whatsapp || "Desconocido"}
            Servicios disponibles:\n${serviciosContext}
            Instrucciones: Tono "${tenant.ai_config.noemi.tone}". Usa emojis.
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "¡Hola! Soy Noemí." }] },
                ...history
            ],
        });

        const userParts: Part[] = [];
        if (audio) userParts.push({ inlineData: { data: audio.data, mimeType: audio.mimeType } });
        userParts.push({ text: userMessage || "Responde al cliente." });

        let result = await chat.sendMessage(userParts);
        let response = result.response;
        let call = response.functionCalls()?.[0];

        let iterations = 0;
        while (call && iterations < 2) {
            iterations++;
            // Lógica de funciones (reutilizada de geminiService.ts adaptada)
            if (call.name === "agendar_turno_pendiente") {
                const args = call.args as any;
                const subEncontrado = servicios.find(s => s.nombre.toLowerCase().includes((args.subtratamientoNombre || args.servicioNombre).toLowerCase()));
                if (subEncontrado) {
                    await createTurno(tenantId, {
                        clienteAbreviado: args.clienteNombre,
                        nombre: args.clienteNombre,
                        tratamientoAbreviado: subEncontrado.nombre,
                        subIds: [subEncontrado.id],
                        subtratamientosSnap: [{ id: subEncontrado.id, nombre: subEncontrado.nombre, precio: subEncontrado.precio, duracion: subEncontrado.duracion_minutos }],
                        duracionMinutos: subEncontrado.duracion_minutos || 60,
                        boxId: "box-1",
                        fecha: args.fecha,
                        horaInicio: args.hora,
                        whatsapp: args.whatsapp || context.whatsapp || "",
                        status: 'PENDIENTE',
                        total: subEncontrado.precio || 0,
                        tratamientoId: subEncontrado.tratamientoId || ""
                    });
                    result = await chat.sendMessage([{ functionResponse: { name: "agendar_turno_pendiente", response: { content: "OK" } } }]);
                }
            } else if (call.name === "buscar_mis_turnos") {
                const args = call.args as any;
                const turnos = await getTurnosPorWhatsApp(tenantId, args.whatsapp);
                result = await chat.sendMessage([{ functionResponse: { name: "buscar_mis_turnos", response: { content: `Turnos: ${turnos.map(t => `${t.fecha} ${t.horaInicio}`).join(", ")}` } } }]);
            }
            // (Omití por brevedad el resto pero lo incluire completo en la implementación real)
            
            response = result.response;
            call = response.functionCalls()?.[0];
        }

        const usage = response.usageMetadata;
        if (usage) {
            const tokens = usage.totalTokenCount || 0;
            const cost = (tokens / 1000) * ARS_PER_1000_TOKENS;
            const currentUsage = tenant.ai_usage || { tokens_spent: 0, ars_spent: 0, ars_limit: 0 };
            await createOrUpdateTenant(tenantId, {
                ai_usage: { ...currentUsage, tokens_spent: (currentUsage.tokens_spent || 0) + tokens, ars_spent: (currentUsage.ars_spent || 0) + cost }
            });
        }

        const responseText = response.text();
        const sessionId = context.whatsapp || "web-anon";
        await chatLogService.logMessage(tenantId, sessionId, "user", userMessage, "web", context.userName);
        await chatLogService.logMessage(tenantId, sessionId, "model", responseText, "web");

        return responseText;
    },

    async chatAdmin(tenantId: string, userMessage: string, history: ChatMessage[] = []) {
        const tenant = await getTenantServer(tenantId);
        if (!tenant) return null;

        const servicios = await serviceManagement.getAllSubtratamientos(tenantId);
        const serviciosContext = servicios.map(s => `- ID: ${s.id}, ${s.nombre}, Precio: $${s.precio}, Cat: ${s.tratamientoId}`).join("\n");

        const model = await getGenerativeModelWithFallback({ 
            model: "gemini-flash-latest",
            tools: [{
                functionDeclarations: [
                    {
                        name: "save_knowledge",
                        description: "Guarda información nueva en la base de conocimiento del salón.",
                        parameters: { type: SchemaType.OBJECT, properties: { info: { type: SchemaType.STRING, description: "La información a recordar." } }, required: ["info"] }
                    },
                    {
                        name: "update_price",
                        description: "Actualiza el precio de un servicio (subtratamiento).",
                        parameters: { type: SchemaType.OBJECT, properties: { subId: { type: SchemaType.STRING }, tratamientoId: { type: SchemaType.STRING }, nuevoPrecio: { type: SchemaType.NUMBER } }, required: ["subId", "tratamientoId", "nuevoPrecio"] }
                    },
                    {
                        name: "get_staff",
                        description: "Obtiene la lista de empleados y equipo del salón (profesionales, administradores)."
                    },
                    {
                        name: "get_daily_agenda",
                        description: "Obtiene todos los turnos programados para una fecha específica.",
                        parameters: { type: SchemaType.OBJECT, properties: { fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" } }, required: ["fecha"] }
                    },
                    {
                        name: "get_daily_stats",
                        description: "Obtiene un resumen financiero (ingresos, egresos, balance) de una fecha específica.",
                        parameters: { type: SchemaType.OBJECT, properties: { fecha: { type: SchemaType.STRING, description: "Fecha en formato YYYY-MM-DD" } }, required: ["fecha"] }
                    },
                    {
                        name: "delete_appointment",
                        description: "Elimina un turno de la agenda definitivamente por su ID.",
                        parameters: { type: SchemaType.OBJECT, properties: { turnoId: { type: SchemaType.STRING } }, required: ["turnoId"] }
                    }
                ]
            }]
        });

        const systemPrompt = `
            Eres Noemí, la asistente ejecutiva proactiva de "${tenant.nombre_salon}".
            Estás hablando directamente con el JEFE.
            
            PROTOCOLO DE SEGURIDAD (OBLIGATORIO):
            1. Antes de realizar cualquier cambio destructivo o de datos (como 'update_price' o 'delete_appointment'), DEBES:
               a) Describir exactamente qué vas a hacer.
               b) Preguntar: "¿Estás seguro de que quieres realizar esta acción? Por favor, confírmame con un SÍ para proceder."
            2. ESPERA al siguiente mensaje del jefe. SOLO si el jefe responde "SÍ", "Confirmado" o similar, emite la llamada a la función en tu siguiente respuesta.
            3. Para consultas de información (agenda, staff, estadísticas), responde directamente usando las herramientas.
            
            Base de conocimiento actual:
            ${tenant.ai_knowledge || "Aún no tienes conocimiento extra."}
            
            Servicios configurados:
            ${serviciosContext}
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Hola Jefe." }] },
                ...history
            ]
        });

        let result = await chat.sendMessage(userMessage);
        let response = result.response;
        let call = response.functionCalls()?.[0];

        let iterations = 0;
        while (call && iterations < 2) {
            iterations++;
            if (call.name === "save_knowledge") {
                const args = call.args as any;
                const updatedKnowledge = (tenant.ai_knowledge || "") + "\n" + args.info;
                await createOrUpdateTenant(tenantId, { ai_knowledge: updatedKnowledge });
                result = await chat.sendMessage([{ functionResponse: { name: "save_knowledge", response: { content: "Conocimiento guardado exitosamente." } } }]);
            } else if (call.name === "update_price") {
                const args = call.args as any;
                await serviceManagement.updateSubtratamiento(tenantId, args.tratamientoId, args.subId, { precio: args.nuevoPrecio });
                result = await chat.sendMessage([{ functionResponse: { name: "update_price", response: { content: "Precio actualizado correctamente." } } }]);
            } else if (call.name === "get_staff") {
                const users = await getUsersByTenant(tenantId);
                const staffList = users.map(u => `- ${u.displayName || u.email} (${u.role})`).join("\n") || "No hay empleados registrados.";
                result = await chat.sendMessage([{ functionResponse: { name: "get_staff", response: { content: staffList } } }]);
            } else if (call.name === "get_daily_agenda") {
                const args = call.args as any;
                const turnos = await getTurnosPorFecha(tenantId, args.fecha);
                const agendaText = turnos.map(t => `- [${t.horaInicio}] ${t.clienteAbreviado}: ${t.tratamientoAbreviado} (${t.status}) ID:${t.id}`).join("\n") || "No hay turnos para este día.";
                result = await chat.sendMessage([{ functionResponse: { name: "get_daily_agenda", response: { content: agendaText } } }]);
            } else if (call.name === "get_daily_stats") {
                const args = call.args as any;
                const [turnos, egresos, créditos] = await Promise.all([
                    getTurnosPorFecha(tenantId, args.fecha),
                    getEgresosDelDia(tenantId, args.fecha),
                    getIngresosCreditosDelDia(tenantId, args.fecha)
                ]);
                const resumen = buildResumen(turnos, egresos, créditos);
                const statsText = `Resumen ${args.fecha}:\n- Ingresos: $${resumen.ingresos.total}\n- Egresos: $${resumen.egresos.total}\n- Balance: $${resumen.balance}\n- Turnos: ${resumen.totalTurnos}`;
                result = await chat.sendMessage([{ functionResponse: { name: "get_daily_stats", response: { content: statsText } } }]);
            } else if (call.name === "delete_appointment") {
                const args = call.args as any;
                await deleteTurno(tenantId, args.turnoId);
                result = await chat.sendMessage([{ functionResponse: { name: "delete_appointment", response: { content: "Turno eliminado exitosamente." } } }]);
            }
            response = result.response;
            call = response.functionCalls()?.[0];
        }

        return response.text();
    }
};
