import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { topic, grade, board } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Initialize Gemini API safely using server environment variables
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Act as an expert professor and educator. Create structured study notes and 4-5 high-yield flashcards (with clear Questions and Answers) for the topic "${topic}". 
        The content must be custom-tailored precisely to the academic level of a student in ${grade}, following the ${board} curriculum standards. Keep explanations clear, academic, and direct.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        return res.status(200).json({ result: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Internal server error while generating content.' });
    }
}
