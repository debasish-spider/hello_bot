const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;
let faqData = [];
let faqMapping = [];
let placeholderIndex = 0;
let userInteracted = false;

const API_KEY = "AIzaSyAiKmAebShetECNonF2fL4gxdC0e77PFgM";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

fetch("https://debasish-spider.github.io/hello_bot/sample2.json")
  .then(res => res.json())
  .then(data => {
    faqData = data.faqs || [];
    faqMapping = data.mapping || [];
    showInitialSuggestions();
    startRotatingPlaceholders();
  })
  .catch(err => console.error("Failed to load FAQ data", err));

const startRotatingPlaceholders = () => {
  const suggestedQuestions = faqData.filter(f => f.suggestion === "true").map(f => f.question);
  if (!suggestedQuestions.length) return;

  const deletePlaceholder = (text, index) => {
    if (userInteracted) return;
    if (index >= 0) {
      chatInput.placeholder = text.substring(0, index);
      setTimeout(() => deletePlaceholder(text, index - 1), 30);
    } else {
      placeholderIndex = (placeholderIndex + 1) % suggestedQuestions.length;
      typePlaceholder(suggestedQuestions[placeholderIndex], 0);
    }
  };

  const typePlaceholder = (text, index = 0) => {
    if (userInteracted) return;
    if (index <= text.length) {
      chatInput.placeholder = text.substring(0, index) + "|";
      setTimeout(() => typePlaceholder(text, index + 1), 50);
    } else {
      setTimeout(() => deletePlaceholder(text, text.length), 1500);
    }
  };

  typePlaceholder(suggestedQuestions[placeholderIndex]);
};

const getChildren = (qid) => {
  const map = faqMapping.find(m => m.qid === qid);
  return map?.children || [];
};

const showInitialSuggestions = () => {
  const welcomeLi = document.createElement("li");
  welcomeLi.classList.add("chat", "incoming");
  welcomeLi.innerHTML = `
    <span class="material-symbols-outlined">smart_toy</span>
    <p>Welcome, I am your virtual agent.<br>How can I help you today? Chat with me or click on the options below</p>`;
  chatbox.appendChild(welcomeLi);

  const suggestionLi = document.createElement("li");
  suggestionLi.classList.add("chat", "incoming");
  const buttonsHtml = faqData
    .filter(f => f.suggestion === "true")
    .map(f => `<button class="suggestion-btn">${f.question}</button>`)
    .join(" ");
  suggestionLi.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><div class="suggestion-buttons">${buttonsHtml}</div>`;
  chatbox.appendChild(suggestionLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  suggestionLi.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      chatInput.value = btn.textContent;
      userInteracted = true;
      chatInput.placeholder = "Enter your queries...";
      handleChat();
    });
  });
};

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  const content = className === "outgoing"
    ? `<p>${message}</p>`
    : `<span class="material-symbols-outlined">smart_toy</span><p>${message}</p>`;
  chatLi.innerHTML = content;
  return chatLi;
};

const formatText = (text) => {
  return text.replace(/\n/g, "<br>").replace(/(\d+\.\s)/g, "<br>$1").replace(/(\•\s)/g, "<br>$1");
};

const showFollowupSuggestions = (qids) => {
  const newSuggestions = qids
    .map(id => {
      const faq = faqData.find(f => f.qid === id);
      return faq ? faq.question : null;
    })
    .filter(q => q && q !== userMessage); // <- Filter out current question

  if (!newSuggestions.length) return;

  const suggestionLi = document.createElement("li");
  suggestionLi.classList.add("chat", "incoming", "suggestion-group");

  const buttonsHtml = newSuggestions
    .map(q => `<button class="suggestion-btn">${q}</button>`)
    .join(" ");

  suggestionLi.innerHTML = `<span class="material-symbols-outlined">smart_toy</span><div class="suggestion-buttons">${buttonsHtml}</div>`;
  chatbox.appendChild(suggestionLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  suggestionLi.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      chatInput.value = btn.textContent;
      handleChat();
    });
  });
};

const getGeminiResponse = async (chatElement) => {
  const p = chatElement.querySelector("p");

  const faqContext = faqData.map(f => {
  return `QID: ${f.qid}\nQ: ${f.question}\nTags: ${(f.tags || []).join(", ")}\nA: ${f.answer}`;
}).join("\n\n");

  const mappingContext = faqMapping.map(m => {
    return `QID: ${m.qid} -> Children: ${m.children?.join(", ") || "none"}`;
  }).join("\n");

  const prompt = `
You are a helpful support bot. Based on the FAQs and mappings below:

- Match the user's question using question text or tags.
- Return the full answer if found.
- If the matched question has children (based on mapping), also return their QIDs in a section called "Follow-up".

Format response like:
[the answer here]
Follow-up: [list of QIDs like 2-1, 2-2]

FAQs:
${faqContext}

Mappings:
${mappingContext}

User: ${userMessage}
`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    const data = await res.json();
    const fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find anything helpful.";

    const [answerBlock, followupBlock] = fullText.split("Follow-up:");
    const formatted = formatText(answerBlock.trim());
    
    if (formatted.includes("<!--part-->")) {
      p.innerHTML = ""; // Clear only if answer has parts
      renderAnswerInParts(p, formatted);
    } else {
      p.innerHTML = formatted;
    }
    
    enableImagePopups();
    enableCodeBlockPopups();

    if (followupBlock) {
      const followupQIDs = followupBlock.trim().split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      showFollowupSuggestions(followupQIDs);
    }

  } catch (err) {
    p.innerHTML = "Error: " + err.message;
  } finally {
    chatbox.scrollTo(0, chatbox.scrollHeight);
  }
};
const renderAnswerInParts = (container, html) => {
  const parts = html.split("<!--part-->");
  if (parts.length <= 1) {
    container.innerHTML = html;
    return;
  }

  let currentIndex = 0;
  const wrapper = document.createElement("div");
  wrapper.className = "multi-part-answer";
  container.appendChild(wrapper);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.className = "next-part-btn";

  const renderNextPart = () => {
    const partDiv = document.createElement("div");
    partDiv.className = "answer-part";
    partDiv.innerHTML = parts[currentIndex];
    wrapper.appendChild(partDiv);
    currentIndex++;

    // Move the next button to the bottom
    if (wrapper.contains(nextBtn)) wrapper.removeChild(nextBtn);
    if (currentIndex < parts.length) {
      wrapper.appendChild(nextBtn);
    }
    chatbox.scrollTo(0, chatbox.scrollHeight);
  };

  nextBtn.onclick = renderNextPart;

  // Show first part immediately
  renderNextPart();
};

const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  userInteracted = true;
  chatInput.placeholder = "Enter your queries...";
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  const outgoingLi = createChatLi(userMessage, "outgoing");
  chatbox.appendChild(outgoingLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);

  setTimeout(() => {
    const thinkingLi = createChatLi("Thinking...", "incoming");
    chatbox.appendChild(thinkingLi);
    chatbox.scrollTo(0, chatbox.scrollHeight);
    getGeminiResponse(thinkingLi);
  }, 500);
};

// popup code block
const enableCodeBlockPopups = () => {
  document.querySelectorAll(".popup-code-trigger").forEach(trigger => {
    const cloned = trigger.cloneNode(true);
    trigger.replaceWith(cloned); // removes previous event listener

    cloned.addEventListener("click", () => {
      const codeBlock = cloned.nextElementSibling;
      if (!codeBlock || !codeBlock.classList.contains("popup-code-content")) return;

      // Prevent duplicate popup creation
      if (document.querySelector(".code-popup-overlay")) return;

      const popup = document.createElement("div");
      popup.className = "code-popup-overlay";
      popup.style.position = "fixed";
      popup.style.top = "0";
      popup.style.left = "0";
      popup.style.width = "100vw";
      popup.style.height = "100vh";
      popup.style.background = "rgb(150 150 150 / 85%)";
      popup.style.zIndex = "100000";
      popup.style.display = "flex";
      popup.style.alignItems = "center";
      popup.style.justifyContent = "center";
      popup.style.padding = "20px";

      const codeContainer = document.createElement("div");
      codeContainer.style.background = "#fff";
      codeContainer.style.padding = "20px";
      codeContainer.style.borderRadius = "8px";
      codeContainer.style.maxWidth = "70%";
      codeContainer.style.maxHeight = "80%";
      codeContainer.style.position = "relative";
      codeContainer.style.overflow = "auto";

      const closeBtn = document.createElement("button");
      closeBtn.className = "code-popup-close";
      closeBtn.innerText = "Close";
      closeBtn.style.marginBottom = "10px";
      closeBtn.onclick = () => document.body.removeChild(popup);

      const copyBtn = document.createElement("button");
      copyBtn.className = "code-copy";
      copyBtn.innerText = "Copy Code";
      copyBtn.style.marginLeft = "10px";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        copyBtn.innerText = "Copied!";
        setTimeout(() => (copyBtn.innerText = "Copy Code"), 2000);
      };

      const codeElement = document.createElement("pre");
      const code = document.createElement("code");
      code.innerHTML = codeBlock.innerHTML;
      codeElement.appendChild(code);

      codeContainer.appendChild(closeBtn);
      codeContainer.appendChild(copyBtn);
      codeContainer.appendChild(codeElement);
      popup.appendChild(codeContainer);
      document.body.appendChild(popup);
    });
  });
};


// popup image
const enableImagePopups = () => {
  document.querySelectorAll('.popup-image').forEach(img => {
    img.onclick = () => {
      const popup = document.createElement('div');
      popup.style.position = 'fixed';
      popup.style.top = '0';
      popup.style.left = '0';
      popup.style.width = '100vw';
      popup.style.height = '100vh';
      popup.style.background = 'rgba(0,0,0,0.8)';
      popup.style.display = 'flex';
      popup.style.alignItems = 'center';
      popup.style.justifyContent = 'center';
      popup.style.zIndex = '999999';
      popup.innerHTML = `<img src="${img.src}" style="max-width:90%; max-height:90%; border: 4px solid white; border-radius: 8px;">`;
      popup.onclick = () => document.body.removeChild(popup);
      document.body.appendChild(popup);
    };
  });
};

// Events
chatInput.addEventListener("input", () => {
  if (!userInteracted) {
    userInteracted = true;
    chatInput.placeholder = "Enter your queries...";
  }
});
sendChatBtn.addEventListener("click", handleChat);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
