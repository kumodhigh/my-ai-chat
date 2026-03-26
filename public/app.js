let history = [];
let currentAgent = null;
let agents = [];

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesDiv = document.getElementById("chat-messages");
const clearBtn = document.getElementById("clear-btn");
const agentBar = document.getElementById("agent-bar");
const agentName = document.getElementById("agent-name");
const agentAvatar = document.getElementById("agent-avatar");

// Load agents from server on page load
async function loadAgents() {
  try {
    const res = await fetch("/agents");
    agents = await res.json();
    buildAgentBar();
    selectAgent(agents[0]); // default to first agent
  } catch (e) {
    console.error("Could not load agents", e);
  }
}

// Build the agent selector buttons
function buildAgentBar() {
  agentBar.innerHTML = "";
  agents.forEach(agent => {
    const btn = document.createElement("button");
    btn.classList.add("agent-btn");
    btn.textContent = agent.name;
    btn.dataset.id = agent.id;
    btn.onclick = () => selectAgent(agent);
    agentBar.appendChild(btn);
  });
}

// Switch to a different agent
function selectAgent(agent) {
  currentAgent = agent;

  // Update header
  agentName.textContent = agent.name;
  agentAvatar.textContent = agent.name[0];

  // Highlight active button
  document.querySelectorAll(".agent-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.id === agent.id);
  });

  // Clear chat and show new welcome message
  history = [];
  messagesDiv.innerHTML = "";
  addMessage(agent.welcome, "ai");

  // Show suggestions based on agent
  showSuggestions(agent.id);
}

// Suggestions per agent
function showSuggestions(agentId) {
  const existing = document.getElementById("suggestions");
  if (existing) existing.remove();

  const suggestions = {
    aria: [
      "What can you help me with?",
      "Give me a productivity tip",
      "Tell me something interesting",
      "Help me write an email"
    ],
    studymate: [
      "Explain photosynthesis simply",
      "Give me 5 algebra practice questions",
      "Quiz me on Loksewa GK",
      "Explain Newton's laws of motion"
    ],
    codehelper: [
      "Explain what JavaScript is",
      "Write a function to reverse a string",
      "What is the difference between var, let and const?",
      "Help me understand how APIs work"
    ]
  };

  const chips = suggestions[agentId] || [];
  if (chips.length === 0) return;

  const div = document.createElement("div");
  div.className = "suggestions";
  div.id = "suggestions";

  chips.forEach(text => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = text;
    btn.onclick = () => {
      div.remove();
      input.value = text;
      sendMessage();
    };
    div.appendChild(btn);
  });

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// Clear chat
clearBtn.addEventListener("click", () => {
  if (currentAgent) selectAgent(currentAgent);
});

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText || !currentAgent) return;

  const existing = document.getElementById("suggestions");
  if (existing) existing.remove();

  addMessage(userText, "user");
  input.value = "";

  const thinkingMsg = addMessage("Thinking...", "thinking");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        history: history,
        agent: currentAgent.id
      }),
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
  if (sender === "ai") {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return msg;
}

// Start
loadAgents();