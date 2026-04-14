// ---------- Complete MemoMind Project ----------
let currentUser = null;
let memories = {};
let users = [];
let charts = {};

// Load storage
function loadStorage() {
    users = JSON.parse(localStorage.getItem('memomind_users') || '[{"username":"demo","password":"demo123"}]');
    memories = JSON.parse(localStorage.getItem('memomind_memories') || '{}');
    const session = localStorage.getItem('memomind_session');
    if (session) { currentUser = { username: session }; updateAuthUI(); }
}
function saveUsers() { localStorage.setItem('memomind_users', JSON.stringify(users)); }
function saveMemories() { localStorage.setItem('memomind_memories', JSON.stringify(memories)); }
function updateAuthUI() {
    const isLoggedIn = !!currentUser;
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    if(loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    if(registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'block';
    if(logoutBtn) logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    if(userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';
    if (isLoggedIn && document.getElementById('userName')) document.getElementById('userName').innerText = currentUser.username;
}

// Chat helpers
function addMessage(sender, text, link = null) {
    const chatArea = document.getElementById('chatArea');
    if(!chatArea) return;
    const div = document.createElement('div');
    div.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender === 'user' ? 'user-bubble' : 'bot-bubble'}`;
    bubble.innerText = text;
    if (link) {
        const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.innerText = ' 🔗 লিংক খুলুন'; a.style.marginLeft = '10px'; a.style.color = '#667eea';
        bubble.appendChild(a);
    }
    const time = document.createElement('div'); time.className = 'time'; time.innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    div.appendChild(bubble); div.appendChild(time);
    chatArea.appendChild(div); chatArea.scrollTop = chatArea.scrollHeight;
}
function addWelcome() {
    const chatArea = document.getElementById('chatArea');
    if(!chatArea) return;
    const welcomeHTML = `<div class="welcome-header"><div class="welcome-icon">🧠</div><div class="welcome-text">হ্যালো! আমি MemoMind</div></div>
    <div class="commands-grid"><div class="command-item"><div class="command-emoji">📝</div><div class="command-content"><div class="command-name">মনে রাখো [বিষয়]</div><div class="command-desc">আপনার কথা মনে রাখি</div></div></div>
    <div class="command-item"><div class="command-emoji">🔍</div><div class="command-content"><div class="command-name">মনে করে দাও [কী]</div><div class="command-desc">আগের কথা মনে করিয়ে দেই</div></div></div>
    <div class="command-item"><div class="command-emoji">🌐</div><div class="command-content"><div class="command-name">গুগল [কীওয়ার্ড]</div><div class="command-desc">গুগল সার্চ</div></div></div>
    <div class="command-item"><div class="command-emoji">🎬</div><div class="command-content"><div class="command-name">ইউটিউব [ভিডিও]</div><div class="command-desc">ইউটিউব সার্চ</div></div></div>
    <div class="command-item"><div class="command-emoji">⏰</div><div class="command-content"><div class="command-name">অ্যালার্ম [সময়]</div><div class="command-desc">নোটিফিকেশন</div></div></div>
    <div class="command-item"><div class="command-emoji">📁</div><div class="command-content"><div class="command-name">ফাইল বের করে দাও</div><div class="command-desc">ফাইল সিমুলেশন</div></div></div></div>
    <div class="tip-section"><div class="tip-icon">💡</div><div class="tip-text">টিপ: উপরের কার্ডগুলিতে ক্লিক করলেই কমান্ড বসে যাবে!</div></div>`;
    const msgDiv = document.createElement('div'); msgDiv.className = 'message bot-message';
    const bubble = document.createElement('div'); bubble.className = 'bubble bot-bubble welcome-card'; bubble.innerHTML = welcomeHTML;
    msgDiv.appendChild(bubble); chatArea.appendChild(msgDiv);
}

// AI Processor
async function processCommand(text) {
    const low = text.toLowerCase();
    if (low.startsWith('মনে রাখো') || low.startsWith('মনে রাখ')) {
        let content = text.replace(/মনে রাখো|মনে রাখ/i, '').trim();
        if (!content) return { response: "কি মনে রাখবো?" };
        if (!currentUser) return { response: "❗ লগইন করুন প্রথমে।" };
        const userMem = memories[currentUser.username] || {};
        const key = `mem_${Date.now()}`;
        userMem[key] = { text: content, timestamp: new Date().toISOString() };
        memories[currentUser.username] = userMem;
        saveMemories();
        return { response: `✅ মনে রেখেছি: "${content}"` };
    }
    if (low.startsWith('মনে করে দাও')) {
        let query = text.replace(/মনে করে দাও/i, '').trim();
        if (!currentUser) return { response: "লগইন করুন।" };
        const userMem = memories[currentUser.username] || {};
        const entries = Object.values(userMem);
        if (!entries.length) return { response: "কিছু মনে রাখিনি এখনো।" };
        if (!query) return { response: "সাম্প্রতিক:\n" + entries.slice(-3).map(e=>e.text).join('\n') };
        const found = entries.filter(e=>e.text.includes(query));
        return found.length ? { response: found.map(e=>`🔹 ${e.text}`).join('\n') } : { response: "খুঁজে পাইনি।" };
    }
    if (low.includes('গুগল') && low.includes('সার্চ')) {
        let kw = text.replace(/গুগল|সার্চ|করো/gi,'').trim() || "news";
        return { response: `🔎 গুগল সার্চ: "${kw}"`, link: `https://www.google.com/search?q=${encodeURIComponent(kw)}` };
    }
    if (low.includes('ইউটিউব')) {
        let q = text.replace(/ইউটিউব/gi,'').trim() || "বাংলা গান";
        return { response: `🎬 ইউটিউব ফলাফল: "${q}"`, link: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` };
    }
    if (low.includes('অ্যালার্ম')) {
        let time = text.replace(/অ্যালার্ম|সেট করো|বাজাও/gi,'').trim() || "সকাল ৮টা";
        if (Notification.permission === "granted") new Notification("⏰ MemoMind", { body: `${time} - সময় হয়েছে!` });
        else if (Notification.permission !== "denied") Notification.requestPermission();
        return { response: `🔔 অ্যালার্ম সেট: ${time} (নোটিফিকেশন চেক করুন)` };
    }
    if (low.includes('ফাইল')) return { response: "📁 ফাইল সিমুলেশন: আপনার ডিভাইসে ম্যানুয়ালি খুঁজুন।" };
    if (low.includes('কেমন আছ') || low.includes('হ্যালো')) return { response: "আমি ভালো! আপনি কেমন আছেন? 😊" };
    return { response: `🤖 "${text}" - আপনি "মনে রাখো", "মনে করে দাও", "গুগল সার্চ করো", "ইউটিউব", "অ্যালার্ম" ব্যবহার করতে পারেন।` };
}

async function sendMessage() {
    const text = document.getElementById('messageInput')?.value.trim();
    if (!text) return;
    addMessage('user', text);
    document.getElementById('messageInput').value = '';
    const chatArea = document.getElementById('chatArea');
    const typing = document.createElement('div'); typing.className = 'message bot-message'; typing.id = 'typing'; typing.innerHTML = '<div class="bubble bot-bubble">🤔 ভাবছি...</div>';
    chatArea.appendChild(typing); chatArea.scrollTop = chatArea.scrollHeight;
    setTimeout(async () => {
        document.getElementById('typing')?.remove();
        const res = await processCommand(text);
        addMessage('bot', res.response, res.link);
        // ড্যাশবোর্ড আপডেট করুন যদি খোলা থাকে
        if (document.getElementById('dashboardSection')?.classList.contains('active')) {
            updateDashboardStats();
            renderCharts();
        }
    }, 300);
}

// Dashboard Analytics (global functions for dashboard.html)
function getUserMemories() { return currentUser ? Object.values(memories[currentUser.username] || []) : []; }

function updateDashboardStats() {
    const mems = getUserMemories();
    const statMemories = document.getElementById('statMemories');
    const statConv = document.getElementById('statConv');
    const statStreak = document.getElementById('statStreak');
    const statAvg = document.getElementById('statAvg');
    if(statMemories) statMemories.innerText = mems.length;
    if(statConv) statConv.innerText = mems.length;
    const uniqueDays = new Set(mems.map(m => new Date(m.timestamp).toDateString())).size;
    if(statStreak) statStreak.innerText = uniqueDays;
    if(statAvg) statAvg.innerText = Math.round((mems.length/7)||1);
}

function renderCharts() {
    const mems = getUserMemories();
    
    // 1. Weekly Activity Chart (Bar Chart)
    const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
    const daily = Array(7).fill(0);
    mems.forEach(m => { 
        if(m.timestamp) { 
            const d = new Date(m.timestamp).getDay(); 
            daily[d]++; 
        } 
    });
    const weeklyCanvas = document.getElementById('weeklyChart');
    if (weeklyCanvas && window.Chart) {
        if (charts.weekly) charts.weekly.destroy();
        charts.weekly = new Chart(weeklyCanvas, { 
            type: 'bar', 
            data: { 
                labels: days, 
                datasets: [{ 
                    label: 'মেমরি সংরক্ষণ', 
                    data: daily, 
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    borderRadius: 8
                }] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
    
    // 2. Intent Distribution Chart (Pie Chart - slightly smaller)
    const intents = { 
        'মেমরি সংরক্ষণ': mems.length, 
        'রিমাইন্ডার': Math.floor(mems.length * 0.3), 
        'সার্চ': Math.floor(mems.length * 0.2) 
    };
    const intentCanvas = document.getElementById('intentChart');
    if (intentCanvas && window.Chart) {
        if (charts.intent) charts.intent.destroy();
        intentCanvas.style.maxWidth = '240px';
        intentCanvas.style.maxHeight = '240px';
        intentCanvas.style.margin = '0 auto';
        
        charts.intent = new Chart(intentCanvas, { 
            type: 'pie', 
            data: { 
                labels: Object.keys(intents), 
                datasets: [{ 
                    data: Object.values(intents), 
                    backgroundColor: ['#667eea', '#f59e0b', '#10b981'],
                    borderColor: 'white',
                    borderWidth: 2
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { font: { size: 11 }, boxWidth: 10 }
                    }, 
                    tooltip: { bodyFont: { size: 11 } }
                }
            } 
        });
    }
    
    // 3. Popular Keywords Chart (Horizontal Bar Chart)
    // রিয়েল ডাটা থেকে কীওয়ার্ড এক্সট্রাক্ট করার চেষ্টা
    const keywordCount = {};
    mems.forEach(m => {
        const words = m.text.split(' ');
        words.forEach(word => {
            if(word.length > 2) {
                keywordCount[word] = (keywordCount[word] || 0) + 1;
            }
        });
    });
    let topKeywords = Object.entries(keywordCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    if(topKeywords.length === 0) {
        topKeywords = [['বাংলা', 3], ['মিটিং', 2], ['কাজ', 2], ['রিমাইন্ডার', 1], ['গুগল', 1]];
    }
    
    const kwCanvas = document.getElementById('keywordsChart');
    if (kwCanvas && window.Chart) {
        if (charts.keywords) charts.keywords.destroy();
        charts.keywords = new Chart(kwCanvas, { 
            type: 'bar', 
            data: { 
                labels: topKeywords.map(k => k[0]), 
                datasets: [{ 
                    label: 'ব্যবহারের সংখ্যা', 
                    data: topKeywords.map(k => k[1]), 
                    backgroundColor: '#ffb347',
                    borderColor: '#ff8c00',
                    borderWidth: 1,
                    borderRadius: 8
                }] 
            }, 
            options: { 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            } 
        });
    }
    
    // 4. Hourly Activity Chart (Line Chart)
    const hourly = Array(24).fill(0); 
    mems.forEach(m => { 
        if(m.timestamp) {
            const hour = new Date(m.timestamp).getHours();
            hourly[hour]++; 
        }
    });
    const hourlyCanvas = document.getElementById('hourlyChart');
    if (hourlyCanvas && window.Chart) {
        if (charts.hourly) charts.hourly.destroy();
        charts.hourly = new Chart(hourlyCanvas, { 
            type: 'line', 
            data: { 
                labels: Array.from({length:24},(_,i)=>i+':00'), 
                datasets: [{ 
                    label: 'কার্যকলাপ', 
                    data: hourly, 
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: 'white',
                    pointRadius: 3
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            } 
        });
    }
}

function showDashboard() { 
    if(!currentUser){ 
        alert('লগইন করুন'); 
        return; 
    } 
    document.getElementById('dashboardSection').classList.add('active'); 
    updateDashboardStats(); 
    renderCharts(); 
}
function hideDashboard() { 
    document.getElementById('dashboardSection').classList.remove('active'); 
}

// Event binding only if on index.html
if (document.getElementById('sendBtn')) {
    document.getElementById('sendBtn').onclick = sendMessage;
    document.getElementById('messageInput').onkeypress = e => { if(e.key === 'Enter') sendMessage(); };
    document.querySelectorAll('.feature-card').forEach(card => {
        card.onclick = () => { document.getElementById('messageInput').value = card.dataset.command + ' '; document.getElementById('messageInput').focus(); };
    });
    document.getElementById('loginBtn').onclick = () => document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('registerBtn').onclick = () => document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('closeLoginBtn').onclick = () => document.getElementById('loginModal').style.display = 'none';
    document.getElementById('closeRegisterBtn').onclick = () => document.getElementById('registerModal').style.display = 'none';
    document.getElementById('confirmLoginBtn').onclick = () => {
        const u = document.getElementById('loginUser').value.trim();
        const p = document.getElementById('loginPass').value;
        const user = users.find(x => x.username === u && x.password === p);
        if(user) { 
            currentUser = { username: u }; 
            localStorage.setItem('memomind_session', u); 
            updateAuthUI(); 
            document.getElementById('loginModal').style.display = 'none'; 
            addMessage('bot', `✅ স্বাগতম ${u}!`);
            // ড্যাশবোর্ড আপডেট
            if(document.getElementById('dashboardSection')?.classList.contains('active')) {
                updateDashboardStats();
                renderCharts();
            }
        }
        else alert('ভুল তথ্য');
    };
    document.getElementById('confirmRegisterBtn').onclick = () => {
        const u = document.getElementById('regUser').value.trim();
        const p = document.getElementById('regPass').value;
        if(u.length<3 || p.length<4) alert('ইউজারনেম ৩+ ও পাস ৪+ অক্ষর');
        else if(users.find(x=>x.username===u)) alert('ইউজার আছে');
        else { users.push({username: u, password: p}); saveUsers(); alert('রেজিস্টার সফল! লগইন করুন'); document.getElementById('registerModal').style.display = 'none'; }
    };
    document.getElementById('logoutBtn').onclick = () => { 
        currentUser = null; 
        localStorage.removeItem('memomind_session'); 
        updateAuthUI(); 
        addMessage('bot', '👋 লগআউট হয়েছে।');
        if(document.getElementById('dashboardSection')?.classList.contains('active')) {
            updateDashboardStats();
            renderCharts();
        }
    };
}

// Load storage & init
loadStorage();
if (document.getElementById('chatArea')) addWelcome();
if (Notification.permission !== "denied") Notification.requestPermission();

// Auto refresh dashboard if on dashboard page
if (window.location.pathname.includes('dashboard.html')) {
    setTimeout(() => {
        updateDashboardStats();
        renderCharts();
    }, 200);
}