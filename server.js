const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Statik dosyalar (örneğin /karakterler/Chest.webp için)
app.use(express.static(path.join(__dirname, 'public')));

// --- HARİTA VE OYUN AYARLARI ---
const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 1500;

const DUVARLAR = [
    { x: 300, y: 200, w: 400, h: 40 },
    { x: 800, y: 500, w: 40, h: 500 },
    { x: 1200, y: 300, w: 500, h: 40 },
    { x: 400, y: 1000, w: 600, h: 40 },
    { x: 1400, y: 900, w: 40, h: 400 }
];

const BOLGELER = [
    { x: 50, y: 50, w: 500, h: 400, isim: "1. ÜNİTE BÖLGESİ", renk: "rgba(0, 150, 255, 0.15)", yaziRengi: "#00a8ff" },
    { x: 1300, y: 50, w: 600, h: 400, isim: "2. ÜNİTE BÖLGESİ", renk: "rgba(255, 150, 0, 0.15)", yaziRengi: "#ff9f43" },
    { x: 50, y: 1000, w: 600, h: 400, isim: "3. ÜNİTE BÖLGESİ", renk: "rgba(46, 213, 115, 0.15)", yaziRengi: "#2ed573" }
];

let chestler = [
    { id: 1, x: 400, y: 400, aktif: true },
    { id: 2, x: 1000, y: 700, aktif: true },
    { id: 3, x: 1500, y: 500, aktif: true },
    { id: 4, x: 600, y: 1200, aktif: true },
    { id: 5, x: 1600, y: 1100, aktif: true }
];

const SORU_HAVUZU = {
    unite1: [
        { soru: "Güneş sistemindeki en büyük gezegen hangisidir?", secenekler: ["Dünya", "Jüpiter", "Mars", "Satürn"], cevap: 1 },
        { soru: "Dünya'nın tek doğal uydusu nedir?", secenekler: ["Güneş", "Ay", "Titan", "Phobos"], cevap: 1 }
    ],
    unite2: [
        { soru: "Hücrenin yönetim merkezi neresidir?", secenekler: ["Mitokondri", "Çekirdek", "Sitoplazma", "Kloroplast"], cevap: 1 },
        { soru: "Bitki hücresinde bulunup hayvan hücresinde bulunmayan organel hangisidir?", secenekler: ["Kloroplast", "Ribozom", "Koful", "Golgi"], cevap: 0 }
    ],
    unite3: [
        { soru: "Kuvvetin birimi nedir?", secenekler: ["Pascal", "Joule", "Newton", "Watt"], cevap: 2 }
    ]
};

let aktifOyuncular = {};
let mermiler = [];
let kalanMacSuresi = 300; // 5 dakika

// Sayac Döngüsü
setInterval(() => {
    if (kalanMacSuresi > 0) kalanMacSuresi--;
}, 1000);

// Çarpışma Kontrolü
function carpismaVarMi(x, y, yaricap) {
    for (let d of DUVARLAR) {
        if (x + yaricap > d.x && x - yaricap < d.x + d.w &&
            y + yaricap > d.y && y - yaricap < d.y + d.h) {
            return true;
        }
    }
    return false;
}

function rastgeleSpawnBul() {
    let x, y, guvenli = false;
    while (!guvenli) {
        x = Math.floor(Math.random() * (HARITA_GENISLIK - 100)) + 50;
        y = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 100)) + 50;
        if (!carpismaVarMi(x, y, 30)) guvenli = true;
    }
    return { x, y };
}

// --- ROUTE'LAR (SAYFALAR) ---

// 1. Ana Sayfa (İsim Girişi)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Giriş - Fen Arena</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .kutusu { background: #181818; border: 2px solid #FFD700; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 0 20px rgba(255,215,0,0.3); }
            input, button { padding: 12px; margin-top: 10px; width: 80%; border-radius: 6px; border: none; font-size: 16px; }
            input { background: #333; color: #fff; border: 1px solid #FFD700; }
            button { background: #FFD700; color: #000; font-weight: bold; cursor: pointer; }
            button:hover { background: #e6c200; }
        </style></head><body>
            <div class="kutusu">
                <h2>⚡ FEN BİLİMLERİ ARENA ⚡</h2>
                <p>Oyuna katılmak için adını gir:</p>
                <input type="text" id="isimInput" placeholder="Oyuncu Adı..." maxlength="15"><br>
                <button onclick="girisYap()">Oyuna Başla</button>
            </div>
            <script>
                function girisYap() {
                    const isim = document.getElementById('isimInput').value.trim();
                    if(isim) {
                        sessionStorage.setItem('oyuncuIsim', isim);
                        window.location.href = '/unite-sec';
                    } else { alert('Lütfen bir isim girin!'); }
                }
            </script>
        </body></html>
    `);
});

// 2. Ünite Seçim Sayfası
app.get('/unite-sec', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Ünite Seçimi</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .btn { background: #222; color: #FFD700; border: 2px solid #FFD700; padding: 15px 30px; margin: 10px; border-radius: 8px; font-size: 18px; cursor: pointer; width: 250px; font-weight: bold; transition: 0.2s; }
            .btn:hover { background: #FFD700; color: #000; }
        </style></head><body>
            <h2>📘 Hangi Üniteden Soru Çıksın?</h2>
            <button class="btn" onclick="sec('unite1')">1. Ünite: Güneş Sistemi</button>
            <button class="btn" onclick="sec('unite2')">2. Ünite: Hücre ve Bölünmeler</button>
            <button class="btn" onclick="sec('unite3')">3. Ünite: Kuvvet ve Enerji</button>
            <script>
                function sec(u) {
                    sessionStorage.setItem('secilenUnite', u);
                    window.location.href = '/oyun-alani';
                }
            </script>
        </body></html>
    `);
});

// 3. Oyun Alanı (Sağ tık ve F12 Korumalı + Özel Hile Desteği)
app.get('/oyun-alani', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Fen Bilimleri Chest Arena</title><style>
            body { background:#0f0f0f; color:#fff; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; user-select: none; }
            canvas { background:#181818; border:4px solid #FFD700; box-shadow:0 0 30px rgba(255,215,0,0.4); cursor: crosshair; }
            .ui { margin-bottom:4px; font-size:16px; color:#FFD700; font-weight:bold; }
            .bilgi { font-size:12px; color:#aaa; margin-bottom:4px; }
            
            #muzikPaneli { position: fixed; top: 15px; right: 20px; background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; z-index: 1000; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 15px rgba(255,215,0,0.3); }
            #muzikPaneli button { background: #333; color: #FFD700; border: 1px solid #FFD700; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.2s; }
            #muzikPaneli button:hover { background: #FFD700; color: #000; }

            #ustPanel { position: fixed; top: 15px; left: 20px; display: flex; gap: 15px; z-index: 1000; font-family: monospace; }
            .panelKutusu { background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,215,0,0.3); color: #FFD700; font-size: 13px; }
            #skorTablosuListesi { margin: 4px 0 0 0; padding-left: 15px; font-size: 11px; color: #fff; text-align: left; max-height: 80px; overflow-y: auto; }

            #soruModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(20, 20, 20, 0.95); border: 3px solid #FFD700; padding: 25px; border-radius: 15px; z-index: 10000; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(255,215,0,0.5); }
            #soruBaslik { font-size: 16px; color: #FFD700; margin-bottom: 15px; font-weight: bold; }
            .secenekBtn { display: block; width: 100%; padding: 10px; margin: 8px 0; background: #333; color: #fff; border: 1px solid #FFD700; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .secenekBtn:hover { background: #FFD700; color: #000; font-weight: bold; }

            #chatContainer { position: fixed; bottom: 20px; left: 20px; width: 350px; z-index: 999; display: flex; flex-direction: column; pointer-events: none; }
            #chatGecmisi { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow: hidden; margin-bottom: 6px; }
            .chat-satir { background: rgba(0, 0, 0, 0.45); color: #fff; padding: 4px 8px; font-size: 13px; border-radius: 3px; width: fit-content; text-shadow: 1px 1px 1px #000; font-family: monospace; }
            #chatInput { display: none; width: 100%; background: rgba(0, 0, 0, 0.85); border: 2px solid #FFD700; color: #fff; padding: 8px; font-size: 14px; outline: none; border-radius: 4px; pointer-events: auto; font-family: monospace; box-sizing: border-box; }

            #killFeed { position: fixed; top: 70px; right: 20px; display: flex; flex-direction: column; gap: 5px; z-index: 999; pointer-events: none; align-items: flex-end; }
            .kill-msg { background: rgba(0, 0, 0, 0.65); border-left: 4px solid #ff4757; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
        </style></head><body>
            <div class="ui">⭐ BİLGİ ÜSSÜ FEN BİLİMLERİ ARENA ⭐</div>
            <div class="bilgi">Hareket: <b>W,A,S,D</b> | Ateş Et: <b>Sol Tık</b> | Chat: <b>T</b> | <a href="/unite-sec" style="color:#ff4757; text-decoration:none;">Ünite Değiştir</a></div>
            
            <div id="ustPanel">
                <div class="panelKutusu">
                    ⏱️ Maç Süresi: <b id="sayacGosterge" style="color:#fff;">05:00</b>
                </div>
                <div class="panelKutusu" style="min-width: 160px;">
                    🏆 <b>Skor Tablosu</b>
                    <ul id="skorTablosuListesi"></ul>
                </div>
            </div>

            <div id="muzikPaneli">
                <span id="sesIkona" style="cursor:pointer; font-size:18px;" onclick="toggleMuzik()" title="Sesi Aç/Kapat">🔊</span>
                <button onclick="oynat('https://upload.wikimedia.org/wikipedia/commons/b/b2/Beethoven_Moonlight_1st_movement.ogg')">Klasik</button>
                <button onclick="oynat('https://upload.wikimedia.org/wikipedia/commons/d/d4/Mozart_Eine_kleine_Nachtmusik_1st_movement.ogg')">Nachtmusik</button>
                <button onclick="oynat('https://upload.wikimedia.org/wikipedia/commons/e/e2/Vivaldi_The_Four_Seasons_-_Spring_mvt_1_-_John_Harrison_violin.ogg')">Vivaldi</button>
            </div>

            <div id="soruModal">
                <div id="soruBaslik">Soru Yükleniyor...</div>
                <div id="seceneklerDiv"></div>
            </div>

            <div id="killFeed"></div>

            <div id="chatContainer">
                <div id="chatGecmisi"></div>
                <input type="text" id="chatInput" placeholder="Mesaj yazmak için Enter'a bas..." autocomplete="off">
            </div>

            <canvas id="arena" width="1100" height="650"></canvas>
            
            <script src="/socket.io/socket.io.js"></script>
            <script>
                // --- İNCELE VE F12 KORUMASI ---
                document.addEventListener('contextmenu', e => e.preventDefault());
                document.addEventListener('keydown', (e) => {
                    if (
                        e.key === 'F12' || 
                        (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || 
                        (e.ctrlKey && e.key.toLowerCase() === 'u')
                    ) {
                        e.preventDefault();
                        return false;
                    }
                });

                let muzik = window.muzik || new Audio(sessionStorage.getItem('muzikSrc') || 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Beethoven_Moonlight_1st_movement.ogg');
                window.muzik = muzik;
                muzik.loop = true;
                muzik.volume = 0.4;
                
                window.onload = () => {
                    muzik.currentTime = parseFloat(sessionStorage.getItem('muzikTime')) || 0;
                    if(sessionStorage.getItem('muzikPlaying') === 'true') {
                        muzik.play().catch(e => console.log("Müzik oto-başlatma engellendi"));
                    }
                };
                setInterval(() => sessionStorage.setItem('muzikTime', muzik.currentTime), 500);

                function oynat(url) { 
                    muzik.src = url; 
                    sessionStorage.setItem('muzikSrc', url); 
                    muzik.play(); 
                    sessionStorage.setItem('muzikPlaying', 'true'); 
                    document.getElementById('sesIkona').innerText = '🔊';
                }

                function toggleMuzik() {
                    if(muzik.paused) { 
                        muzik.play(); 
                        sessionStorage.setItem('muzikPlaying', 'true'); 
                        document.getElementById('sesIkona').innerText = '🔊'; 
                    } else { 
                        muzik.pause(); 
                        sessionStorage.setItem('muzikPlaying', 'false'); 
                        document.getElementById('sesIkona').innerText = '🔇'; 
                    }
                }

                const isim = sessionStorage.getItem('oyuncuIsim') || 'Savaşçı';
                const secilenUnite = sessionStorage.getItem('secilenUnite') || 'unite1';

                const socket = io({ query: { isim: isim, unite: secilenUnite } });

                const canvas = document.getElementById('arena');
                const ctx = canvas.getContext('2d');

                let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)}, kalanSure: 300 };
                let chestImg = new Image();
                let chestYuklendi = false;
                chestImg.onload = () => { chestYuklendi = true; };
                chestImg.src = '/karakterler/Chest.webp';

                let tuslar = {};
                let chatAcik = false;
                let soruAcik = false;

                window.addEventListener('keydown', (e) => {
                    if (soruAcik) return;
                    if (e.key.toLowerCase() === 't' && !chatAcik) {
                        e.preventDefault();
                        chatAcik = true;
                        let input = document.getElementById('chatInput');
                        input.style.display = 'block';
                        input.focus();
                    } else if (e.key === 'Escape' && chatAcik) {
                        chatAcik = false;
                        document.getElementById('chatInput').style.display = 'none';
                    }
                    if (!chatAcik) tuslar[e.key.toLowerCase()] = true;
                });

                window.addEventListener('keyup', (e) => { if (!chatAcik) tuslar[e.key.toLowerCase()] = false; });

                document.getElementById('chatInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        let mesaj = e.target.value.trim();
                        if (mesaj.length > 0) socket.emit('chatMesaji', mesaj);
                        e.target.value = '';
                        e.target.style.display = 'none';
                        chatAcik = false;
                    }
                });

                window.addEventListener('mousedown', (e) => {
                    if (chatAcik || soruAcik || e.button !== 0) return; 
                    const rect = canvas.getBoundingClientRect();
                    let tikX = e.clientX - rect.left;
                    let tikY = e.clientY - rect.top;

                    let benimId = socket.id;
                    let ben = oyunVerisi.players[benimId];
                    if (!ben) return;

                    let kameraX = Math.max(0, Math.min(ben.x - canvas.width / 2, ${HARITA_GENISLIK} - canvas.width));
                    let kameraY = Math.max(0, Math.min(ben.y - canvas.height / 2, ${HARITA_YUKSEKLIK} - canvas.height));

                    socket.emit('atesEt', { x: tikX + kameraX, y: tikY + kameraY });
                });

                setInterval(() => {
                    if (chatAcik || soruAcik) return;
                    let hareket = {x: 0, y: 0};
                    let hiz = 6;

                    if(tuslar['w'] || tuslar['arrowup']) hareket.y = -hiz;
                    if(tuslar['s'] || tuslar['arrowdown']) hareket.y = hiz;
                    if(tuslar['a'] || tuslar['arrowleft']) hareket.x = -hiz;
                    if(tuslar['d'] || tuslar['arrowright']) hareket.x = hiz;

                    if(hareket.x !== 0 || hareket.y !== 0) socket.emit('hareketEt', hareket);
                }, 1000 / 60);

                socket.on('arenaGuncelle', (data) => { 
                    oyunVerisi = data; 
                    
                    let dk = Math.floor(data.kalanSure / 60);
                    let sn = data.kalanSure % 60;
                    let sayacEl = document.getElementById('sayacGosterge');
                    if (sayacEl) sayacEl.innerText = (dk < 10 ? '0' + dk : dk) + ':' + (sn < 10 ? '0' + sn : sn);
                    
                    let liste = document.getElementById('skorTablosuListesi');
                    if (liste) {
                        liste.innerHTML = '';
                        let oyuncuDizi = Object.values(data.players).sort((a, b) => b.skor - a.skor);
                        oyuncuDizi.slice(0, 5).forEach((p, index) => {
                            let li = document.createElement('li');
                            li.innerHTML = \`\${index + 1}. \${p.isim}: <b style="color:#FFD700;">\${p.skor}⭐</b>\`;
                            liste.appendChild(li);
                        });
                    }

                    cizimYap(); 
                });

                socket.on('soruGoster', (veri) => {
                    soruAcik = true;
                    document.getElementById('soruModal').style.display = 'block';
                    document.getElementById('soruBaslik').innerText = "📦 " + veri.soruData.soru;

                    let seceneklerDiv = document.getElementById('seceneklerDiv');
                    seceneklerDiv.innerHTML = '';

                    veri.soruData.secenekler.forEach((sec, index) => {
                        let btn = document.createElement('button');
                        btn.className = 'secenekBtn';
                        btn.innerText = sec;
                        btn.onclick = () => {
                            socket.emit('cevapVer', { chestId: veri.chestId, secilenIndex: index, dogruCevap: veri.soruData.cevap });
                            document.getElementById('soruModal').style.display = 'none';
                            soruAcik = false;
                        };
                        seceneklerDiv.appendChild(btn);
                    });
                });

                socket.on('olumBildirimi', (mesaj) => {
                    const killFeed = document.getElementById('killFeed');
                    const div = document.createElement('div');
                    div.className = 'kill-msg';
                    div.innerText = mesaj;
                    killFeed.appendChild(div);
                    setTimeout(() => div.remove(), 4000);
                });

                socket.on('chatMesajiGelsin', (data) => {
                    const chatGecmisi = document.getElementById('chatGecmisi');
                    const div = document.createElement('div');
                    div.className = 'chat-satir';
                    div.innerHTML = \`<b style="color: #FFD700;">\${data.isim}:</b> \${data.mesaj}\`;
                    chatGecmisi.appendChild(div);
                    if (chatGecmisi.children.length > 6) chatGecmisi.children[0].remove();
                    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
                });

                function cizimYap() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    let benimId = socket.id;
                    let ben = oyunVerisi.players[benimId];

                    let kameraX = 0, kameraY = 0;
                    if (ben) {
                        kameraX = Math.max(0, Math.min(ben.x - canvas.width / 2, ${HARITA_GENISLIK} - canvas.width));
                        kameraY = Math.max(0, Math.min(ben.y - canvas.height / 2, ${HARITA_YUKSEKLIK} - canvas.height));
                    }

                    ctx.save();
                    ctx.translate(-kameraX, -kameraY);

                    for(let b of oyunVerisi.bolgeler) {
                        ctx.fillStyle = b.renk;
                        ctx.fillRect(b.x, b.y, b.w, b.h);
                        ctx.strokeStyle = b.yaziRengi;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(b.x, b.y, b.w, b.h);
                        
                        ctx.fillStyle = b.yaziRengi;
                        ctx.font = 'bold 24px monospace';
                        ctx.fillText(b.isim, b.x + 30, b.y + 40);
                    }

                    ctx.fillStyle = '#444';
                    for(let d of oyunVerisi.walls) {
                        ctx.fillRect(d.x, d.y, d.w, d.h);
                        ctx.strokeStyle = '#666';
                        ctx.strokeRect(d.x, d.y, d.w, d.h);
                    }

                    for(let c of oyunVerisi.chests) {
                        if(c.aktif) {
                            if (chestYuklendi) {
                                ctx.drawImage(chestImg, c.x - 20, c.y - 20, 40, 40);
                            } else {
                                ctx.fillStyle = '#ff9f43';
                                ctx.fillRect(c.x - 20, c.y - 20, 40, 40);
                            }
                        }
                    }

                    for(let m of oyunVerisi.bullets) {
                        ctx.fillStyle = '#ff4757';
                        ctx.beginPath();
                        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    for(let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        ctx.save();
                        ctx.translate(p.x, p.y);

                        ctx.fillStyle = 'red';
                        ctx.fillRect(-25, -45, 50, 6);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(-25, -45, (Math.min(p.can, 100) / 100) * 50, 6);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, 0, -30);

                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.restore();
                    }

                    ctx.restore();
                }
            </script>
        </body></html>
    `);
});

// --- SOCKET.IO SUNUCU MANTIĞI ---
io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let secilenUnite = socket.handshake.query.unite || 'unite1';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = {
        id: socket.id,
        isim: isim,
        unite: secilenUnite,
        x: spawn.x,
        y: spawn.y,
        can: 100,
        skor: 0
    };

    socket.on('hareketEt', (h) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        let yeniX = p.x + h.x;
        let yeniY = p.y + h.y;

        if(!carpismaVarMi(yeniX, yeniY, 20)) {
            p.x = Math.max(20, Math.min(HARITA_GENISLIK - 20, yeniX));
            p.y = Math.max(20, Math.min(HARITA_YUKSEKLIK - 20, yeniY));
        }
    });

    socket.on('atesEt', (hedef) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        let aci = Math.atan2(hedef.y - p.y, hedef.x - p.x);
        mermiler.push({
            id: socket.id,
            x: p.x,
            y: p.y,
            dx: Math.cos(aci) * 10,
            dy: Math.sin(aci) * 10,
            mesafe: 0
        });
    });

    socket.on('chatMesaji', (mesaj) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;

        // --- SADECE SENİN KULLANABİLECEĞİN GİZLİ HİLE KODU ---
        if (mesaj === '/selmanhile') {
            p.can = 9999;
            p.skor += 50;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '👑 YÖNETİCİ HİLESİ AKTİF: Sınırsız Can & +50 Puan yüklendi!' });
            return;
        }

        io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: mesaj });
    });

    socket.on('cevapVer', (veri) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        if (veri.secilenIndex === veri.dogruCevap) {
            p.skor += 3;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '🎉 Doğru cevap! +3 Puan kazandın.' });
        } else {
            p.can = Math.max(10, p.can - 15);
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '❌ Yanlış cevap! 15 Can kaybettin.' });
        }
    });

    socket.on('disconnect', () => {
        delete aktifOyuncular[socket.id];
    });
});

// Sandık Etkileşim Döngüsü
setInterval(() => {
    for (let c of chestler) {
        if (c.aktif) {
            for (let id in aktifOyuncular) {
                let p = aktifOyuncular[id];
                let mesafe = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
                if (mesafe < 35) {
                    c.aktif = false;
                    let liste = SORU_HAVUZU[p.unite] || SORU_HAVUZU["unite1"];
                    let rastgeleSoru = liste[Math.floor(Math.random() * liste.length)];
                    
                    io.to(id).emit('soruGoster', { chestId: c.id, soruData: rastgeleSoru });

                    setTimeout(() => { c.aktif = true; }, 10000);
                    break;
                }
            }
        }
    }
}, 500);

// Fizik ve Mermi Döngüsü (60 FPS)
setInterval(() => {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.dx;
        m.y += m.dy;
        m.mesafe += 10;

        if (m.mesafe > 600 || carpismaVarMi(m.x, m.y, 5)) {
            mermiler.splice(i, 1);
            continue;
        }

        for (let id in aktifOyuncular) {
            if (id !== m.id) {
                let p = aktifOyuncular[id];
                let uzaklik = Math.sqrt((p.x - m.x) ** 2 + (p.y - m.y) ** 2);
                if (uzaklik < 25) {
                    p.can -= 20;
                    mermiler.splice(i, 1);

                    if (p.can <= 0) {
                        p.can = 100;
                        let sp = rastgeleSpawnBul();
                        p.x = sp.x;
                        p.y = sp.y;
                        if(aktifOyuncular[m.id]) {
                            aktifOyuncular[m.id].skor += 1;
                            io.emit('olumBildirimi', `${aktifOyuncular[m.id].isim}, ${p.isim}'i avladı!`);
                        }
                    }
                    break;
                }
            }
        }
    }

    io.emit('arenaGuncelle', {
        players: aktifOyuncular,
        bullets: mermiler,
        walls: DUVARLAR,
        chests: chestler,
        bolgeler: BOLGELER,
        kalanSure: kalanMacSuresi
    });
}, 1000 / 60);

server.listen(PORT, () => {
    console.log(`Sunucu aktif: Port ${PORT}`);
});
