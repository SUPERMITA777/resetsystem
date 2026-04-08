import { NextResponse } from "next/server";
import { geminiServerService } from "@/lib/services/geminiServerService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { tenantId, message, history, type, context, audio } = body;

        if (!tenantId || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let responseText = "";

        if (type === "noemi") {
            responseText = await geminiServerService.chatNoemi(tenantId, message, history, context, audio) || "";
        } else if (type === "admin") {
            responseText = await geminiServerService.chatAdmin(tenantId, message, history) || "";
        } else {
            return NextResponse.json({ error: "Invalid chat type" }, { status: 400 });
        }

        return NextResponse.json({ reply: responseText });

    } catch (error: any) {
        console.error("[API AI Chat Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
