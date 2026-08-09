// ==================== 1. SCROLL-DRIVEN 3D INTERACTIVE CANVAS BACKGROUND ====================
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
let scrollSpeedModifier = 1;
let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

window.addEventListener('scroll', () => {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > lastScrollTop) {
        scrollSpeedModifier = 2.5; // speeds up particles on downward scroll
    } else {
        scrollSpeedModifier = 0.5; // slows down on upward scroll
    }
    lastScrollTop = st <= 0 ? 0 : st;
    setTimeout(() => { scrollSpeedModifier = 1; }, 200);
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.2 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.9;
        this.speedY = (Math.random() - 0.5) * 0.9;
    }
    update() {
        this.x += this.speedX * scrollSpeedModifier;
        this.y += this.speedY * scrollSpeedModifier;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.45)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    let count = (canvas.width * canvas.height) / 14000;
    for (let i = 0; i < count; i++) {
        particlesArray.push(new Particle());
    }
}
initParticles();

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        for (let j = i; j < particlesArray.length; j++) {
            let dx = particlesArray[i].x - particlesArray[j].x;
            let dy = particlesArray[i].y - particlesArray[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 130) {
                ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 - distance / 700})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();


// ==================== 2. SEARCH HISTORY TRACKER SYSTEM ====================
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

function loadSearchHistory() {
    const history = JSON.parse(localStorage.getItem('ai_flashcard_history')) || [];
    historyList.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<p class="text-xs text-slate-500 italic">No search history yet...</p>';
        return;
    }

    history.forEach((topic) => {
        const item = document.createElement('button');
        item.className = "w-full text-left text-xs bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 px-3 py-2 rounded-lg transition truncate border border-slate-700/40 shadow-sm block";
        item.textContent = "🔍 " + topic;
        item.addEventListener('click', () => {
            document.getElementById('topicInput').value = topic;
            document.getElementById('fetchWebBtn').click();
        });
        historyList.appendChild(item);
    });
}

function saveSearchHistory(topic) {
    let history = JSON.parse(localStorage.getItem('ai_flashcard_history')) || [];
    if (!history.includes(topic)) {
        history.unshift(topic); // add to top
        if (history.length > 15) history.pop(); // keep max 15 items
        localStorage.setItem('ai_flashcard_history', JSON.stringify(history));
    }
    loadSearchHistory();
}

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('ai_flashcard_history');
    loadSearchHistory();
});

loadSearchHistory();


// ==================== 3. APPLICATION CORE LOGIC ====================
let flashcardsData = [];
let currentIndex = 0;

const markdownInput = document.getElementById('markdownInput');
const generateBtn = document.getElementById('generateBtn');
const flashcard = document.getElementById('flashcard');
const cardQuestion = document.getElementById('cardQuestion');
const cardAnswer = document.getElementById('cardAnswer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const cardCounter = document.getElementById('cardCounter');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

generateBtn.addEventListener('click', () => {
    const rawText = markdownInput.value;
    flashcardsData = parseMarkdownToFlashcards(rawText);

    if (flashcardsData.length === 0) {
        alert("No valid questions found! Please use 'Q:' and 'A:' format or structured text.");
        return;
    }

    currentIndex = 0;
    displayCard(currentIndex);
    updateControls();
    downloadPdfBtn.disabled = false;
});

function parseMarkdownToFlashcards(text) {
    const lines = text.split('\n');
    const cards = [];
    let currentQ = '';
    let currentBullets = [];

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Q:')) {
            if (currentQ && currentBullets.length > 0) {
                cards.push({ question: currentQ, answer: currentBullets.join('\n') });
                currentBullets = [];
            }
            currentQ = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('A:')) {
            const content = trimmed.substring(2).trim();
            if (content) currentBullets.push(content);
        } else if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
            if (currentQ && currentBullets.length > 0) {
                cards.push({ question: currentQ, answer: currentBullets.join('\n') });
                currentBullets = [];
            }
            currentQ = trimmed.replace(/^[#\s]+/, '');
        } else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            const cleanBullet = trimmed.replace(/^[\*\-\s]+/, '').replace(/[*#_`]/g, '');
            if (cleanBullet) currentBullets.push("• " + cleanBullet);
        } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
            const cleanText = trimmed.replace(/[*#_`]/g, '');
            if (cleanText) currentBullets.push(cleanText);
        }
    }

    if (currentQ && currentBullets.length > 0) {
        cards.push({ question: currentQ, answer: currentBullets.join('\n') });
    }

    if (cards.length === 0 && text.trim().length > 0) {
        cards.push({ question: "Study Overview", answer: text.replace(/[*#_`]/g, '').substring(0, 200) + "..." });
    }

    return cards;
}

function displayCard(index) {
    if (flashcardsData.length === 0) return;
    flashcard.classList.remove('is-flipped');
    
    cardQuestion.textContent = flashcardsData[index].question;
    cardAnswer.textContent = flashcardsData[index].answer;
    
    cardAnswer.className = "text-sm text-left font-normal text-slate-100 my-auto overflow-y-auto max-h-48 px-2 leading-relaxed whitespace-pre-line";
    
    cardCounter.textContent = `Card ${index + 1} of ${flashcardsData.length}`;
}

flashcard.addEventListener('click', () => {
    if (flashcardsData.length === 0) return;
    flashcard.classList.toggle('is-flipped');
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < flashcardsData.length - 1) {
        currentIndex++;
        displayCard(currentIndex);
        updateControls();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        displayCard(currentIndex);
        updateControls();
    }
});

function updateControls() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === flashcardsData.length - 1;
}


// ==================== 4. DUAL VOICE COMMAND INTEGRATION ====================
const micBtn = document.getElementById('micBtn');
const micText = document.getElementById('micText');
const fetchMicBtn = document.getElementById('fetchMicBtn');
const topicInput = document.getElementById('topicInput');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    const noteRecognition = new SpeechRecognition();
    noteRecognition.continuous = false;
    noteRecognition.interimResults = false;

    micBtn.addEventListener('click', () => {
        noteRecognition.start();
        micText.textContent = "Listening...";
        micBtn.classList.add('animate-pulse');
    });

    noteRecognition.onresult = (event) => {
        const speech = event.results[0][0].transcript;
        markdownInput.value += `\nQ: ${speech}\nA: [Spoken note response]`;
        micText.textContent = "Voice Question";
        micBtn.classList.remove('animate-pulse');
    };

    noteRecognition.onerror = () => {
        micText.textContent = "Voice Question";
        micBtn.classList.remove('animate-pulse');
    };

    const searchRecognition = new SpeechRecognition();
    searchRecognition.continuous = false;
    searchRecognition.interimResults = false;

    fetchMicBtn.addEventListener('click', () => {
        searchRecognition.start();
        fetchMicBtn.classList.add('animate-pulse');
    });

    searchRecognition.onresult = (event) => {
        const query = event.results[0][0].transcript;
        topicInput.value = query;
        fetchMicBtn.classList.remove('animate-pulse');
        fetchWebBtn.click();
    };

    searchRecognition.onerror = () => {
        fetchMicBtn.classList.remove('animate-pulse');
    };

} else {
    micBtn.style.display = 'none';
    fetchMicBtn.style.display = 'none';
}


// ==================== 5. GOOGLE GEMINI AI FETCHER (VIA SECURE BACKEND) ====================
const fetchWebBtn = document.getElementById('fetchWebBtn');

fetchWebBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) {
        alert("Please enter a topic for Gemini to explain!");
        return;
    }

    fetchWebBtn.textContent = "Asking Gemini...";
    
    try {
        const response = await fetch('/api/gemini', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ topic })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            alert("Error: " + (data.error || "Failed to generate study notes"));
            return;
        }

        const geminiAnswer = data.answer.trim();
        
        markdownInput.value = `Q: ${topic}\nA: ${geminiAnswer}`;
        
        // Save search history
        saveSearchHistory(topic);
        
    } catch (error) {
        alert("Failed to connect to the server. Check your network.");
    } finally {
        fetchWebBtn.textContent = "Fetch Web";
    }
});


// ==================== 6. DOWNLOADABLE PDF EXPORT ====================
downloadPdfBtn.addEventListener('click', () => {
    if (flashcardsData.length === 0) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Study Flashcards Deck", 14, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 30;

    flashcardsData.forEach((card, index) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. Q: ${card.question}`, 14, y);
        y += 7;
        
        doc.setFont("helvetica", "normal");
        const splitAnswer = doc.splitTextToSize(`A: ${card.answer}`, 180);
        doc.text(splitAnswer, 14, y);
        y += (splitAnswer.length * 6) + 8;
    });

    doc.save("flashcards_study_deck.pdf");
});