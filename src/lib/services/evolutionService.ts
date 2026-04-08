const API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080';
const GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || '';

const headers = {
    'apikey': GLOBAL_KEY,
    'Content-Type': 'application/json'
};

export const evolutionService = {
    /**
     * Crea una nueva instancia de WhatsApp para el salón si no existe.
     */
    async createInstance(instanceName: string, type: 'whatsapp' | 'instagram' = 'whatsapp', customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            const response = await fetch(`${baseUrl}/instance/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    instanceName,
                    token: '',
                    qrcode: true,
                    type: type // 'whatsapp' or 'instagram'
                })
            });
            return await response.json();
        } catch (error: any) {
            console.error('Error creating instance:', error);
            return null;
        }
    },

    /**
     * Envía un mensaje de texto a un destino (número o ID de Instagram).
     */
    async sendMessage(instanceName: string, number: string, text: string, customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            const response = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    number,
                    text,
                    delay: 1000,
                    linkPreview: true
                })
            });
            return await response.json();
        } catch (error: any) {
            console.error('Error sending message:', error);
            return null;
        }
    },

    /**
     * Obtiene el código QR actual de la instancia.
     */
    async getConnectQR(instanceName: string, customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
                headers
            });
            return await response.json();
        } catch (error: any) {
            console.error('Error getting QR:', error);
            return null;
        }
    },

    /**
     * Consulta el estado de la conexión.
     */
    async checkConnection(instanceName: string, customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
                headers
            });
            return await response.json();
        } catch (error: any) {
            console.error('Error checking connection:', error);
            return { instance: { state: 'DISCONNECTED' } };
        }
    },

    /**
     * Cierra la sesión y detiene la instancia.
     */
    async logoutInstance(instanceName: string, customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers
            });
            await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
                method: 'DELETE',
                headers
            });
            return true;
        } catch (error: any) {
            console.error('Error logging out:', error);
            return false;
        }
    },
    /**
     * Envía un estado de presencia (composing, recording, etc.) a un chat.
     */
    async sendPresence(instanceName: string, number: string, presence: 'composing' | 'recording' | 'paused' = 'composing', customUrl?: string) {
        const baseUrl = customUrl || API_URL;
        try {
            await fetch(`${baseUrl}/chat/sendPresence/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    number,
                    delay: 0,
                    presence
                })
            });
            return true;
        } catch (error: any) {
            console.error('Error sending presence:', error);
            return false;
        }
    }
};
