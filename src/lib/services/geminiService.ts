import { Part } from "@google/generative-ai";

export interface ChatMessage {
    role: "user" | "model";
    parts: Part[];
}

export interface AudioData {
    data: string; // base64
    mimeType: string;
}

/**
 * Servicio para interactuar con Google Gemini a través del API Proxy Seguro.
 * Este archivo se puede llamar desde componentes del cliente sin exponer API Keys.
 */
export const geminiService = {
    async chatNoemi(tenantId: string, userMessage: string, history: ChatMessage[] = [], context: { userName?: string, whatsapp?: string } = {}, audio?: AudioData) {
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    message: userMessage,
                    history,
                    type: "noemi",
                    context,
                    audio
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en el chat de Noemí");
            return data.reply ? `⚡ ${data.reply}` : null;
        } catch (error) {
            console.error("Error en chatNoemi:", error);
            throw error;
        }
    },

    async chatVeronica(tenantId: string, userMessage: string, history: ChatMessage[] = [], audio?: AudioData) {
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    message: userMessage,
                    history,
                    type: "veronica",
                    audio
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en el chat de Verónica");
            return data.reply ? `⚡ ${data.reply}` : null;
        } catch (error) {
            console.error("Error en chatVeronica:", error);
            throw error;
        }
    },

    async chatAdmin(tenantId: string, userMessage: string, history: ChatMessage[] = []) {
        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    message: userMessage,
                    history,
                    type: "admin"
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error en el chat administrativo");
            return data.reply ? `⚡ ${data.reply}` : null;
        } catch (error) {
            console.error("Error en chatAdmin:", error);
            throw error;
        }
    }
};
