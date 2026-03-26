const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All agents defined here — add more anytime
const agents = {
  aria: {
    name: "Aria",
    welcome: "Hi there! I'm Aria, your personal assistant. I can help you with anything — questions, ideas, planning, advice, or just a chat. What's on your mind? 😊",
    instruction: `You are Aria, a friendly and intelligent personal assistant.
    - Warm, helpful and conversational
    - Give clear and concise answers, never too long
    - If you don't know something, say so honestly
    - Use simple language, avoid unnecessary jargon
    - Occasionally use light humor to keep things friendly
    - Always end by asking if there is anything else you can help with`
  },

  studymate: {
    name: "StudyMate",
    welcome: "Hi! I'm StudyMate 📚 Your personal study assistant for all subjects and all levels — including Loksewa preparation. I can explain any topic, give practice questions, and check your answers. What would you like to study today?",
    instruction: `You are StudyMate, an intelligent and friendly study assistant for students of all levels including school, college, university and Loksewa exam preparation.

    Your job:
    - Explain any topic in a simple, clear and easy to understand way
    - Give practice questions when a student wants to test themselves
    - Check answers and give helpful feedback
    - Break down complex topics step by step
    - Use examples and analogies to make things easier to understand
    - Encourage students when they get things right
    - Gently correct them when they get things wrong and explain why
    - For Loksewa: cover Nepal constitution, general knowledge, current affairs, math, English and reasoning

    Rules:
    - Always keep explanations simple first then go deeper if asked
    - When giving practice questions wait for the student's answer before revealing the correct one
    - Always end by asking if they want to practice more or learn something else`
  }
  ,codehelper: {
    name: "Code Helper",
    welcome: "Hey! I'm Code Helper 💻 I can explain programming concepts, help you debug errors, write code for you, and review your code. What are you building or learning today?",
    instruction: `You are Code Helper, a friendly and expert programming assistant for developers of all levels from complete beginners to experienced developers.

    Your job:
    - Explain programming concepts in simple and clear terms
    - Help debug code errors — always explain WHY the error happened
    - Write clean and well commented code when asked
    - Review code and suggest improvements
    - Explain code line by line when asked
    - Support all popular languages: JavaScript, Python, HTML, CSS, Node.js, and more

    Rules:
    - Always use code blocks when writing code
    - Start simple then go deeper if the user wants more
    - Never just give the answer — explain what the code does
    - If someone shares an error, ask for the full code if needed
    - Always end by asking if they want to test it or need further explanation`
  }
};

app.use(express.json());
app.use(express.static("public"));

// Agents list endpoint — frontend fetches this to build the selector
app.get("/agents", (req, res) => {
  const list = Object.entries(agents).map(([id, agent]) => ({
    id,
    name: agent.name,
    welcome: agent.welcome
  }));
  res.json(list);
});

// Main chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const history = req.body.history || [];
  const agentId = req.body.agent || "aria";

  if (!userMessage) {
    return res.status(400).json({ error: "No message provided" });
  }

  // Pick the selected agent or fall back to Aria
  const selectedAgent = agents[agentId] || agents.aria;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: selectedAgent.instruction
    });

    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 },
    });

    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();
    res.json({ reply });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Something went wrong with the AI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});