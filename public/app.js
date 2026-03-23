// Store conversation history so the AI remembers context
let history = [];

// Grab the elements we need
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesDiv = document.getElementById("chat-messages");

// Send message when button is clicked
sendBtn.addEventListener("click", sendMessage);

// Send message when Enter key is pressed
input.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const userText = input.value.trim();

  // Do nothing if input is empty
  if (!userText) return;

  // Show user's message in the chat
  addMessage(userText, "user");

  // Clear the input box
  input.value = "";

  // Show "AI is thinking..." while waiting
  const thinkingMsg = addMessage("AI is thinking...", "thinking");

  try {
    // Send message + history to our server
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history: history }),
    });

    const data = await response.json();

    // Remove the thinking message
    thinkingMsg.remove();

    if (data.reply) {
      // Show AI's reply
      addMessage(data.reply, "ai");

      // Save this exchange to history so AI remembers it
      history.push({ role: "user", parts: [{ text: userText }] });
      history.push({ role: "model", parts: [{ text: data.reply }] });

    } else {
      addMessage("Something went wrong. Please try again.", "ai");
    }

  } catch (error) {
    thinkingMsg.remove();
    addMessage("Could not reach the server. Is it running?", "ai");
  }
}

// Helper function — adds a message bubble to the chat
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  messagesDiv.appendChild(msg);

  // Auto scroll to the latest message
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  return msg;
}