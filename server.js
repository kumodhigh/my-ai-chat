const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `You are Aria, a friendly and intelligent personal assistant.
  Your personality:
  - Warm, helpful and conversational
  - Give clear and concise answers, never too long
  - If you don't know something, say so honestly
  - Use simple language, avoid unnecessary jargon
  - Occasionally use light humor to keep things friendly
  - Always end by asking if there is anything else you can help with`
});

app.use(express.json());
app.use(express.static("public"));

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const history = req.body.history || [];

  if (!userMessage) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 },
    });

    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();
    res.json({ reply: reply });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Something went wrong with the AI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});