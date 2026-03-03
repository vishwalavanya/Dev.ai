const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Check API key
if (!process.env.SAMBANOVA_API_KEY) {
  console.error("❌ SAMBANOVA_API_KEY is missing!");
  process.exit(1);
}

const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY;
const SAMBANOVA_URL = "https://api.sambanova.ai/v1/chat/completions";
const MODEL = "gpt-oss-120b"; // ✅ Free / OSS model

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 Deva AI backend is running!", model: MODEL });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", model: MODEL });
});

// ✅ Chat route (LOGIC UNCHANGED)
app.post("/api/chat", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Build messages array (same logic)
    const chatMessages = [];

    if (systemPrompt) {
      chatMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.forEach((m) => {
      chatMessages.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      });
    });

    // ✅ Sambanova API call (ONLY CHANGE)
    const response = await fetch(SAMBANOVA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        max_tokens: 4000,
        temperature: 0.9,
        stream: false, // ✅ CLEAN OUTPUT ONLY
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Sambanova API Error:", errText);
      return res.status(response.status).json({
        error: "Sambanova API error",
      });
    }

    const data = await response.json();

    // ✅ Same output format as before
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
