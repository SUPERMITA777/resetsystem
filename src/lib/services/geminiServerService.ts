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
import { es } from "date-fns/locale";
import { claseService } from "./claseService";
import { clienteService } from "./clienteService";

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
        const diaSemana = format(now, 'EEEE', { locale: es });

        const systemPrompt = `
            Eres Noemí, la experta en ventas de "${tenant.nombre_salon}". Estamos en ARGENTINA.
            Fecha actual: ${fechaActual} (${diaSemana})
            Conocimiento extra: ${tenant.ai_knowledge || "Ninguno."}
            Reglas de comportamiento: ${tenant.ai_config.noemi.rules || "Ninguna."}
            Información del cliente: ${context.userName || "Desconocido"}, WhatsApp: ${context.whatsapp || "Desconocido"}
            Servicios disponibles:\n${serviciosContext}
            Instrucciones: 
            - Tono "${tenant.ai_config.noemi.tone}". Usa emojis.
            - IMPORTANTE: Si al consultar disponibilidad (consultar_disponibilidad) no encuentras horarios, NUNCA te quedes callada. Informa al cliente que no hay disponibilidad automática y dile explícitamente que un representante humano lo contactará de inmediato para ofrecerle un turno personalizado.
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
            } else if (call.name === "consultar_disponibilidad") {
                const args = call.args as any;
                const treatment = (await serviceManagement.getTratamientos(tenantId)).find(t => 
                    t.nombre.toLowerCase().includes(args.servicioNombre.toLowerCase())
                );
                
                if (treatment) {
                    const slots = await availabilityService.getAvailableSlots(tenantId, treatment.id, new Date(args.fecha));
                    const responseContent = slots.length > 0 
                        ? `Horarios disponibles para ${treatment.nombre} el ${args.fecha}: ${slots.join(", ")}`
                        : `No hay horarios disponibles para ${treatment.nombre} el ${args.fecha}. SUGERENCIA: Informa al cliente que no hay disponibilidad automática y dile que un representante humano lo contactará de inmediato para ofrecerle una alternativa personalizada.`;
                    result = await chat.sendMessage([{ functionResponse: { name: "consultar_disponibilidad", response: { content: responseContent } } }]);
                } else {
                    result = await chat.sendMessage([{ functionResponse: { name: "consultar_disponibilidad", response: { content: "Servicio no encontrado." } } }]);
                }
            } else if (call.name === "buscar_mis_turnos") {
                const args = call.args as any;
                const turnos = await getTurnosPorWhatsApp(tenantId, args.whatsapp);
                result = await chat.sendMessage([{ functionResponse: { name: "buscar_mis_turnos", response: { content: `Turnos: ${turnos.map(t => `${t.fecha} ${t.horaInicio} (${t.tratamientoAbreviado})`).join(", ")}` } } }]);
            } else if (call.name === "modificar_turno") {
                const args = call.args as any;
                await updateTurno(tenantId, args.turnoId, args.data);
                result = await chat.sendMessage([{ functionResponse: { name: "modificar_turno", response: { content: "Turno modificado exitosamente." } } }]);
            }
            
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
                        description: "Obtiene la lista de empleados y equipo del salón (profesionales, administradores).",
                        parameters: { type: SchemaType.OBJECT, properties: {} }
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
                    },
                    {
                        name: "get_clients",
                        description: "Busca clientes en la base de datos por nombre o teléfono.",
                        parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Nombre o WhatsApp del cliente" } }, required: ["query"] }
                    },
                    {
                        name: "create_appointment",
                        description: "Crea un nuevo turno para tratamiento.",
                        parameters: { 
                            type: SchemaType.OBJECT, 
                            properties: { 
                                clienteNombre: { type: SchemaType.STRING },
                                tratamientoId: { type: SchemaType.STRING },
                                subIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                fecha: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                                hora: { type: SchemaType.STRING, description: "HH:mm" },
                                whatsapp: { type: SchemaType.STRING },
                                profesionalId: { type: SchemaType.STRING },
                                total: { type: SchemaType.NUMBER }
                            }, 
                            required: ["clienteNombre", "tratamientoId", "fecha", "hora", "profesionalId"] 
                        }
                    },
                    {
                        name: "enroll_client_class",
                        description: "Inscribe a un cliente en una clase grupal.",
                        parameters: { 
                            type: SchemaType.OBJECT, 
                            properties: { 
                                clienteNombre: { type: SchemaType.STRING },
                                claseId: { type: SchemaType.STRING },
                                fecha: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                                hora: { type: SchemaType.STRING, description: "HH:mm" },
                                whatsapp: { type: SchemaType.STRING }
                            }, 
                            required: ["clienteNombre", "claseId", "fecha", "hora"] 
                        }
                    },
                    {
                        name: "get_class_list",
                        description: "Obtiene la lista de clases grupales configuradas.",
                        parameters: { type: SchemaType.OBJECT, properties: {} }
                    }
                ]
            }]
        });

        const now = new Date();
        const fechaActual = format(now, 'yyyy-MM-dd');
        const diaSemana = format(now, 'EEEE', { locale: es });

        const systemPrompt = `
            Eres Noemí, la secretaria ejecutiva y asistente de acceso total de "${tenant.nombre_salon}".
            Tienes PODER TOTAL sobre el sistema para ayudar al JEFE a gestionar el negocio.
            
            UBICACIÓN TEMPORAL (ARGENTINA):
            - Fecha actual: ${fechaActual}
            - Día de la semana: ${diaSemana}
            
            PROTOCOLO DE CONFIRMACIÓN (ESTRICTO):
            1. Para cualquier acción que CREE, MODIFIQUE o ELIMINE datos (turnos, precios, inscripciones), DEBES:
               a) Explicar qué vas a hacer.
               b) Preguntar: "¿Confirma que desea realizar esta acción, Jefe?" (o similar).
               c) SOLO después de que el jefe diga "SÍ", "Procedé", "Dale" o similar, ejecutas la herramienta en el siguiente turno.
            2. NUNCA ejecutes una acción de escritura sin confirmación previa del jefe.
            3. Para consultas (ver agenda, buscar clientes, ver precios), responde directamente usando las herramientas.
            
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
            } else if (call.name === "get_clients") {
                const args = call.args as any;
                const clients = await clienteService.getClientes(tenantId);
                const query = args.query.toLowerCase();
                const filtered = clients.filter(c => 
                    c.nombre.toLowerCase().includes(query) || 
                    c.apellido?.toLowerCase().includes(query) || 
                    c.telefono?.includes(query)
                ).slice(0, 10);
                const responseList = filtered.map(c => `- ${c.nombre} ${c.apellido || ""}: WA:${c.telefono} (ID:${c.id})`).join("\n") || "No se encontraron clientes.";
                result = await chat.sendMessage([{ functionResponse: { name: "get_clients", response: { content: responseList } } }]);
            } else if (call.name === "get_class_list") {
                const classes = await claseService.getClases(tenantId);
                const listText = classes.map(c => `- ${c.nombre} ($${c.valorCreditos || 0}): Duración ${c.duracion}min (ID:${c.id})`).join("\n") || "No hay clases configuradas.";
                result = await chat.sendMessage([{ functionResponse: { name: "get_class_list", response: { content: listText } } }]);
            } else if (call.name === "create_appointment") {
                const args = call.args as any;
                const treatment = (await serviceManagement.getTratamientos(tenantId)).find(t => t.id === args.tratamientoId);
                const subtratamientos = args.subIds ? servicios.filter(s => args.subIds.includes(s.id)) : [];
                
                const turnoId = await createTurno(tenantId, {
                    clienteAbreviado: args.clienteNombre,
                    tratamientoAbreviado: treatment?.nombre || "Tratamiento",
                    tratamientoId: args.tratamientoId,
                    subIds: args.subIds || [],
                    fecha: args.fecha,
                    horaInicio: args.hora,
                    whatsapp: args.whatsapp || "",
                    profesionalId: args.profesionalId,
                    duracionMinutos: subtratamientos.reduce((acc, s) => acc + (s?.duracion_minutos || 0), 0) || 60,
                    total: args.total || subtratamientos.reduce((acc, s) => acc + (s?.precio || 0), 0),
                    boxId: "box-1", // Default box
                    status: "CONFIRMADO"
                });
                result = await chat.sendMessage([{ functionResponse: { name: "create_appointment", response: { content: `Turno agendado con ID: ${turnoId}` } } }]);
            } else if (call.name === "enroll_client_class") {
                const args = call.args as any;
                const clase = await claseService.getClaseById(tenantId, args.claseId);
                const turnoId = await createTurno(tenantId, {
                    clienteAbreviado: args.clienteNombre,
                    tratamientoAbreviado: clase?.nombre || "Clase",
                    claseId: args.claseId,
                    fecha: args.fecha,
                    horaInicio: args.hora,
                    whatsapp: args.whatsapp || "",
                    boxId: clase?.boxId || "aula-1",
                    duracionMinutos: clase?.duracion || 60,
                    status: "CONFIRMADO"
                });
                result = await chat.sendMessage([{ functionResponse: { name: "enroll_client_class", response: { content: `Inscripción realizada con ID: ${turnoId}` } } }]);
            }
            response = result.response;
            call = response.functionCalls()?.[0];
        }

        return response.text();
    }
};
