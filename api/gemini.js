export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { topic, grade, board } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
        }

        const prompt = `Act as an expert educator. Provide structured study notes and flashcards for the topic: "${topic}". The content must be custom-tailored precisely to the academic level of a student in ${grade}, following the ${board} curriculum standards. Break it down into clear sections using headings (##) and short bullet point facts optimized for student flashcards.`;

        // Using the ultra-fast Gemini 3.5 Flash production endpoint
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await geminiRes.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Gemini API Error' });
        }

        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        return res.status(200).json({ result: textResult });

    } catch (error) {
        console.error("Server Execution Error:", error);
        return res.status(500).json({ error: error.message || 'Internal server error while generating content.' });
    }
}
