import { dbGet, dbList, dbAdd, dbSet, dbUpdate } from "./apiBridge";

export interface TarotCard {
    id: string;
    nombre: string;
    significado_normal: string;
    significado_invertido: string;
    imagen_url: string;
    createdAt?: any;
}

export interface TarotReading {
    id?: string;
    tenantId: string;
    usuario: string;
    pregunta: string;
    cartas: {
        id: string;
        nombre: string;
        invertida: boolean;
        significado: string;
    }[];
    interpretacion: string;
    createdAt: any;
}

const CARDS_COLLECTION = "tarot_cards";
const READINGS_COLLECTION = "tarot_readings";

export const tarotService = {
    async getAllCards(): Promise<TarotCard[]> {
        const list = await dbList(CARDS_COLLECTION);
        return list.sort((a: any, b: any) => a.id.localeCompare(b.id));
    },

    async getCard(id: string): Promise<TarotCard | null> {
        return await dbGet(CARDS_COLLECTION, id);
    },

    async saveCard(card: TarotCard): Promise<void> {
        await dbSet(CARDS_COLLECTION, card.id, {
            ...card,
            createdAt: card.createdAt || new Date().toISOString()
        });
    },

    async saveReading(reading: Omit<TarotReading, "id">): Promise<string> {
        const res = await dbAdd(READINGS_COLLECTION, {
            ...reading,
            createdAt: new Date().toISOString()
        });
        return res.id;
    },

    async getReadingsByTenant(tenantId: string): Promise<TarotReading[]> {
        const list = await dbList(READINGS_COLLECTION, [
            { field: "tenantId", operator: "==", value: tenantId }
        ]);
        return list.sort((a: any, b: any) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 50);
    },

    async seedCards(cards: TarotCard[]): Promise<void> {
        const batch = cards.map(c => this.saveCard(c));
        await Promise.all(batch);
    }
};
