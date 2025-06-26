// --- Voice Assistant Script ---

// DOM Elements
const micBtn = document.getElementById('mic-btn');
const chatMessages = document.getElementById('chat-messages');
const circle = document.getElementById('circle-animation');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.lang = 'en-US';
    recognition.interimResults = false;
}

// OpenAI API Key (replace with your key)
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

// Sidebar recent history element
const recentList = document.querySelector('.recent ul');
let historyItems = Array.from(recentList.querySelectorAll('li')).map(li => li.textContent);

// Helper: Add chat bubble
function addBubble(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + sender;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Helper: Speak text
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
}

// Helper: Animate circle
function setListening(listening) {
    if (listening) {
        circle.style.boxShadow = '0 0 48px 16px #3a8fff88';
        circle.style.filter = 'brightness(1.2)';
    } else {
        circle.style.boxShadow = '0 0 32px 8px #3a8fff44';
        circle.style.filter = 'brightness(1)';
    }
}

// Helper: Update sidebar history
function updateHistory(text) {
    // Avoid consecutive duplicates
    if (historyItems[0] !== text) {
        historyItems.unshift(text);
        // Remove duplicates (keep first occurrence)
        historyItems = historyItems.filter((item, idx) => historyItems.indexOf(item) === idx);
        // Limit to 10 items
        historyItems = historyItems.slice(0, 10);
        // Update DOM
        recentList.innerHTML = '';
        historyItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            recentList.appendChild(li);
        });
    }
}

// Handle mic button click
micBtn.addEventListener('click', () => {
    if (!recognition) {
        alert('Speech Recognition not supported in this browser.');
        return;
    }
    setListening(true);
    recognition.start();
});

// On speech result
if (recognition) {
    recognition.onresult = async (event) => {
        setListening(false);
        const transcript = event.results[0][0].transcript;
        addBubble(transcript, 'user');
        updateHistory(transcript); // Add to sidebar history
        // Get AI response
        addBubble('Thinking...', 'ai');
        const aiText = await getAIResponse(transcript);
        // Remove 'Thinking...' bubble
        const bubbles = document.querySelectorAll('.bubble.ai');
        if (bubbles.length > 0) bubbles[bubbles.length - 1].remove();
        addBubble(aiText, 'ai');
        speak(aiText);
    };
    recognition.onerror = (event) => {
        setListening(false);
        alert('Error: ' + event.error);
    };
    recognition.onend = () => setListening(false);
}

// Get AI response from FastAPI backend
async function getAIResponse(userText) {
    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: userText })
        });
        const data = await response.json();
        return data.response;
    } catch (e) {
        return 'Sorry, I could not get a response from the AI.';
    }
} 