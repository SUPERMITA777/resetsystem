import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * PROXY UNIVERSAL DE ADMINISTRACIÓN
 * Permite realizar operaciones en cualquier colección de Firestore desde el servidor,
 * evitando los errores de permisos "Missing or insufficient permissions" en el cliente.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { collection, docId, action, data, queries } = body;

        if (!collection || !action) {
            return NextResponse.json({ error: "Missing collection or action" }, { status: 400 });
        }

        const db = getAdminDb();
        const colRef = db.collection(collection);

        switch (action) {
            case "get":
                if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });
                const doc = await colRef.doc(docId).get();
                return NextResponse.json({ 
                    success: true, 
                    data: doc.exists ? { id: doc.id, ...doc.data() } : null 
                });

            case "list":
                let query: any = colRef;
                if (queries && Array.isArray(queries)) {
                    queries.forEach((q: any) => {
                        const { field, operator, value } = q;
                        query = query.where(field, operator, value);
                    });
                }
                const snapshot = await query.get();
                const list = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                return NextResponse.json({ success: true, data: list });

            case "set":
                if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });
                await colRef.doc(docId).set(data, { merge: true });
                return NextResponse.json({ success: true });

            case "add":
                const newDoc = await colRef.add(data);
                return NextResponse.json({ success: true, id: newDoc.id });

            case "update":
                if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });
                await colRef.doc(docId).update(data);
                return NextResponse.json({ success: true });

            case "delete":
                if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });
                await colRef.doc(docId).delete();
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("[ProxyAPI] Error:", error);
        return NextResponse.json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}
