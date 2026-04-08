/**
 * BRIDGE DE COMUNICACIÓN CON EL PROXY DE ADMINISTRACIÓN
 * Proporciona funciones de utilidad para interactuar con la base de datos 
 * a través del servidor en lugar de hacerlo directamente desde el cliente.
 */

interface ProxyQuery {
    field: string;
    operator: "==" | ">" | "<" | ">=" | "<=" | "array-contains" | "in" | "array-contains-any";
    value: any;
}

interface ProxyRequest {
    collection: string;
    action: "get" | "list" | "set" | "add" | "update" | "delete";
    docId?: string;
    data?: any;
    queries?: ProxyQuery[];
}

export async function callProxy(req: ProxyRequest) {
    try {
        const res = await fetch("/api/admin/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Error en el Puente de Datos");
        
        return result.data !== undefined ? result.data : result;
    } catch (error) {
        console.error(`[ApiBridge] Error en ${req.collection}/${req.action}:`, error);
        throw error;
    }
}

// Helpers para simplificar el uso
export const dbGet = (collection: string, docId: string) => callProxy({ collection, action: "get", docId });
export const dbList = (collection: string, queries?: ProxyQuery[]) => callProxy({ collection, action: "list", queries });
export const dbSet = (collection: string, docId: string, data: any) => callProxy({ collection, action: "set", docId, data });
export const dbAdd = (collection: string, data: any) => callProxy({ collection, action: "add", data });
export const dbUpdate = (collection: string, docId: string, data: any) => callProxy({ collection, action: "update", docId, data });
export const dbDelete = (collection: string, docId: string) => callProxy({ collection, action: "delete", docId });
