/**
 * API BRIDGE: PUENTE DE DATOS UNIVERSAL
 * Proporciona funciones de base de datos que se ejecutan en el servidor vía Proxy API.
 */

export interface QueryFilter {
    field: string;
    operator: "==" | ">" | "<" | ">=" | "<=" | "array-contains" | "in" | "array-contains-any";
    value: any;
}

// CACHE SYSTEM
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos de vida para lecturas

function getCacheKey(action: string, collection: string, docId?: string, queries?: any) {
    return JSON.stringify({ action, collection, docId, queries });
}

function clearCacheForCollection(collection: string) {
    for (const key of cache.keys()) {
        if (key.includes(`"collection":"${collection}"`)) {
            cache.delete(key);
        }
    }
}

async function fetchProxy(body: any, useCache = false) {
    const { action, collection, docId, queries, data } = body;
    
    // Solo cacheamos lecturas
    const isRead = action === "get" || action === "list" || action === "bulk-get";
    const cacheKey = getCacheKey(action, collection, docId, queries);

    if (useCache && isRead) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[API Bridge Cache] Hit: ${action} on ${collection}`);
            return cached.data;
        }
    }

    // Si es una escritura, invalidamos el caché de esa colección
    if (!isRead && action !== "batch") {
        clearCacheForCollection(collection);
    } else if (action === "batch" && data?.operations) {
        data.operations.forEach((op: any) => clearCacheForCollection(op.collection));
    }

    console.log(`[API Bridge] Action: ${action}, Collection: ${collection}, DocId: ${docId}`);
    
    // Si estamos en el servidor (Vercel/Node), usamos el SDK de Admin directamente
    if (typeof window === "undefined") {
        try {
            const { getAdminDb } = require("@/lib/firebase-admin");
            const db = getAdminDb();
            const colRef = db.collection(collection);

            console.log(`[API Bridge Server] Executing ${action} on ${collection} via Admin SDK`);

            let result: any;
            switch (action) {
                case "get":
                    const doc = await colRef.doc(docId).get();
                    result = { success: true, data: doc.exists ? { id: doc.id, ...doc.data() } : null };
                    break;

                case "list":
                    let query: any = colRef;
                    if (queries && Array.isArray(queries)) {
                        queries.forEach((q: any) => {
                            query = query.where(q.field, q.operator, q.value);
                        });
                    }
                    const snapshot = await query.get();
                    const list = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                    result = { success: true, data: list };
                    break;

                case "set":
                    await colRef.doc(docId).set(data, { merge: true });
                    result = { success: true };
                    break;

                case "add":
                    const newDoc = await colRef.add(data);
                    result = { success: true, id: newDoc.id };
                    break;

                case "update":
                    await colRef.doc(docId).set(data, { merge: true });
                    result = { success: true };
                    break;

                case "delete":
                    await colRef.doc(docId).delete();
                    result = { success: true };
                    break;

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
                    result = { success: true };
                    break;

                case "list-with-sub":
                    const { subcollection: subName } = data;
                    const parentSnap = await colRef.get();
                    const listWithSubs = await Promise.all(parentSnap.docs.map(async (d) => {
                        const sSnap = await d.ref.collection(subName).get();
                        const sData = sSnap.docs.map(sd => ({ id: sd.id, ...sd.data() }));
                        return { id: d.id, ...d.data(), [subName]: sData };
                    }));
                    result = { success: true, data: listWithSubs };
                    break;

                default:
                    throw new Error("Invalid action in server bridge");
            }

            if (isRead && useCache) {
                cache.set(cacheKey, { data: result, timestamp: Date.now() });
            }
            return result;

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

    if (isRead && useCache) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
}

export const dbGet = async (collection: string, docId: string, options = { useCache: false }) => {
    const res = await fetchProxy({ collection, docId, action: "get" }, options.useCache);
    return res.data;
};

export const dbList = async (collection: string, queries?: QueryFilter[], options = { useCache: false }) => {
    const res = await fetchProxy({ collection, action: "list", queries }, options.useCache);
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

export const dbBatch = async (operations: BatchOperation[]): Promise<void> => {
    await fetchProxy({ action: "batch", collection: "_batch", data: { operations } });
};

export const dbListWithSub = async (collection: string, subcollection: string, options = { useCache: false }) => {
    const res = await fetchProxy({ collection, action: "list-with-sub", data: { subcollection } }, options.useCache);
    return res.data;
};

