import { dbGet, dbList, dbUpdate, dbDelete, dbAdd } from "./apiBridge";

export interface Producto {
    id: string;
    nombre: string;
    marca: string;
    categoria: string;
    descripcion?: string;
    precio: number;
    precio_costo: number;
    stock?: number;  // cantidad disponible en inventario
    imagenes?: string[];
    createdAt?: number;
}

export interface CarritoItem {
    producto: Producto;
    cantidad: number;
}

export const productService = {
    async createProducto(tenantId: string, data: Omit<Producto, "id">): Promise<string> {
        const res = await dbAdd(`tenants/${tenantId}/productos`, { ...data, createdAt: Date.now() });
        await dbUpdate(`tenants/${tenantId}/productos`, res.id, { id: res.id });
        return res.id;
    },

    async getProductos(tenantId: string): Promise<Producto[]> {
        return await dbList(`tenants/${tenantId}/productos`);
    },

    async updateProducto(tenantId: string, id: string, data: Partial<Producto>): Promise<void> {
        await dbUpdate(`tenants/${tenantId}/productos`, id, data);
    },

    async deleteProducto(tenantId: string, id: string): Promise<void> {
        await dbDelete(`tenants/${tenantId}/productos`, id);
    },

    /**
     * Decrement product stock.
     */
    async decrementStock(tenantId: string, productoId: string, cantidad: number): Promise<void> {
        const product = await dbGet(`tenants/${tenantId}/productos`, productoId);
        if (product) {
            const currentStock = product.stock || 0;
            await dbUpdate(`tenants/${tenantId}/productos`, productoId, { 
                stock: currentStock - cantidad 
            });
        }
    },
};
