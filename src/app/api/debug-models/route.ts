import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // This hits v1beta usually
        const result = await genAI.listModels();
        const models = result.models.map(m => ({
            name: m.name,
            version: m.version,
            displayName: m.displayName,
            supportedMethods: m.supportedGenerationMethods
        }));

        return NextResponse.json({ 
            success: true, 
            apiKeyConfigured: !!apiKey,
            models 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
