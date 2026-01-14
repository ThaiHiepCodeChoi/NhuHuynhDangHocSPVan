// --- 1. KHO CÂU HỎI ---
const questionBank = [
    {
        id: 1,
        question: "Các thành phần cấu trúc của ý thức bao gồm:",
        options: ["A. Nhận thức, cảm xúc, hành vi", "B. Nhận thức, thái độ, năng động", "C. Nhận thức, ý chí, hành động", "D. Tri giác, tư duy, hành vi"],
        correctIndex: 1
    },
    {
        id: 2,
        question: "Quan điểm tâm lý học về mối quan hệ giữa hoạt động và ý thức là gì?",
        options: ["A. Ý thức có trước, hoạt động chỉ là biểu hiện", "B. Hoạt động quyết định hoàn toàn ý thức", "C. Ý thức hình thành và phát triển trong hoạt động", "D. Ý thức chỉ hình thành thông qua tự suy nghĩ"],
        correctIndex: 2
    },
    {
        id: 3,
        question: "Khi sinh viên tập trung nghe giảng, hạn chế xao nhãng, điều này phản ánh vai trò nào của chú ý?",
        options: ["A. Trạng thái cảm xúc", "B. Kích thích trí nhớ dài hạn", "C. Tạo điều kiện thần kinh - tâm lý thuận lợi", "D. Hoạt động tâm lý độc lập"],
        correctIndex: 2
    },
    {
        id: 4,
        question: "Sinh viên vừa nhìn bảng, vừa nghe giảng, vừa ghi chép thể hiện thuộc tính nào của chú ý?",
        options: ["A. Sức tập trung chú ý", "B. Sức bền vững chú ý", "C. Sự phân phối chú ý", "D. Sự di chuyển chú ý"],
        correctIndex: 2
    }
];

// --- 2. HỆ THỐNG ÂM THANH (GÓI CARTOON) ---
let audioContext = null;
let isMusicPlaying = true;
let musicInterval = null;

function initAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
}

function playAudio(type) {
  if (!audioContext) initAudio();
  const ctx = audioContext; const now = ctx.currentTime;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);

  if (type === 'correct') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.3);
    gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'win') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(500, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.3); osc.frequency.linearRampToValueAtTime(800, now + 0.5);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.8);
    gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.start(now); osc.stop(now + 0.8);
  }
}

function startBackgroundMusic() {
    if (!isMusicPlaying) return;
    initAudio(); if (musicInterval) clearInterval(musicInterval);
    musicInterval = setInterval(() => { if (!isMusicPlaying) return; playAmbientNote(); }, 2800);
    playAmbientNote();
}
function stopBackgroundMusic() { if (musicInterval) clearInterval(musicInterval); musicInterval = null; }
function toggleMusic() {
    isMusicPlaying = !isMusicPlaying;
    const btn = document.getElementById('music-toggle');
    if (isMusicPlaying) { btn.innerHTML = '🎵'; btn.classList.remove('muted'); startBackgroundMusic(); } 
    else { btn.innerHTML = '🔇'; btn.classList.add('muted'); stopBackgroundMusic(); }
}
function playAmbientNote() {
    const ctx = audioContext; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    const notes = [300, 400, 500, 600]; 
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(randomNote, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(randomNote * 2, ctx.currentTime + 0.1);
    osc.type = 'sine'; osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
}

// --- 3. LOGIC GAME & LEADERBOARD ---
let currentPlayer = "";
let currentIndex = 0; 
let wrongCount = 0;
let startTime = 0;
let gameTimerInterval = null;
let elapsedTime = 0;

function showSlide(slideId) {
  document.querySelectorAll('.slide').forEach(slide => slide.classList.remove('active'));
  const targetSlide = document.getElementById(slideId);
  if (targetSlide) targetSlide.classList.add('active');
}

function startQuiz() {
  const nameInput = document.getElementById('player-name');
  if (!nameInput.value.trim()) {
      alert("Vui lòng nhập tên của bạn để bắt đầu đua top!");
      nameInput.focus();
      return;
  }
  
  currentPlayer = nameInput.value.trim();
  document.getElementById('display-name').innerText = currentPlayer;

  initAudio(); startBackgroundMusic();
  currentIndex = 0;
  wrongCount = 0;
  elapsedTime = 0;
  document.getElementById('wrong-count').innerText = 0;
  
  // Bắt đầu tính giờ toàn game
  startTime = Date.now();
  if(gameTimerInterval) clearInterval(gameTimerInterval);
  gameTimerInterval = setInterval(updateGameTimer, 100);

  loadQuestion(currentIndex);
}

function updateGameTimer() {
    const now = Date.now();
    elapsedTime = (now - startTime) / 1000;
    document.getElementById('game-timer').innerText = elapsedTime.toFixed(2) + "s";
}

function loadQuestion(index) {
    if (index >= questionBank.length) { finishGame(); return; }
    const data = questionBank[index];
    showSlide('slide-game');
    document.getElementById('question-number').innerText = `Câu ${index + 1}/${questionBank.length}`;
    document.getElementById('question-text').innerText = data.question;
    const percent = ((index) / questionBank.length) * 100;
    document.getElementById('progress-bar').style.width = `${percent}%`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = ''; 
    
    data.options.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.className = "btn-option w-full text-left p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:bg-emerald-50 font-semibold text-gray-700 flex items-center gap-3";
        const letter = optText.split('.')[0] + '.'; 
        const content = optText.substring(optText.indexOf('.') + 1);
        btn.innerHTML = `<span class="font-bold text-emerald-600">${letter}</span> ${content}`;
        btn.onclick = () => selectAnswer(i);
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(selectedIndex) {
    const correctIndex = questionBank[currentIndex].correctIndex;
    if (selectedIndex === correctIndex) {
        playAudio('correct'); createConfetti(); showSlide('slide-correct');
    } else {
        wrongCount++;
        document.getElementById('wrong-count').innerText = wrongCount;
        playAudio('wrong'); showSlide('slide-wrong');
    }
}

function nextQuestion() {
    currentIndex++;
    loadQuestion(currentIndex);
}

function retryQuestion() {
    loadQuestion(currentIndex);
}

function finishGame() {
    clearInterval(gameTimerInterval);
    playAudio('win'); createConfetti();
    
    // Hiển thị kết quả
    document.getElementById('final-time').innerText = elapsedTime.toFixed(2) + "s";
    document.getElementById('final-wrongs').innerText = wrongCount;
    
    // Lưu vào bảng xếp hạng
    saveToLeaderboard(currentPlayer, wrongCount, elapsedTime);
    
    // Hiển thị bảng xếp hạng
    renderLeaderboard();
    showSlide('slide-results');
}

function restartGame() {
    document.getElementById('slide-results').classList.remove('active');
    document.getElementById('slide-cover').classList.add('active');
    document.getElementById('player-name').value = ""; // Clear name
}


// --- LEADERBOARD LOGIC (GOOGLE SHEETS API) ---
// 
const API_URL = "https://script.google.com/macros/s/AKfycbzBSHf16Xn793pMn1gXr0JKxvDKnCUvuTp1oy14YDePoLbB_S9tXIqoZwjB3p5usTvR/exec"; 

async function saveToLeaderboard(name, wrongs, time) {
    // Hiện thông báo đang lưu
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">⏳ Đang lưu kết quả lên mây...</td></tr>';

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Quan trọng để browser không chặn
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name, wrongs: wrongs, time: parseFloat(time) })
        });
        
        // Sau khi lưu xong thì tải lại bảng xếp hạng
        renderLeaderboard();
        
    } catch (error) {
        console.error('Lỗi lưu điểm:', error);
        alert("Có lỗi kết nối! Không thể lưu điểm.");
    }
}

async function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">🔄 Đang tải bảng xếp hạng...</td></tr>';

    try {
        const response = await fetch(API_URL);
        const data = await response.json(); // Nhận danh sách Top 10 từ Google Sheet

        tbody.innerHTML = ''; // Xóa loading

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 border-b border-gray-100";
            
            // Highlight nếu là người chơi hiện tại (so sánh tương đối)
            if (item.name === currentPlayer && Math.abs(item.time - elapsedTime) < 0.1) {
                row.classList.add('bg-highlight');
            }

            row.innerHTML = `
                <td class="px-3 py-2">${index + 1}</td>
                <td class="px-3 py-2 font-medium text-gray-800 truncate max-w-[100px]">${item.name}</td>
                <td class="px-3 py-2 text-right text-red-500 font-bold">${item.wrongs}</td>
                <td class="px-3 py-2 text-right font-mono text-gray-600">${item.time.toFixed(2)}s</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Lỗi tải BXH:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">❌ Lỗi tải dữ liệu</td></tr>';
    }
}

// Admin clear function (Giờ đây cần xóa trên Google Sheet thủ công thì an toàn hơn)
function clearLeaderboard() {
    alert("Vì dữ liệu đang lưu trên Online, Admin vui lòng vào Google Sheet để xóa dòng thủ công nhé!");
    window.open("https://docs.google.com/spreadsheets", "_blank");
}

// --- ADMIN CONTROL ---
function openAdminPanel() {
    const password = prompt("Nhập mật khẩu Admin để quản lý bảng xếp hạng:");
    if (password === "nhuhuynh040307") { // Mật khẩu đơn giản
        // Mở slide kết quả để xem bảng xếp hạng full
        renderLeaderboard();
        showSlide('slide-results');
        // Hiện nút xóa dữ liệu
        document.getElementById('admin-controls').classList.remove('hidden');
        alert("Đã mở quyền Admin. Bạn có thể xóa dữ liệu ở dưới bảng xếp hạng.");
    } else if (password !== null) {
        alert("Sai mật khẩu!");
    }
}

function clearLeaderboard() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đấu không? Hành động này không thể hoàn tác!")) {
        localStorage.removeItem(STORAGE_KEY);
        renderLeaderboard();
        alert("Đã xóa sạch dữ liệu!");
    }
}

function createConfetti() {
  const container = document.getElementById('confetti-container'); if(!container) return; container.innerHTML = '';
  const emojis = ['🎉', '⭐', '✨'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    p.style.left = Math.random()*100+'%'; p.style.top = Math.random()*50+'%';
    p.style.fontSize = (Math.random()*20+15)+'px'; p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    container.appendChild(p);
  }
}

if (window.elementSdk) { window.elementSdk.init({ defaultConfig, onConfigChange: async (config) => { } }); }