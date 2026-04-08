import { dbAdd, dbList, dbUpdate, dbGet, dbSet } from "./apiBridge";

export interface ChatLog {
    id?: string;
    tenantId: string;
    sessionId: string; // Puede ser el ID de un cliente o un ID aleatorio para la web
    clientName?: string;
    messages: {
        role: "user" | "model";
        parts: { text: string }[];
        timestamp: Date | any;
    }[];
    status: "active" | "ended";
    platform: "web" | "whatsapp" | "instagram";
    createdAt: Date | any;
    updatedAt: Date | any;
}

const COLLECTION_NAME = "chat_logs";

export const chatLogService = {
    /**
     * Guarda o actualiza un log de chat.
     * Si no existe una sesión activa para este sessionId, crea una nueva.
     */
    async logMessage(tenantId: string, sessionId: string, role: "user" | "model", text: string, platform: "web" | "whatsapp" | "instagram" = "web", clientName?: string) {
        try {
            // Buscamos si hay una sesión activa reciente (última hora)
            const logs = await dbList(COLLECTION_NAME, [
                { field: "tenantId", operator: "==", value: tenantId },
                { field: "sessionId", operator: "==", value: sessionId },
                { field: "status", operator: "==", value: "active" }
            ]);

            const activeLog = logs.length > 0 ? logs[0] : null;

            const newMessage = {
                role,
                parts: [{ text }],
                timestamp: new Date()
            };

            if (activeLog) {
                // Actualizar log existente
                const updatedMessages = [...(activeLog.messages || []), newMessage];
                await dbUpdate(COLLECTION_NAME, activeLog.id, {
                    messages: updatedMessages,
                    updatedAt: new Date(),
                    clientName: clientName || activeLog.clientName
                });
            } else {
                // Crear nuevo log
                const newLog: Omit<ChatLog, "id"> = {
                    tenantId,
                    sessionId,
                    clientName: clientName || "Cliente Web",
                    messages: [newMessage],
                    status: "active",
                    platform,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                await dbAdd(COLLECTION_NAME, newLog);
            }
        } catch (error) {
            console.error("Error logging chat message:", error);
        }
    },

    /**
     * Obtiene los logs de un salón.
     */
    async getLogsByTenant(tenantId: string): Promise<ChatLog[]> {
        return await dbList(COLLECTION_NAME, [
            { field: "tenantId", operator: "==", value: tenantId }
        ]);
    },

    /**
     * Finaliza una sesión de chat.
     */
    async endSession(tenantId: string, sessionId: string) {
        const logs = await dbList(COLLECTION_NAME, [
            { field: "tenantId", operator: "==", value: tenantId },
            { field: "sessionId", operator: "==", value: sessionId },
            { field: "status", operator: "==", value: "active" }
        ]);

        if (logs.length > 0) {
            await dbUpdate(COLLECTION_NAME, logs[0].id, { status: "ended" });
        }
    }
};
