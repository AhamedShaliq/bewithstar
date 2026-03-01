require('dotenv').config();

async function listAll() {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

listAll();
