require('dotenv').config();

async function testFetch() {
    const apiKey = process.env.GEMINI_API_KEY;
    // Let's try the 2.5-flash-lite as a last resort
    const model = "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const body = {
        contents: [{
            parts: [{ text: "Say Hello" }]
        }]
    };

    try {
        console.log(`Sending direct fetch to ${url}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Success:", data.candidates[0].content.parts[0].text);
        } else {
            console.error("❌ Failed:", data.error ? data.error.message : "Unknown error");
            console.log("Full Error Code:", data.error ? data.error.status : "N/A");
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testFetch();
