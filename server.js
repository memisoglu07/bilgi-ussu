const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// --- HARİTA VE DUVARLAR ---
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
    { x: 0, y: 0, w: 1000, h: 750, isim: "MAVİ BÖLGE", renk: "rgba(0, 150, 255, 0.12)", yaziRengi: "#00a8ff" },
    { x: 1000, y: 0, w: 1000, h: 750, isim: "TURUNCU BÖLGE", renk: "rgba(255, 150, 0, 0.12)", yaziRengi: "#ff9f43" },
    { x: 0, y: 750, w: 1000, h: 750, isim: "YEŞİL BÖLGE", renk: "rgba(46, 213, 115, 0.12)", yaziRengi: "#2ed573" },
    { x: 1000, y: 750, w: 1000, h: 750, isim: "SİYAH ÜS", renk: "rgba(30, 30, 30, 0.35)", yaziRengi: "#a4b0be" }
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
        { soru: "Hücrede enerji üretimi sağlayan organel hangisidir?", secenekler: ["Mitokondri", "Ribozom", "Kloroplast", "Koful"], cevap: 0 },
        { soru: "Bitki hücrelerinde bulunup hayvan hücrelerinde bulunmayan yapı hangisidir?", secenekler: ["Çekirdek", "Sitoplazma", "Hücre Duvarı", "Hücre Zarı"], cevap: 2 }
    ]
};

let aktifOyuncular = {};
let mermiler = [];
let kalanMacSuresi = 300;

setInterval(() => {
    if (kalanMacSuresi > 0) kalanMacSuresi--;
}, 1000);

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

// --- 1. GİRİŞ SAYFASI ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Giriş - Fen Arena</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .kutusu { background: #181818; border: 2px solid #FFD700; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 0 20px rgba(255,215,0,0.3); width: 320px; }
            input, select, button { padding: 12px; margin-top: 12px; width: 90%; border-radius: 6px; border: none; font-size: 15px; }
            input, select { background: #333; color: #fff; border: 1px solid #FFD700; outline: none; }
            button { background: #FFD700; color: #000; font-weight: bold; cursor: pointer; transition: 0.2s; }
            button:hover { background: #fff; transform: scale(1.05); }
            label { font-size: 13px; color: #aaa; display: block; text-align: left; margin-top: 8px; }
        </style></head><body>
            <div class="kutusu">
                <h2>⚡ FEN ARENA ⚡</h2>
                <label>Savaşçı Adı:</label>
                <input type="text" id="isimInput" placeholder="Adını gir..." maxlength="15">
                
                <label>Fen Bilimleri Konusu:</label>
                <select id="konuSecim">
                    <option value="unite1">1. Ünite: Güneş Sistemi ve Ötesi</option>
                    <option value="unite2">2. Ünite: Hücre ve Bölünmeler</option>
                </select>

                <button onclick="girisYap()">İleri (Kostüm Tasarla) ➔</button>
            </div>
            <script>
                function girisYap() {
                    const isim = document.getElementById('isimInput').value.trim();
                    const konu = document.getElementById('konuSecim').value;
                    if(isim) {
                        sessionStorage.setItem('oyuncuIsim', isim);
                        sessionStorage.setItem('oyuncuKonu', konu);
                        window.location.href = '/avatar-yap';
                    } else { alert('Lütfen bir isim girin!'); }
                }
            </script>
        </body></html>
    `);
});

// --- 2. SKİN TASARIM SAYFASI ---
app.get('/avatar-yap', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Skin Yaratıcı ve Yükleyici</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; height: 100vh; margin: 0; padding-top: 30px; user-select: none; }
            h2 { color: #FFD700; margin-bottom: 10px; }
            .container { display: flex; gap: 30px; background: #181818; padding: 20px; border: 2px solid #FFD700; border-radius: 15px; box-shadow: 0 0 20px rgba(255,215,0,0.2); align-items: center; }
            .canvas-box { position: relative; width: 160px; height: 160px; border-radius: 50%; overflow: hidden; border: 3px solid #FFD700; box-shadow: 0 0 15px rgba(255,215,0,0.4); }
            canvas { background: #fff; cursor: crosshair; image-rendering: pixelated; }
            .tools { display: flex; flex-direction: column; gap: 10px; width: 180px; }
            .color-btn { width: 100%; height: 35px; border: 2px solid #333; border-radius: 6px; cursor: pointer; }
            .color-btn.active { border-color: #FFD700; transform: scale(1.05); }
            button, label.file-btn { background: #FFD700; color: #000; font-weight: bold; padding: 10px; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 13px; text-align: center; display: block; }
            button:hover, label.file-btn:hover { background: #fff; }
            .silgi { background: #ff4757; color: white; }
            .silgi:hover { background: #ff6b81; }
            input[type="file"] { display: none; }
            .bilgi-metin { font-size: 11px; color: #aaa; text-align: center; margin-top: 5px; }
        </style></head><body>
            <h2>🎨 Yuvarlak Savaşçı Kostümünü Tasarla</h2>
            <div class="container">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <div class="canvas-box">
                        <canvas id="cizimAlani" width="160" height="160"></canvas>
                    </div>
                    <span class="bilgi-metin">Karakter oyunda yuvarlak görünecek!</span>
                </div>

                <div class="tools">
                    <p style="margin:0; font-size:12px; color:#aaa;">Özel Renk Seç:</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                        <div class="color-btn active" style="background:#000;" onclick="renkSec(this, '#000')"></div>
                        <div class="color-btn" style="background:#fff;" onclick="renkSec(this, '#fff')"></div>
                        <div class="color-btn" style="background:#ff4757;" onclick="renkSec(this, '#ff4757')"></div>
                        <div class="color-btn" style="background:#2ed573;" onclick="renkSec(this, '#2ed573')"></div>
                        <div class="color-btn" style="background:#1e90ff;" onclick="renkSec(this, '#1e90ff')"></div>
                        <div class="color-btn" style="background:#ffa502;" onclick="renkSec(this, '#ffa502')"></div>
                    </div>
                    <input type="color" id="ozelRenk" onchange="renkSec(null, this.value)" style="width:100%; height:35px; cursor:pointer; margin-top:3px; background:none; border:none;">
                    
                    <button class="silgi" onclick="renkSec(null, '#ffffff')">🧹 Silgi</button>
                    <button onclick="temizle()" style="background:#555; color:white;">Tümünü Temizle</button>
                    
                    <label class="file-btn">
                        📁 Bilgisayardan Yükle
                        <input type="file" id="dosyaYukle" accept="image/*" onchange="resimYukle(event)">
                    </label>
                    
                    <button style="margin-top:10px; font-size:15px; padding:12px; background:#2ed573; color:#fff;" onclick="kaydetVeBasla()">⚔️ OYUNA GİR</button>
                </div>
            </div>
            
            <script>
                const canvas = document.getElementById('cizimAlani');
                const ctx = canvas.getContext('2d');
                const gridBoyutu = 16;
                const hucreBoyutu = canvas.width / gridBoyutu;
                
                let aktifRenk = '#000000';
                let cizimYapiyorMu = false;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                function renkSec(el, renk) {
                    aktifRenk = renk;
                    if(el) {
                        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                        el.classList.add('active');
                    }
                }

                function temizle() {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                function resimYukle(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = new Image();
                            img.onload = function() {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            }
                            img.src = e.target.result;
                        }
                        reader.readAsDataURL(file);
                    }
                }

                function boya(e) {
                    if(!cizimYapiyorMu) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / hucreBoyutu) * hucreBoyutu;
                    const y = Math.floor((e.clientY - rect.top) / hucreBoyutu) * hucreBoyutu;
                    
                    ctx.fillStyle = aktifRenk;
                    ctx.fillRect(x, y, hucreBoyutu, hucreBoyutu);
                }

                canvas.addEventListener('mousedown', (e) => { cizimYapiyorMu = true; boya(e); });
                canvas.addEventListener('mousemove', boya);
                canvas.addEventListener('mouseup', () => cizimYapiyorMu = false);
                canvas.addEventListener('mouseleave', () => cizimYapiyorMu = false);

                function kaydetVeBasla() {
                    const avatarData = canvas.toDataURL();
                    sessionStorage.setItem('oyuncuAvatar', avatarData);
                    window.location.href = '/oyun-alani';
                }
            </script>
        </body></html>
    `);
});

// --- 3. OPTİMİZE EDİLMİŞ OYUN ALANI SAYFASI ---
app.get('/oyun-alani', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Fen Bilimleri Chest Arena</title><style>
            body { background:#0f0f0f; color:#fff; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; user-select: none; }
            canvas { background:#181818; border:4px solid #FFD700; box-shadow:0 0 30px rgba(255,215,0,0.4); cursor: crosshair; }
            .ui { margin-bottom:4px; font-size:16px; color:#FFD700; font-weight:bold; }
            .bilgi { font-size:12px; color:#aaa; margin-bottom:4px; }
            
            #ustPanel { position: fixed; top: 15px; left: 20px; display: flex; gap: 15px; z-index: 1000; font-family: monospace; }
            .panelKutusu { background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,215,0,0.3); color: #FFD700; font-size: 13px; }
            #skorTablosuListesi { margin: 4px 0 0 0; padding-left: 15px; font-size: 11px; color: #fff; text-align: left; max-height: 80px; overflow-y: auto; }

            #skinDegisBtn { position: fixed; top: 15px; right: 20px; background: #FFD700; color: #000; border: none; padding: 10px 15px; font-weight: bold; border-radius: 8px; cursor: pointer; z-index: 1000; box-shadow: 0 0 10px rgba(255,215,0,0.4); transition: 0.2s; }
            #skinDegisBtn:hover { background: #fff; transform: scale(1.05); }

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
            <div class="bilgi">Hareket: <b>W,A,S,D</b> | Ateş Et: <b>Sol Tık</b> | Chat: <b>T</b></div>
            
            <button id="skinDegisBtn" onclick="skinSayfasinaGit()">🎨 Skin Değiştir</button>

            <div id="ustPanel">
                <div class="panelKutusu">
                    ⏱️ Maç Süresi: <b id="sayacGosterge" style="color:#fff;">05:00</b>
                </div>
                <div class="panelKutusu" style="min-width: 160px;">
                    🏆 <b>Skor Tablosu</b>
                    <ul id="skorTablosuListesi"></ul>
                </div>
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
                document.addEventListener('contextmenu', e => e.preventDefault());
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
                        e.preventDefault();
                        return false;
                    }
                });

                const isim = sessionStorage.getItem('oyuncuIsim') || 'Savaşçı';
                const konu = sessionStorage.getItem('oyuncuKonu') || 'unite1';
                const avatar = sessionStorage.getItem('oyuncuAvatar') || '';

                const socket = io({ query: { isim: isim, konu: konu } });

                socket.on('connect', () => {
                    if(avatar) socket.emit('avatarGuncelle', avatar);
                });

                function skinSayfasinaGit() {
                    window.location.href = '/avatar-yap';
                }

                const canvas = document.getElementById('arena');
                const ctx = canvas.getContext('2d');

                let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)}, kalanSure: 300 };
                let yuklenmisAvatarResimleri = {};

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

                // Hareket Gönderim Optimizasyonu
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

                // --- Tarayıcı Kasmasını Önleyen requestAnimationFrame Döngüsü ---
                function oyunDongusu() {
                    cizimYap();
                    requestAnimationFrame(oyunDongusu);
                }
                requestAnimationFrame(oyunDongusu);

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
                        ctx.font = 'bold 28px monospace';
                        ctx.fillText(b.isim, b.x + 40, b.y + 50);
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

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.clip();

                        if (p.avatarData) {
                            if (!yuklenmisAvatarResimleri[id] || yuklenmisAvatarResimleri[id].src !== p.avatarData) {
                                let img = new Image();
                                img.src = p.avatarData;
                                yuklenmisAvatarResimleri[id] = img;
                            }
                            let kisiselSkin = yuklenmisAvatarResimleri[id];
                            if (kisiselSkin.complete) {
                                ctx.drawImage(kisiselSkin, -20, -20, 40, 40);
                            }
                        } else {
                            ctx.fillStyle = '#FFD700';
                            ctx.fillRect(-20, -20, 40, 40);
                        }
                        ctx.restore();

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

io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let konu = socket.handshake.query.konu || 'unite1';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = {
        id: socket.id,
        isim: isim,
        konu: konu,
        x: spawn.x,
        y: spawn.y,
        can: 100,
        skor: 0,
        avatarData: ''
    };

    socket.on('avatarGuncelle', (veri) => {
        if(aktifOyuncular[socket.id]) {
            aktifOyuncular[socket.id].avatarData = veri;
        }
    });

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

setInterval(() => {
    for (let c of chestler) {
        if (c.aktif) {
            for (let id in aktifOyuncular) {
                let p = aktifOyuncular[id];
                let mesafe = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
                if (mesafe < 35) {
                    c.aktif = false;
                    let oyuncununKonusu = p.konu || 'unite1';
                    let havuz = SORU_HAVUZU[oyuncununKonusu] || SORU_HAVUZU.unite1;
                    let rastgeleSoru = havuz[Math.floor(Math.random() * havuz.length)];

                    io.to(id).emit('soruGoster', { chestId: c.id, soruData: rastgeleSoru });
                    setTimeout(() => { c.aktif = true; }, 10000);
                    break;
                }
            }
        }
    }
}, 500);

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
