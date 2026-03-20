import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, Timestamp } from "firebase/firestore";

export interface TarotCard {
    id: string;
    nombre: string;
    significado_normal: string;
    significado_invertido: string;
    imagen_url: string;
    createdAt?: Timestamp;
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
    createdAt: Timestamp;
}

const CARDS_COLLECTION = "tarot_cards";
const READINGS_COLLECTION = "tarot_readings";

export const tarotService = {
    async getAllCards(): Promise<TarotCard[]> {
        const snap = await getDocs(query(collection(db, CARDS_COLLECTION), orderBy("id", "asc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as TarotCard));
    },

    async getCard(id: string): Promise<TarotCard | null> {
        const snap = await getDoc(doc(db, CARDS_COLLECTION, id));
        return snap.exists() ? ({ id: snap.id, ...snap.data() } as TarotCard) : null;
    },

    async saveCard(card: TarotCard): Promise<void> {
        await setDoc(doc(db, CARDS_COLLECTION, card.id), {
            ...card,
            createdAt: card.createdAt || Timestamp.now()
        }, { merge: true });
    },

    async saveReading(reading: Omit<TarotReading, "id">): Promise<string> {
        const ref = doc(collection(db, READINGS_COLLECTION));
        await setDoc(ref, reading);
        return ref.id;
    },

    async seedCards(cards: TarotCard[]): Promise<void> {
        const batch = cards.map(c => this.saveCard(c));
        await Promise.all(batch);
    }
};
