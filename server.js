const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// 🔎 Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in environment variables");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Health route
app.get("/", (req, res) => {
  res.json({ message: "Deva AI backend is running 🚀" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt || "You are a helpful assistant",
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(lastMessage);

    res.json({
      reply: result.response.text(),
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Deva AI backend running on port ${PORT}`);
});
