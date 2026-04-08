/**
 * API BRIDGE: PUENTE DE DATOS UNIVERSAL
 * Proporciona funciones de base de datos que se ejecutan en el servidor vía Proxy API.
 */

export interface QueryFilter {
    field: string;
    operator: "==" | ">" | "<" | ">=" | "<=" | "array-contains" | "in" | "array-contains-any";
    value: any;
}

async function fetchProxy(body: any) {
    console.log(`[API Bridge] Action: ${body.action}, Collection: ${body.collection}, DocId: ${body.docId}`);
    const res = await fetch("/api/admin/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.success) {
        console.error(`[API Bridge] Error in ${body.action}:`, result.error);
        throw new Error(result.error || "Proxy API Error");
    }
    return result;
}

export const dbGet = async (collection: string, docId: string) => {
    const res = await fetchProxy({ collection, docId, action: "get" });
    return res.data;
};

export const dbList = async (collection: string, queries?: QueryFilter[]) => {
    const res = await fetchProxy({ collection, action: "list", queries });
    return res.data;
};

export const dbSet = async (collection: string, docId: string, data: any) => {
    await fetchProxy({ collection, docId, action: "set", data });
};

export const dbAdd = async (collection: string, data: any) => {
    const res = await fetchProxy({ collection, action: "add", data });
    return { id: res.id };
};

export const dbUpdate = async (collection: string, docId: string, data: any) => {
    await fetchProxy({ collection, docId, action: "update", data });
};

export const dbDelete = async (collection: string, docId: string) => {
    await fetchProxy({ collection, docId, action: "delete" });
};

export interface BatchOperation {
    type: "set" | "update" | "delete" | "create";
    collection: string;
    docId: string;
    data?: any;
}

export const dbBatch = async (operations: BatchOperation[]) => {
    // Usamos una colección ficticia para el batch ya que el proxy espera una
    await fetchProxy({ collection: "multi", action: "batch", data: { operations } });
};
