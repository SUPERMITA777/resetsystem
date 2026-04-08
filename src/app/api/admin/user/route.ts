import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
        return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    try {
        const db = getAdminDb();
        const doc = await db.collection("users").doc(uid).get();

        if (!doc.exists) {
            // No devolvemos 404 para no romper el AuthProvider
            // Simplemente indicamos que no hay perfil aún
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: doc.data() });
    } catch (error: any) {
        console.error("[UserAPI] Error GET:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
