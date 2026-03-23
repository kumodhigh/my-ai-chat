// Load our tools
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load the API key from .env file
dotenv.config();

// Set up the app and AI
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Allow the server to read JSON messages
app.use(express.json());

// Serve HTML files from our folder
app.use(express.static("public"));

// The chat endpoint — this is where messages come in
app.post("/chat", async (req, res) => {

  // Grab the message and history from the request
  const userMessage = req.body.message;
  const history = req.body.history || [];

  // If no message was sent, return an error
  if (!userMessage) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Start a chat session with the full conversation history
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000 },
    });

    // Send the user's message and wait for the reply
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    // Send the reply back
    res.json({ reply: reply });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Something went wrong with the AI" });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});