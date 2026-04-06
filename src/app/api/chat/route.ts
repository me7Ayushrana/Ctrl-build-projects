import { CohereClient } from "cohere-ai";
import { NextResponse } from "next/server";

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || "PLACEHOLDER",
});

const SYSTEM_PROMPT = `
You are "Nexus AI", the premium Hackathon Guru for the DevMatch platform. 
Your goal is to help developers find teammates, refine their project ideas, and navigate the platform. 

Personality:
- Professional, high-tech, and encouraging.
- Use terms like "Neural DNA Mapping", "Squad formation", and "Elite tech stack".
- Be concise but insightful.
- Encourage users to complete their Builder Profile if they haven't yet.

Context: 
DevMatch is a high-end platform for matching developers based on their tech stack, role, and work style. 
Features include:
- AI-Powered Analyzer (scans GitHub repos).
- Perfect Matchmaking (based on tech stack DNA).
- Project Roadmap Modal (showing live and future features).

If asked about your identity, you are the platform's native AI core.
`;

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!process.env.COHERE_API_KEY) {
            return NextResponse.json(
                { message: "I'm currently in 'Offline Mode' (missing API Key). But I can tell you that DevMatch is looking premium!" },
                { status: 200 }
            );
        }

        const response = await cohere.chat({
            message,
            model: "command-r-plus",
            preamble: SYSTEM_PROMPT,
            chatHistory: history || [],
        });

        return NextResponse.json({
            message: response.text,
            history: [
                ...(history || []),
                { role: "USER", message },
                { role: "CHATBOT", message: response.text },
            ],
        });
    } catch (error) {
        console.error("Cohere API Error:", error);
        return NextResponse.json(
            { error: "Nexus AI is currently recalibrating. Please try again in a moment." },
            { status: 500 }
        );
    }
}
