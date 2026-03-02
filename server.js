const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Check API key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing!");
  process.exit(1);
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // ✅ cheapest + fast + very capable

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 Deva AI backend is running!", model: MODEL });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", model: MODEL });
});

// ✅ Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Build OpenAI messages array
    const openaiMessages = [];

    // Add system prompt first
    if (systemPrompt) {
      openaiMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Add conversation history
    messages.forEach((m) => {
      openaiMessages.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      });
    });

    // Call OpenAI API
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: openaiMessages,
        max_tokens: 1500,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("❌ OpenAI API Error:", errData);
      return res.status(response.status).json({
        error: errData.error?.message || "OpenAI API error",
      });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "No response received.";

    res.json({ reply });
  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Deva AI backend running on port ${PORT}`);
  console.log(`✅ Using model: ${MODEL}`);
});
