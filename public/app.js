let history = [];

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesDiv = document.getElementById("chat-messages");
const clearBtn = document.getElementById("clear-btn");
const suggestions = document.getElementById("suggestions");

// Send on button click or Enter key
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

// Clear chat button
clearBtn.addEventListener("click", function() {
  history = [];
  messagesDiv.innerHTML = `
    <div class="message ai">
      Chat cleared! Hi again 😊 What can I help you with?
    </div>
  `;
});

// Suggested question chips
function askSuggestion(text) {
  input.value = text;
  suggestions.style.display = "none";
  sendMessage();
}

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  // Hide suggestions after first message
  suggestions.style.display = "none";

  addMessage(userText, "user");
  input.value = "";

  const thinkingMsg = addMessage("Aria is thinking", "thinking");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history: history }),
    });

    const data = await response.json();
    thinkingMsg.remove();

    if (data.reply) {
      addMessage(data.reply, "ai");
      history.push({ role: "user", parts: [{ text: userText }] });
      history.push({ role: "model", parts: [{ text: data.reply }] });
    } else {
      addMessage("Something went wrong. Please try again.", "ai");
    }

  } catch (error) {
    thinkingMsg.remove();
    addMessage("Could not reach the server.", "ai");
  }
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  // Render markdown for AI messages, plain text for user
  if (sender === "ai") {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return msg;
}