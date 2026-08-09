export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic } = req.body;
    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server API key is not configured' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Provide a structured set of study notes for the topic: ${topic}. Break it down into clear sections using headings (##) and short bullet point facts optimized for student flashcards.`
                    }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const geminiAnswer = data.candidates[0].content.parts[0].text.trim();
        return res.status(200).json({ answer: geminiAnswer });

    } catch (error) {
        return res.status(500).json({ error: 'Failed to connect to Google Gemini' });
    }
}
