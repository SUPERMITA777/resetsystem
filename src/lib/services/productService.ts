import { db } from "../firebase";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
} from "firebase/firestore";

export interface Producto {
    id: string;
    nombre: string;
    marca: string;
    categoria: string;
    descripcion?: string;
    precio: number;
    precio_costo: number;
    imagenes?: string[];
    createdAt?: number;
}

export const productService = {
    async createProducto(tenantId: string, data: Omit<Producto, "id">): Promise<string> {
        const ref = collection(db, "tenants", tenantId, "productos");
        const newDoc = doc(ref);
        await setDoc(newDoc, { ...data, id: newDoc.id, createdAt: Date.now() });
        return newDoc.id;
    },

    async getProductos(tenantId: string): Promise<Producto[]> {
        const ref = collection(db, "tenants", tenantId, "productos");
        const snap = await getDocs(ref);
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as Producto));
    },

    async updateProducto(tenantId: string, id: string, data: Partial<Producto>): Promise<void> {
        const ref = doc(db, "tenants", tenantId, "productos", id);
        await updateDoc(ref, data as any);
    },

    async deleteProducto(tenantId: string, id: string): Promise<void> {
        if (!tenantId || !id) throw new Error("Parámetros faltantes para eliminar producto");
        const ref = doc(db, "tenants", tenantId, "productos", id);
        await deleteDoc(ref);
    },
};
