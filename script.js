const target = document.querySelector('body');

if (target) {
  /**const newDiv = document.createElement('div');
  newDiv.className = 'tm-test';
  newDiv.style.fontWeight = 'bold';
  newDiv.textContent = 'hello world';**/

  // Inject stylesheets and script
const head = document.head;

const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://debasish-spider.github.io/hello_bot/style.css";

const iconsOutlined = document.createElement("link");
iconsOutlined.rel = "stylesheet";
iconsOutlined.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0";

const iconsRounded = document.createElement("link");
iconsRounded.rel = "stylesheet";
iconsRounded.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,1,0";

const themeScript = document.createElement("script");
themeScript.src = "https://debasish-spider.github.io/hello_bot/theme.js";
themeScript.defer = true;

// Append all to head
head.appendChild(styleLink);
head.appendChild(iconsOutlined);
head.appendChild(iconsRounded);
head.appendChild(themeScript);

// Inject chatbot HTML into body
const chatbotHTML = `
    <button class="chatbot-toggler">
      <span class="material-symbols-rounded">mode_comment</span>
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="chatbot">
      <header>
        <h2>Integration bot</h2>
        <span class="close-btn material-symbols-outlined">close</span>
      </header>
      <ul class="chatbox">
        <!--li class="chat incoming">
          <span class="material-symbols-outlined">smart_toy</span>
          <p>Hi there <br>How can I help you today?</p>
        </li-->
      </ul>
      <div class="chat-input">
        <textarea placeholder="Enter a message..." spellcheck="false" required></textarea>
        <span id="send-btn" class="material-symbols-rounded">send</span>
      </div>
    </div>
`;
  
  /target.appendChild(chatbotHTML);/
  target.insertAdjacentHTML('beforeend', chatbotHTML);
}
const theme = "CODE PRESENT";
