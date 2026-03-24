let history = [];

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesDiv = document.getElementById("chat-messages");

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";

  const thinkingMsg = addMessage("Aria is thinking...", "thinking");

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
  msg.textContent = text;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return msg;
}