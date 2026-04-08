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
    
    // Si estamos en el servidor (Vercel/Node), usamos el SDK de Admin directamente
    // para evitar recursión HTTP y problemas de concurrencia/timeout.
    if (typeof window === "undefined") {
        try {
            // Usamos require dinámico para que el bundle del cliente no intente incluir firebase-admin
            const { getAdminDb } = require("@/lib/firebase-admin");
            const db = getAdminDb();
            const { collection, docId, action, data, queries } = body;
            const colRef = db.collection(collection);

            console.log(`[API Bridge Server] Executing ${action} on ${collection} via Admin SDK`);

            switch (action) {
                case "get":
                    const doc = await colRef.doc(docId).get();
                    return { success: true, data: doc.exists ? { id: doc.id, ...doc.data() } : null };

                case "list":
                    let query: any = colRef;
                    if (queries && Array.isArray(queries)) {
                        queries.forEach((q: any) => {
                            query = query.where(q.field, q.operator, q.value);
                        });
                    }
                    const snapshot = await query.get();
                    const list = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                    return { success: true, data: list };

                case "set":
                    await colRef.doc(docId).set(data, { merge: true });
                    return { success: true };

                case "add":
                    const newDoc = await colRef.add(data);
                    return { success: true, id: newDoc.id };

                case "update":
                    await colRef.doc(docId).set(data, { merge: true });
                    return { success: true };

                case "delete":
                    await colRef.doc(docId).delete();
                    return { success: true };

                case "batch":
                    const { operations } = data;
                    const batch = db.batch();
                    operations.forEach((op: any) => {
                        const ref = db.collection(op.collection).doc(op.docId);
                        if (op.type === "set") batch.set(ref, op.data, { merge: true });
                        else if (op.type === "update") batch.update(ref, op.data);
                        else if (op.type === "delete") batch.delete(ref);
                        else if (op.type === "create") batch.set(ref, op.data);
                    });
                    await batch.commit();
                    return { success: true };

                default:
                    throw new Error("Invalid action in server bridge");
            }
        } catch (serverError: any) {
            console.error("[API Bridge Server Error]:", serverError);
            throw serverError;
        }
    }
    
    // CLIENT SIDE: Usamos fetch a la API Proxy normalmente
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
