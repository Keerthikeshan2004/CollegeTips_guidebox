// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const voiceButton = document.getElementById('voice-button');

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Quick reply buttons
document.querySelectorAll('.quick-reply').forEach(button => {
  button.addEventListener('click', (e) => {
    const question = e.target.getAttribute('data-question');
    userInput.value = question;
    sendMessage();
  });
});

// Voice recognition (optional)
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  voiceButton.addEventListener('click', () => {
    if (recognition) {
      recognition.start();
      voiceButton.innerHTML = '<i class="em em-ear" aria-role="presentation"></i>';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        displayMessage("Sorry, I couldn't understand that. Please type your question.", 'bot');
      };
      
      recognition.onend = () => {
        voiceButton.innerHTML = '<i class="em em-microphone" aria-role="presentation"></i>';
      };
    }
  });
} else {
  voiceButton.style.display = 'none';
}

// Display message in chat
function displayMessage(message, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add(`${sender}-message`);
  
  // Check if message contains HTML tags
  if (/<[a-z][\s\S]*>/i.test(message)) {
    messageDiv.innerHTML = message;
  } else {
    messageDiv.textContent = message;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.classList.add('typing-indicator');
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Send message to bot
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Display user message
  displayMessage(message, 'user');
  userInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Get bot response after a short delay
  setTimeout(async () => {
    try {
      const botResponse = await getBotResponse(message);
      hideTypingIndicator();
      displayMessage(botResponse, 'bot');
      
      // Add quick replies for follow-up questions
      addQuickReplies(message);
    } catch (error) {
      hideTypingIndicator();
      displayMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
      console.error('Error:', error);
    }
  }, 1000);
}

// Add quick replies based on context
function addQuickReplies(userMessage) {
  const lowerCaseMsg = userMessage.toLowerCase();
  let quickReplies = [];
  
  if (lowerCaseMsg.includes('whatsapp')) {
    quickReplies = [
      "How to create a WhatsApp group?",
      "How to share my location on WhatsApp?",
      "How to change WhatsApp profile picture?"
    ];
  } else if (lowerCaseMsg.includes('paytm') || lowerCaseMsg.includes('payment')) {
    quickReplies = [
      "How to check Paytm balance?",
      "How to scan QR code with Paytm?",
      "How to add money to Paytm wallet?"
    ];
  } else if (lowerCaseMsg.includes('google maps') || lowerCaseMsg.includes('location')) {
    quickReplies = [
      "How to save a location in Google Maps?",
      "How to download offline maps?",
      "How to share my live location?"
    ];
  }
  
  if (quickReplies.length > 0) {
    const quickReplyDiv = document.createElement('div');
    quickReplyDiv.classList.add('quick-replies');
    
    quickReplies.forEach(reply => {
      const button = document.createElement('button');
      button.classList.add('quick-reply');
      button.textContent = reply;
      button.setAttribute('data-question', reply);
      button.addEventListener('click', (e) => {
        userInput.value = e.target.getAttribute('data-question');
        sendMessage();
      });
      quickReplyDiv.appendChild(button);
    });
    
    const botMessageDiv = document.createElement('div');
    botMessageDiv.classList.add('bot-message');
    botMessageDiv.innerHTML = '<p>Need more help?</p>';
    botMessageDiv.appendChild(quickReplyDiv);
    
    chatMessages.appendChild(botMessageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Get bot response - Dialogflow integration
async function getBotResponse(userMessage) {
  // First check local FAQs
  const localResponse = checkLocalFAQs(userMessage);
  if (localResponse) return localResponse;
  
  // If not found in local FAQs, use Dialogflow
  try {
    const response = await fetchFAQsFromDialogflow(userMessage);
    return response || "I'm still learning! Can you ask in a different way?";
  } catch (error) {
    console.error('Dialogflow error:', error);
    return "Sorry, I'm having trouble connecting. Here's what I know:<br>" + 
           checkLocalFAQs(userMessage, true) || 
           "Try asking about WhatsApp, Paytm, or Google Maps.";
  }
}

// Check local FAQ database
function checkLocalFAQs(userMessage, returnDefault = false) {
  const lowerCaseMsg = userMessage.toLowerCase();
  
  // WhatsApp FAQs
  if (lowerCaseMsg.includes('whatsapp')) {
    if (lowerCaseMsg.includes('photo') || lowerCaseMsg.includes('picture') || lowerCaseMsg.includes('image')) {
      return `To send a photo on WhatsApp: <br>
        1. Open WhatsApp <i class="em em-iphone" aria-role="presentation"></i><br>
        2. Tap the <b>camera icon</b> 📷 in a chat<br>
        3. Select a photo or take a new one<br>
        4. Press <b>SEND</b> ✔️`;
    } else if (lowerCaseMsg.includes('group')) {
      return `To create a WhatsApp group: <br>
        1. Open WhatsApp → Tap <b>New Group</b> 👥<br>
        2. Select contacts → Tap <b>Next</b><br>
        3. Set group name & photo → Tap <b>Create</b>`;
    } else if (lowerCaseMsg.includes('location')) {
      return `To share your location: <br>
        1. Open a chat → Tap <b>📎 (Attachment)</b><br>
        2. Select <b>Location</b> 🗺️<br>
        3. Choose "Share Live Location" or "Send Current Location"`;
    }
  }
  
  // Paytm FAQs
  else if (lowerCaseMsg.includes('paytm') || lowerCaseMsg.includes('payment')) {
    if (lowerCaseMsg.includes('qr') || lowerCaseMsg.includes('scan')) {
      return `To scan a QR code: <br>
        1. Open Paytm → Tap <b>Scan QR Code</b> 📸<br>
        2. Point camera at the QR code<br>
        3. Enter amount & confirm!`;
    } else if (lowerCaseMsg.includes('upi') || lowerCaseMsg.includes('id')) {
      return `To check UPI ID: <br>
        In Paytm: Profile → UPI & Payment Settings → Bank Account<br>
        In Google Pay: Tap your photo → Bank Account`;
    } else if (lowerCaseMsg.includes('balance')) {
      return `To check Paytm wallet balance: <br>
        1. Open Paytm app<br>
        2. Your balance is shown at the top<br>
        3. Tap on it for transaction history`;
    }
  }
  
  // Google Maps FAQs
  else if (lowerCaseMsg.includes('google maps') || lowerCaseMsg.includes('maps') || lowerCaseMsg.includes('location')) {
    if (lowerCaseMsg.includes('save') || lowerCaseMsg.includes('bookmark')) {
      return `To save a location: <br>
        1. Search for a place → Tap its name<br>
        2. Tap <b>Save</b> 🔖 → Choose a list (e.g., "Favorites")`;
    } else if (lowerCaseMsg.includes('offline') || lowerCaseMsg.includes('download')) {
      return `To download offline maps: <br>
        1. Tap your profile → <b>Offline Maps</b><br>
        2. Select area → Tap <b>Download</b> ↓`;
    } else if (lowerCaseMsg.includes('directions') || lowerCaseMsg.includes('route')) {
      return `To get directions: <br>
        1. Search for a place or tap on map<br>
        2. Tap <b>Directions</b> 🚗<br>
        3. Choose start point (or use current location)<br>
        4. Select travel mode (car, walk, etc.)`;
    }
  }
  
  // Gmail FAQs
  else if (lowerCaseMsg.includes('gmail') || lowerCaseMsg.includes('email')) {
    if (lowerCaseMsg.includes('attach') || lowerCaseMsg.includes('file')) {
      return `To attach a file in Gmail: <br>
        1. Tap <b>Compose</b> → Write email<br>
        2. Tap the <b>📎 icon</b> → Select file<br>
        3. Tap <b>Send</b> ✉️`;
    }
  }
  
  // Default responses
  if (returnDefault) {
    return `Here are some things I can help with:<br><br>
      <b>WhatsApp</b>: Sending photos, creating groups, sharing location<br>
      <b>Paytm</b>: UPI payments, scanning QR codes, checking balance<br>
      <b>Google Maps</b>: Finding directions, saving places, offline maps`;
  }
  
  return null;
}

// Dialogflow integration (mock function - replace with actual API call)
async function fetchFAQsFromDialogflow(userMessage) {
  // In a real implementation, you would:
  // 1. Use the Dialogflow API client library
  // 2. Send the user message to your Dialogflow agent
  // 3. Return the response text
  
  // For now, we'll simulate a delayed response
  return new Promise(resolve => {
    setTimeout(() => {
      // This is where you would process the Dialogflow response
      // For demo purposes, we'll return a mock response
      resolve("I'm connected to Dialogflow! In a real implementation, I would provide a smarter response to: \"" + userMessage + "\"");
    }, 800);
  });
}