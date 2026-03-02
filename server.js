const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Check API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing!");
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// ✅ CORRECT model name as of 2025-2026
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 Deva AI backend is running!", model: GEMINI_MODEL });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", model: GEMINI_MODEL });
});

// ✅ Chat route — uses Gemini REST API directly (no SDK needed)
app.post("/api/chat", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Convert messages to Gemini format
    // Gemini uses "user" and "model" roles (not "assistant")
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Build request body
    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1500,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    // Call Gemini REST API
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("❌ Gemini API Error:", errData);
      return res.status(response.status).json({ error: errData.error?.message || "Gemini API error" });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    res.json({ reply });

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Deva AI backend running on port ${PORT}`);
  console.log(`✅ Using model: ${GEMINI_MODEL}`);
});
