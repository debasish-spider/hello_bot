const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;

let faqData = [];

// Load JSON
fetch("https://debasish-spider.github.io/hello_bot/sample2.json")
  .then(res => res.json())
  .then(data => {
    faqData = data.faqs || [];
    showInitialSuggestions(); // show suggestions once data is ready
  })
  .catch(err => console.error("Failed to load FAQ data", err));

const API_KEY = "AIzaSyAiKmAebShetECNonF2fL4gxdC0e77PFgM";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Utility: Create a chat bubble
const createChatLi = (message, className) => {
  const li = document.createElement("li");
  li.classList.add("chat", className);
  const content = className === "outgoing"
    ? `<p>${message}</p>`
    : `<span class="material-symbols-outlined">smart_toy</span><p>${message}</p>`;
  li.innerHTML = content;
  return li;
};

// Utility: Format text (bullets & line breaks)
const formatText = (text) => {
  return text
    .replace(/\n/g, "<br>")
    .replace(/(\d+\.\s)/g, "<br>$1")
    .replace(/(\•\s)/g, "<br>$1");
};

// Initial Suggestions
const showInitialSuggestions = () => {
  const suggestions = faqData.filter(item => item.suggestion === "true");
  if (suggestions.length) {
    const lines = suggestions.map(s => `• ${s.question}`).join("<br>");
    const welcomeMsg = `You can choose from below:<br><br>${lines}`;
    chatbox.appendChild(createChatLi(welcomeMsg, "incoming"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

// Gemini Response Only from FAQ
const getGeminiResponseFromFAQ = async (chatElement) => {
  const p = chatElement.querySelector("p");

  const contextText = faqData.map((item, idx) => {
    return `Q: ${item.question}\nTags: ${(item.tags || []).join(', ')}\nA: ${item.answer}`;
  }).join("\n\n");

  const prompt = `You are a helpful assistant. Only answer using the following FAQs. If the question is not related to them, respond with "Sorry, I couldn't find an answer for that."

FAQs:
${contextText}

User asked: ${userMessage}
Answer:`;

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    }),
  };

  try {
    const res = await fetch(API_URL, requestOptions);
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find an answer.";
    p.innerHTML = formatText(reply);
  } catch (err) {
    p.innerHTML = "Error: " + err.message;
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};

// Chat submission handler
const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    const botLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(botLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);

    getGeminiResponseFromFAQ(botLi);
  }, 500);
};

// UI Handlers
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});
sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
