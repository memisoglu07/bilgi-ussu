const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

app.use('/karakterler', express.static(path.join(__dirname, '../oyun_projem/karakterler')));

// Veritabanı Bağlantısı (Render çökmelerini önleyen güvenli mod)
const db = mysql.createConnection({ 
    host: process.env.DB_HOST || '127.0.0.1', 
    port: process.env.DB_PORT || 8889, 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'root', 
    database: process.env.DB_NAME || 'bilgi_ussu_proje' 
});

db.connect((err) => {
    if (err) {
        console.log("⚠️ Veritabanı bağlantısı kurulamadı (Lokal harici ortam), ancak sunucu çalışmaya devam ediyor.");
    } else {
        console.log("✅ Veritabanına başarıyla bağlanıldı!");
    }
});

const layout = (content, title = "BİLGİ ÜSSÜ - BRAWL ARENA") => `
    <!DOCTYPE html><html><head><title>${title}</title><style>
        body { background:#0a0a0a; color:#FFD700; font-family: 'Segoe UI', sans-serif; margin:0; min-height:100vh; display:flex; justify-content:center; align-items:center; }
        .box { background:linear-gradient(145deg, #1e1e1e, #000); padding:40px; border-radius:20px; border:2px solid #FFD700; width:500px; text-align:center; box-shadow:0 0 40px rgba(255,215,0,0.2); }
        .btn { display:block; padding:15px; margin:10px 0; border-radius:10px; background:#FFD700; color:#000; font-weight:bold; text-decoration:none; cursor:pointer; border:none; transition:0.3s; font-size:16px; width:100%; box-sizing:border-box; }
        .btn:hover { background:#ffc107; transform:scale(1.02); }
    </style></head><body>
        <div class="box">${content}</div>
    </body></html>`;

app.get('/', (req, res) => res.send(layout(`
    <h1>BİLGİ ÜSSÜ</h1>
    <p>Fen Bilimleri Kaliteli Chest Soruları & Arena</p><br>
    <a href="/karakter-sec" class="btn" style="background:#ff4757; color:#fff;">🎨 Karakterini Tasarla ve Başla</a>
`)));

app.get('/karakter-sec', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Karakter Tasarımı</title><style>
            body { background:#0a0a0a; color:#FFD700; font-family:'Segoe UI', sans-serif; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; }
            .box { background:linear-gradient(145deg, #1e1e1e, #000); padding:25px; border-radius:20px; border:2px solid #FFD700; width:420px; text-align:center; box-shadow:0 0 30px rgba(255,215,0,0.2); }
            input[type="text"], input[type="file"], input[type="color"] { width: 100%; padding: 8px; margin: 6px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; box-sizing: border-box; text-align: center; font-size: 14px; }
            input[type="file"] { cursor: pointer; padding: 6px; }
            .btn { display:block; padding:12px; margin-top:10px; border-radius:10px; background:#FFD700; color:#000; font-weight:bold; text-decoration:none; cursor:pointer; border:none; width:100%; font-size:15px; transition:0.3s; }
            .btn:hover { background:#ffc107; transform:scale(1.02); }
            canvas { background:#222; border:3px solid #FFD700; border-radius:50%; cursor:crosshair; box-shadow:0 0 15px rgba(255,215,0,0.3); margin: 8px auto; display:block; }
        </style></head><body>
            <div class="box">
                <h2>ÖZEL KARAKTER TASARIMI</h2>
                <p style="font-size:12px; color:#aaa;">Fen Bilgisi Chest Arenası</p>
                
                <input type="text" id="oyuncuAdi" placeholder="Oyuncu Adın" maxlength="12" value="Savaşçı">
                
                <div style="text-align:left; font-size:12px; color:#FFD700; margin-top:4px;">Karakter Görseli Seç:</div>
                <input type="file" id="dosyaSecici" accept="image/*" onchange="resimYukle(event)">

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <span style="font-size:12px; color:#FFD700;">Fırça Rengi:</span>
                    <input type="color" id="fircaRengi" value="#FF4757" style="width:70%; height:35px; padding:2px; cursor:pointer;">
                </div>

                <canvas id="tasarimCanvas" width="130" height="130"></canvas>
                
                <div style="display:flex; gap:10px;">
                    <button type="button" class="btn" style="background:#333; color:#FFD700; padding:8px; font-size:12px;" onclick="temizleCanvas()">Temizle</button>
                    <button type="button" class="btn" style="padding:8px; font-size:12px;" onclick="oyunaBasla()">Savaş Alanına Gir!</button>
                </div>
                
                <br><a href="/" style="color:#888; font-size:12px; text-decoration:none;">Ana Sayfaya Dön</a>
            </div>
            <script>
                const canvas = document.getElementById('tasarimCanvas');
                const ctx = canvas.getContext('2d');
                let ciziyor = false;

                ctx.fillStyle = "#111";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                canvas.addEventListener('mousedown', (e) => { ciziyor = true; ciz(e); });
                window.addEventListener('mouseup', () => ciziyor = false);
                canvas.addEventListener('mousemove', ciz);

                function ciz(e) {
                    if (!ciziyor) return;
                    const rect = canvas.getBoundingClientRect();
                    let x = e.clientX - rect.left;
                    let y = e.clientY - rect.top;

                    ctx.fillStyle = document.getElementById('fircaRengi').value;
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }

                function resimYukle(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = function(f) {
                        const img = new Image();
                        img.onload = function() {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            let sourceWidth = img.width;
                            let sourceHeight = img.height;
                            let size = Math.min(sourceWidth, sourceHeight);
                            let sourceX = (sourceWidth - size) / 2;
                            let sourceY = (sourceHeight - size) / 2;

                            ctx.fillStyle = "#111";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, canvas.width, canvas.height);
                        }
                        img.src = f.target.result;
                    }
                    reader.readAsDataURL(file);
                }

                function temizleCanvas() {
                    ctx.fillStyle = "#111";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                function oyunaBasla() {
                    let isim = document.getElementById('oyuncuAdi').value || 'Savaşçı';
                    let avatarData = canvas.toDataURL();
                    
                    sessionStorage.setItem('oyuncuIsim', isim);
                    sessionStorage.setItem('oyuncuAvatar', avatarData);
                    
                    window.location.href = '/oyun-alani';
                }
            </script>
        </body></html>
    `);
});

const FEN_SORULARI = [
    { soru: "Güneş'e en yakın olan gezegen hangisidir?", secenekler: ["Merkür", "Venüs", "Dünya", "Mars"], cevap: 0 },
    { soru: "Halkasıyla bilinen en büyük gaz devi gezegen hangisidir?", secenekler: ["Jüpiter", "Satürn", "Uranüs", "Neptün"], cevap: 1 },
    { soru: "Güneş sisteminin en sıcak gezegeni hangisidir?", secenekler: ["Merkür", "Venüs", "Mars", "Jüpiter"], cevap: 1 },
    { soru: "Üzerinde sıvı su bulunduran ve yaşam olan tek gezegen hangisidir?", secenekler: ["Mars", "Venüs", "Dünya", "Neptün"], cevap: 2 },
    { soru: "Kızıl Gezegen olarak bilinen gezegen hangisidir?", secenekler: ["Jüpiter", "Mars", "Satürn", "Merkür"], cevap: 1 },
    { soru: "Güneş sisteminin en büyük gezegeni hangisidir?", secenekler: ["Satürn", "Jüpiter", "Uranüs", "Neptün"], cevap: 1 },
    { soru: "Güneş'e en uzak olan gezegen hangisidir?", secenekler: ["Uranüs", "Neptün", "Satürn", "Jüpiter"], cevap: 1 },
    { soru: "Güneş tutulmasında hangi gök cismi ortadadır?", secenekler: ["Dünya", "Güneş", "Ay", "Mars"], cevap: 2 },
    { soru: "Ay tutulmasında hangi gök cismi ortadadır?", secenekler: ["Ay", "Dünya", "Güneş", "Venüs"], cevap: 1 },
    { soru: "Güneş tutulması olayı ayın hangi evresinde gerçekleşir?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Son Dördün"], cevap: 0 }
];

const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 1500;

const BOLGELER = [
    { isim: "TURUNCU BÖLGE", x: 0, y: 0, w: 1000, h: 750, renk: "rgba(255, 140, 0, 0.08)", yaziRengi: "#ff8c00" },
    { isim: "SİYAH BÖLGE", x: 1000, y: 0, w: 1000, h: 750, renk: "rgba(30, 30, 30, 0.15)", yaziRengi: "#aaaaaa" },
    { isim: "MAVİ BÖLGE", x: 0, y: 750, w: 1000, h: 750, renk: "rgba(0, 150, 255, 0.08)", yaziRengi: "#0096ff" },
    { isim: "YEŞİL BÖLGE", x: 1000, y: 750, w: 1000, h: 750, renk: "rgba(0, 255, 100, 0.08)", yaziRengi: "#00ff64" }
];

const DUVARLAR = [
    { x: 0, y: 0, w: 2000, h: 40 },
    { x: 0, y: 1460, w: 2000, h: 40 },
    { x: 0, y: 0, w: 40, h: 1500 },
    { x: 1960, y: 0, w: 40, h: 1500 },
    { x: 300, y: 300, w: 150, h: 150 },
    { x: 1550, y: 300, w: 150, h: 150 },
    { x: 300, y: 1050, w: 150, h: 150 },
    { x: 1550, y: 1050, w: 150, h: 150 },
    { x: 600, y: 650, w: 80, h: 200 },
    { x: 1320, y: 650, w: 80, h: 200 }
];

let chestler = [
    { id: 1, x: 500, y: 200, aktif: true },
    { id: 2, x: 1500, y: 200, aktif: true },
    { id: 3, x: 1000, y: 400, aktif: true },
    { id: 4, x: 500, y: 1300, aktif: true },
    { id: 5, x: 1500, y: 1300, aktif: true }
];

let aktifOyuncular = {};
let mermiler = [];
let kalanMacSuresi = 300; 

setInterval(() => {
    if (kalanMacSuresi > 0) {
        kalanMacSuresi--;
    } else {
        kalanMacSuresi = 300;
        for(let id in aktifOyuncular) {
            aktifOyuncular[id].skor = 0;
            aktifOyuncular[id].can = 100;
            let sp = rastgeleSpawnBul();
            aktifOyuncular[id].x = sp.x;
            aktifOyuncular[id].y = sp.y;
        }
        io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '🏁 Maç süresi bitti! Skorlar sıfırlandı, yeni maç başladı!' });
    }
}, 1000);

function carpismaVarMi(x, y, yaricap) {
    for (let d of DUVARLAR) {
        let closestX = Math.max(d.x, Math.min(x, d.x + d.w));
        let closestY = Math.max(d.y, Math.min(y, d.y + d.h));
        let distX = x - closestX;
        let distY = y - closestY;
        if (Math.sqrt((distX * distX) + (distY * distY)) < yaricap) {
            return true;
        }
    }
    return false;
}

function rastgeleSpawnBul() {
    for (let i = 0; i < 50; i++) {
        let rx = Math.floor(Math.random() * (HARITA_GENISLIK - 200)) + 100;
        let ry = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 200)) + 100;
        if (!carpismaVarMi(rx, ry, 30)) {
            return { x: rx, y: ry };
        }
    }
    return { x: 1000, y: 750 };
}

app.get('/oyun-alani', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Fen Bilimleri Chest Arena</title><style>
            body { background:#0f0f0f; color:#fff; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; }
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

            #adminSifreModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 15, 15, 0.98); border: 3px solid #ff8c00; padding: 25px; border-radius: 15px; z-index: 30000; width: 350px; text-align: center; box-shadow: 0 0 50px rgba(255,140,0,0.5); font-family: monospace; }
            #adminSifreModal h3 { color: #ff8c00; margin-top: 0; }
            #sifreInput { width: 100%; background: #000; border: 2px solid #ff8c00; color: #fff; padding: 10px; font-size: 16px; outline: none; border-radius: 6px; box-sizing: border-box; text-align: center; margin-bottom: 10px; }

            #adminKonsol { display: none; position: fixed; top: 0; left: 0; width: 100%; background: rgba(15, 15, 15, 0.95); border-bottom: 3px solid #ff8c00; padding: 15px 30px; box-sizing: border-box; z-index: 20000; box-shadow: 0 10px 30px rgba(255,140,0,0.3); font-family: monospace; }
            #adminKonsol h3 { margin: 0 0 8px 0; color: #ff8c00; font-size: 15px; letter-spacing: 1px; }
            #adminKonsol p { margin: 0 0 10px 0; color: #aaa; font-size: 12px; }
            #adminInput { width: 100%; background: #000; border: 2px solid #ff8c00; color: #00ffcc; padding: 10px; font-size: 15px; outline: none; border-radius: 6px; box-sizing: border-box; font-family: monospace; }

            #chatContainer { position: fixed; bottom: 20px; left: 20px; width: 350px; z-index: 999; display: flex; flex-direction: column; pointer-events: none; }
            #chatGecmisi { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow: hidden; margin-bottom: 6px; }
            .chat-satir { background: rgba(0, 0, 0, 0.45); color: #fff; padding: 4px 8px; font-size: 13px; border-radius: 3px; width: fit-content; text-shadow: 1px 1px 1px #000; font-family: monospace; }
            #chatInput { display: none; width: 100%; background: rgba(0, 0, 0, 0.85); border: 2px solid #FFD700; color: #fff; padding: 8px; font-size: 14px; outline: none; border-radius: 4px; pointer-events: auto; font-family: monospace; box-sizing: border-box; }

            #killFeed { position: fixed; top: 70px; right: 20px; display: flex; flex-direction: column; gap: 5px; z-index: 999; pointer-events: none; align-items: flex-end; }
            .kill-msg { background: rgba(0, 0, 0, 0.65); border-left: 4px solid #ff4757; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
        </style></head><body>
            <div class="ui">⭐ BİLGİ ÜSSÜ FEN BİLİMLERİ ARENA ⭐</div>
            <div class="bilgi">Hareket: <b>W,A,S,D</b> | Ateş Et: <b>Sol Tık</b> | <a href="/karakter-sec" style="color:#ff4757; text-decoration:none;">Karakter Değiştir</a></div>
            
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

            <div id="adminSifreModal">
                <h3>🔒 YÖNETİCİ ŞİFRESİ GEREKLİ</h3>
                <p style="font-size:12px; color:#aaa;">Hile konsolunu açmak için şifreyi gir:</p>
                <input type="password" id="sifreInput" placeholder="Şifre" autocomplete="off">
                <button class="secenekBtn" onclick="sifreyiKontrolEt()" style="background:#ff8c00; color:#000; font-weight:bold;">Giriş Yap</button>
            </div>

            <div id="adminKonsol">
                <h3>⚡ YÖNETİCİ GİZLİ KOMUT KONSOLU</h3>
                <p>Komutlar: <b>god [saniye]</b> | <b>speed [hız]</b> | <b>invisibility [saniye]</b></p>
                <input type="text" id="adminInput" placeholder="Komut yaz ve Enter'a bas" autocomplete="off">
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

            <canvas id="arena" width="900" height="550"></canvas>
            
            <script src="/socket.io/socket.io.js"></script>
            <script>
                // 1. GÜVENLİK: Sağ Tık ve Geliştirici Araçlarını Engelle
                document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                });

                document.addEventListener('keydown', function(e) {
                    if (e.key === 'F12') {
                        e.preventDefault();
                    }
                    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
                        e.preventDefault();
                    }
                    if (e.ctrlKey && e.key === 'U') {
                        e.preventDefault(); 
                    }

                    // 2. GİZLİ PANEL: Ctrl + Shift + Esc ile Şifre Ekranını Aç
                    if (e.ctrlKey && e.shiftKey && e.code === 'Escape') {
                        e.preventDefault();
                        adminKonsolAcik = false;
                        let konsolEl = document.getElementById('adminKonsol');
                        if (konsolEl) konsolEl.style.display = 'none';

                        sifreModalAcik = true;
                        let modal = document.getElementById('adminSifreModal');
                        if (modal) {
                            modal.style.display = 'block';
                            let sifreInput = document.getElementById('sifreInput');
                            if (sifreInput) {
                                sifreInput.value = '';
                                sifreInput.blur();
                                setTimeout(() => sifreInput.focus(), 50);
                            }
                        }
                    }
                });

                let muzik = window.muzik || new Audio(sessionStorage.getItem('muzikSrc') || 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Beethoven_Moonlight_1st_movement.ogg');
                window.muzik = muzik;
                muzik.loop = true;
                muzik.volume = 0.4;
                
                window.onload = () => {
                    muzik.currentTime = parseFloat(sessionStorage.getItem('muzikTime')) || 0;
                    if(sessionStorage.getItem('muzikPlaying') === 'true') {
                        muzik.play().catch(e => console.log("Oto-oynatma engellendi"));
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
                const benimAvatarim = sessionStorage.getItem('oyuncuAvatar') || '';

                const socket = io({ query: { isim: isim }, forceNew: true });
                socket.on('connect', () => { socket.emit('avatarGuncelle', benimAvatarim); });

                const canvas = document.getElementById('arena');
                const ctx = canvas.getContext('2d');

                let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)}, kalanSure: 300 };
                let loadedImages = {};
                let chestImg = new Image();
                chestImg.src = '/karakterler/Chest.webp';

                let tuslar = {};
                let chatAcik = false;
                let soruAcik = false;
                let adminKonsolAcik = false;
                let sifreModalAcik = false;

                window.addEventListener('keydown', (e) => {
                    if (soruAcik) return;

                    if (e.key.toLowerCase() === 't' && !chatAcik && !adminKonsolAcik && !sifreModalAcik) {
                        e.preventDefault();
                        chatAcik = true;
                        let input = document.getElementById('chatInput');
                        input.style.display = 'block';
                        input.focus();
                    } else if (e.key === 'Escape' && chatAcik) {
                        chatAcik = false;
                        document.getElementById('chatInput').style.display = 'none';
                    }
                    if (!chatAcik && !adminKonsolAcik && !sifreModalAcik) tuslar[e.key.toLowerCase()] = true;
                });

                window.addEventListener('keyup', (e) => { if (!chatAcik && !adminKonsolAcik && !sifreModalAcik) tuslar[e.key.toLowerCase()] = false; });

                function sifreyiKontrolEt() {
                    let girilenSifre = document.getElementById('sifreInput').value;
                    if (girilenSifre === '0707') {
                        sifreModalAcik = false;
                        document.getElementById('adminSifreModal').style.display = 'none';
                        
                        adminKonsolAcik = true;
                        let konsol = document.getElementById('adminKonsol');
                        konsol.style.display = 'block';
                        
                        let adminInput = document.getElementById('adminInput');
                        adminInput.value = '';
                        adminInput.blur();
                        setTimeout(() => adminInput.focus(), 50);
                    } else {
                        alert('Hatalı Yönetici Şifresi!');
                        document.getElementById('sifreInput').value = '';
                    }
                }

                document.getElementById('sifreInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') sifreyiKontrolEt();
                    else if (e.key === 'Escape') { sifreModalAcik = false; document.getElementById('adminSifreModal').style.display = 'none'; }
                });

                document.getElementById('adminInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        let komutMetni = e.target.value.trim();
                        if (komutMetni.length > 0) socket.emit('adminKomut', komutMetni);
                        e.target.value = '';
                        document.getElementById('adminKonsol').style.display = 'none';
                        adminKonsolAcik = false;
                    } else if (e.key === 'Escape') {
                        document.getElementById('adminKonsol').style.display = 'none';
                        adminKonsolAcik = false;
                    }
                });

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
                    if (chatAcik || soruAcik || adminKonsolAcik || sifreModalAcik || e.button !== 0) return; 
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
                    if (chatAcik || soruAcik || adminKonsolAcik || sifreModalAcik) return;
                    let hareket = {x: 0, y: 0};
                    let benimId = socket.id;
                    let ben = oyunVerisi.players[benimId];
                    let hiz = (ben && ben.ozelHiz) ? ben.ozelHiz : 6;

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
                    if (sayacEl) {
                        sayacEl.innerText = (dk < 10 ? '0' + dk : dk) + ':' + (sn < 10 ? '0' + sn : sn);
                    }
                    
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
                        kameraY = Math.max(0, Math.min(ben.y - canvas.height / 2, 1500 - canvas.height));
                    }

                    ctx.save();
                    ctx.translate(-kameraX, -kameraY);

                    // Bölge Renkleri
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

                    // Duvarlar
                    ctx.fillStyle = '#444';
                    for(let d of oyunVerisi.walls) {
                        ctx.fillRect(d.x, d.y, d.w, d.h);
                        ctx.strokeStyle = '#666';
                        ctx.strokeRect(d.x, d.y, d.w, d.h);
                    }

                    // Sandıklar (Chests)
                    for(let c of oyunVerisi.chests) {
                        if(c.aktif) {
                            ctx.drawImage(chestImg, c.x - 20, c.y - 20, 40, 40);
                        }
                    }

                    // Mermiler
                    for(let m of oyunVerisi.bullets) {
                        ctx.fillStyle = '#ff4757';
                        ctx.beginPath();
                        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Oyuncular
                    for(let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        ctx.save();
                        ctx.translate(p.x, p.y);

                        // Can Barı
                        ctx.fillStyle = 'red';
                        ctx.fillRect(-25, -45, 50, 6);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(-25, -45, (p.can / 100) * 50, 6);

                        // Oyuncu İsmi
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, 0, -30);

                        // Karakter Çizimi / Avatar
                        if (p.avatarData) {
                            let img = loadedImages[id];
                            if (!img) {
                                img = new Image();
                                img.src = p.avatarData;
                                loadedImages[id] = img;
                            }
                            if (img.complete) {
                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                                ctx.clip();
                                ctx.drawImage(img, -20, -20, 40, 40);
                                ctx.restore();
                            }
                        } else {
                            ctx.fillStyle = '#FFD700';
                            ctx.beginPath();
                            ctx.arc(0, 0, 20, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 3;
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

// Oyuncu ve Socket Bağlantı Yönetimi (Sunucu Tarafı)
io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = {
        id: socket.id,
        isim: isim,
        x: spawn.x,
        y: spawn.y,
        can: 100,
        skor: 0,
        avatarData: '',
        ozelHiz: 6,
        tanriModu: false,
        gorunmez: false
    };

    socket.on('avatarGuncelle', (avatar) => {
        if(aktifOyuncular[socket.id]) {
            aktifOyuncular[socket.id].avatarData = avatar;
        }
    });

    socket.on('hareketEst', (h) => {
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

    socket.on('adminKomut', (komut) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        let parcalar = komut.split(' ');
        let cmd = parcalar[0];

        if (cmd === 'god') {
            p.tanriModu = true;
            setTimeout(() => { if(aktifOyuncular[socket.id]) aktifOyuncular[socket.id].tanriModu = false; }, (parseInt(parcalar[1]) || 10) * 1000);
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⚡ Tanrı Modu Aktif!' });
        } else if (cmd === 'speed') {
            p.ozelHiz = parseFloat(parcalar[1]) || 12;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⚡ Hız Artırıldı!' });
        }
    });

    socket.on('chatMesaji', (mesaj) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: mesaj });
    });

    socket.on('disconnect', () => {
        delete aktifOyuncular[socket.id];
    });
});

// Oyun Döngüsü (Sunucu Tarafı Güncellemeleri)
setInterval(() => {
    // Mermilerin hareketi ve çarpışma kontrolü
    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.dx;
        m.y += m.dy;
        m.mesafe += 10;

        if (m.mesafe > 600 || carpismaVarMi(m.x, m.y, 5)) {
            mermiler.splice(i, 1);
            continue;
        }

        // Oyuncu vuruş kontrolü
        for (let id in aktifOyuncular) {
            if (id !== m.id) {
                let p = aktifOyuncular[id];
                let uzaklik = Math.sqrt((p.x - m.x) ** 2 + (p.y - m.y) ** 2);
                if (uzaklik < 25) {
                    if (!p.tanriModu) {
                        p.can -= 20;
                    }
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
    console.log(`Sunucu aktif ve çalışıyor: Port ${PORT}`);
});
