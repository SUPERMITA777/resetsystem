import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateInterpretacion(prompt: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada. Por favor, agregala a tus variables de entorno.");
    }
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
