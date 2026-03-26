let history = [];
let currentAgent = null;
let agents = [];
let chatSessions = [];
let currentSessionTitle = null;

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesDiv = document.getElementById("chat-messages");
const clearBtn = document.getElementById("clear-btn");
const agentList = document.getElementById("agent-list");
const historyList = document.getElementById("history-list");
const agentName = document.getElementById("agent-name");
const agentAvatar = document.getElementById("agent-avatar");
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-btn");
const mobileToggle = document.getElementById("mobile-toggle");
const newChatBtn = document.getElementById("new-chat-btn");

// Sidebar toggle
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});
mobileToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// New chat button
newChatBtn.addEventListener("click", () => {
  if (currentAgent) selectAgent(currentAgent);
});

// Load agents
async function loadAgents() {
  try {
    const res = await fetch("/agents");
    agents = await res.json();
    buildAgentList();
    selectAgent(agents[0]);
  } catch (e) {
    console.error("Could not load agents", e);
  }
}

// Build agent list in sidebar
function buildAgentList() {
  agentList.innerHTML = "";
  agents.forEach(agent => {
    const btn = document.createElement("button");
    btn.classList.add("agent-item");
    btn.dataset.id = agent.id;
    btn.innerHTML = `
      <span class="agent-item-icon">${getAgentIcon(agent.id)}</span>
      <span class="agent-item-name">${agent.name}</span>
    `;
    btn.onclick = () => {
      selectAgent(agent);
      sidebar.classList.remove("open");
    };
    agentList.appendChild(btn);
  });
}

// Icons per agent
function getAgentIcon(id) {
  const icons = {
    aria: "🤖",
    studymate: "📚",
    codehelper: "💻"
  };
  return icons[id] || "🤖";
}

// Select agent
function selectAgent(agent) {
  // Save current chat to history before switching
  if (currentSessionTitle && history.length > 0) {
    saveToHistory(currentSessionTitle, currentAgent);
  }

  currentAgent = agent;
  currentSessionTitle = null;
  history = [];

  // Update header
  agentName.textContent = agent.name;
  agentAvatar.textContent = getAgentIcon(agent.id);

  // Highlight active agent
  document.querySelectorAll(".agent-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.id === agent.id);
  });

  // Clear messages
  messagesDiv.innerHTML = "";
  addMessage(agent.welcome, "ai");
  showSuggestions(agent.id);
}

// Save chat to history
function saveToHistory(title, agent) {
  const session = { title, agentId: agent.id, agentName: agent.name };
  chatSessions.unshift(session);
  if (chatSessions.length > 20) chatSessions.pop();
  renderHistory();
}

// Render history list
function renderHistory() {
  if (chatSessions.length === 0) {
    historyList.innerHTML = `<div class="empty-history">No chats yet</div>`;
    return;
  }
  historyList.innerHTML = "";
  chatSessions.forEach((session, index) => {
    const item = document.createElement("div");
    item.classList.add("history-item");
    item.innerHTML = `
      <span class="history-icon">${getAgentIcon(session.agentId)}</span>
      <span class="history-title">${session.title}</span>
    `;
    historyList.appendChild(item);
  });
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
      "What is var, let and const?",
      "How do APIs work?"
    ]
  };

  const chips = suggestions[agentId] || [];
  if (!chips.length) return;

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

// Clear chat
clearBtn.addEventListener("click", () => {
  if (currentAgent) selectAgent(currentAgent);
});

// Send
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText || !currentAgent) return;

  const existing = document.getElementById("suggestions");
  if (existing) existing.remove();

  // Set session title from first message
  if (!currentSessionTitle) {
    currentSessionTitle = userText.length > 30
      ? userText.substring(0, 30) + "..."
      : userText;
  }

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

      // Save to history after first reply
      if (history.length === 2) {
        saveToHistory(currentSessionTitle, currentAgent);
      }
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

loadAgents();