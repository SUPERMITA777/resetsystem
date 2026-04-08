import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    try {
        const db = getAdminDb();
        const doc = await db.collection("tenants").doc(slug).get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: doc.data() });
    } catch (error: any) {
        console.error("[AdminAPI] Error GET:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { slug, data } = body;

        if (!slug || !data) {
            return NextResponse.json({ error: "Missing slug or data" }, { status: 400 });
        }

        const db = getAdminDb();
        await db.collection("tenants").doc(slug).set(data, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[AdminAPI] Error POST:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
