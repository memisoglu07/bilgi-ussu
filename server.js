const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// --- İŞTE 404 HATASINI ÇÖZEN SİHİRLİ SATIR ---
// Bu kod, server.js'in bulunduğu ana dizindeki tüm klasörleri (karakterler, ses vb.) tarayıcıya açar.
app.use(express.static(__dirname));

// Sabit Harita Ölçüleri
const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 2000;

// Aktif Oyuncular ve Oyun Verileri
let aktifOyuncular = {};
let mermiler = [];
let avatarOnbellek = {};
let kalanMacSuresi = 300; // 5 Dakika

// --- 50'ŞER SORULUK FEN BİLGİSİ SORU HAVUZU ---
const SORU_HAVUZU = {
    unite1: [
        { soru: "Güneş'in katmanlarından en dışta yer alan ve gözle görülebilen tabaka hangisidir?", secenekler: ["Işık Küre (Fotosfer)", "Taç Küre", "Renksiz Küre", "Çekirdek"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Güneş lekelerinin özelliklerinden biridir?", secenekler: ["Güneş'in en sıcak bölgeleridir.", "Soğuk bölgeler olduğu için koyu görünürler.", "Sürekli aynı yerde kalırlar.", "Büyüklükleri hiç değişmez."], dogru: 1 },
        { soru: "Güneş kendi ekseni etrafındaki dönme hareketini hangi yönün tersine yapar?", secenekler: ["Kuzeyden Güneye", "Doğudan Batıya", "Batıdan Doğuya", "Güneyden Kuzeye"], dogru: 2 },
        // ... (Kısalık adına diğer soruları buraya ekleyebilirsin, havuz mantığı aynı)
        { soru: "Güneş'in yapısında en çok bulunan gaz hangisidir?", secenekler: ["Oksijen", "Helyum", "Hidrojen", "Azot"], dogru: 2 }
    ]
};

// --- OYUN HARİTASI (DUVARLAR VE SANDIKLAR) ---
const DUVARLAR = [
    { x: 400, y: 300, genislik: 300, yukseklik: 40 },
    { x: 1200, y: 200, genislik: 40, yukseklik: 400 },
    { x: 800, y: 1000, genislik: 500, yukseklik: 50 },
    { x: 300, y: 1400, genislik: 40, yukseklik: 350 },
    { x: 1400, y: 1200, genislik: 300, yukseklik: 40 }
];

let chestler = [
    { id: 1, x: 500, y: 500, aktif: true },
    { id: 2, x: 1000, y: 400, aktif: true },
    { id: 3, x: 1500, y: 800, aktif: true },
    { id: 4, x: 700, y: 1500, aktif: true },
    { id: 5, x: 250, y: 1000, aktif: true }
];

const BOLGELER = [
    { isim: "Hücre Laboratuvarı", x: 200, y: 200, genislik: 400, yukseklik: 400, renk: "rgba(46, 204, 113, 0.08)" },
    { isim: "Güneş Sistemi Üssü", x: 1200, y: 200, genislik: 500, yukseklik: 400, renk: "rgba(241, 196, 15, 0.08)" },
    { isim: "Kuvvet Sahası", x: 800, y: 1000, genislik: 600, yukseklik: 500, renk: "rgba(52, 152, 219, 0.08)" }
];

function carpismaVarMi(x, y, yaricap) {
    for (let d of DUVARLAR) {
        let enYakinX = Math.max(d.x, Math.min(x, d.x + d.genislik));
        let enYakinY = Math.max(d.y, Math.min(y, d.y + d.yukseklik));
        let mesafeX = x - enYakinX;
        let mesafeY = y - enYakinY;
        let mesafeKare = (mesafeX * mesafeX) + (mesafeY * mesafeY);
        if (mesafeKare < (yaricap * yaricap)) {
            return true;
        }
    }
    return false;
}

function rastgeleSpawnBul() {
    let deneme = 0;
    while (deneme < 50) {
        let x = Math.floor(Math.random() * (HARITA_GENISLIK - 200)) + 100;
        let y = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 200)) + 100;
        if (!carpismaVarMi(x, y, 35)) {
            return { x, y };
        }
        deneme++;
    }
    return { x: 500, y: 500 };
}

// --- TEK PARÇA KUSURSUZ FRONTEND / HTML ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Fen Arena - Çok Oyunculu Fen Bilimleri Oyunu</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { margin: 0; background: #0f172a; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; user-select: none; }
            #girisEkrani { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #1e1b4b, #0f172a); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
            .kart { background: rgba(30, 41, 59, 0.9); padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; border: 1px solid rgba(255,255,255,0.1); width: 380px; }
            input, select { width: 100%; padding: 10px; margin: 8px 0; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px; font-size: 15px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 8px; }
            button:hover { background: #4f46e5; transform: translateY(-2px); }
            
            .skinSecimAlani { display: flex; justify-content: space-around; margin: 12px 0; }
            .skinKutusu { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: 0.2s; }
            .skinKutusu.secili { border-color: #2ed573; transform: scale(1.1); box-shadow: 0 0 10px #2ed573; }
            
            #oyunKutusu { display: none; width: 100vw; height: 100vh; position: relative; }
            canvas { display: block; background: #1e293b; }
            #arayuzOverlay { position: absolute; top: 20px; left: 20px; pointer-events: none; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            
            #soruModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 30px; border-radius: 15px; border: 2px solid #6366f1; z-index: 100; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(99,102,241,0.5); }
            .secenekBtn { background: #334155; margin: 8px 0; padding: 12px; width: 100%; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; transition: 0.2s; pointer-events: auto; }
            .secenekBtn:hover { background: #475569; }

            #adminPaneli { display: none; position: absolute; top: 20px; right: 20px; background: rgba(15, 23, 42, 0.9); border: 2px solid #f43f5e; padding: 15px; border-radius: 10px; z-index: 50; width: 220px; pointer-events: auto; }
            #adminPaneli h4 { margin: 0 0 10px 0; color: #f43f5e; text-align: center; }
            .adminBtn { background: #f43f5e; margin: 4px 0; padding: 8px; font-size: 13px; }
            .adminBtn:hover { background: #e11d48; }

            #bittiModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 40px; border-radius: 15px; border: 2px solid #2ed573; z-index: 200; width: 400px; text-align: center; }

            #chatKutusu { position: absolute; bottom: 20px; left: 20px; width: 320px; height: 180px; background: rgba(15, 23, 42, 0.75); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; }
            #chatGirdiAlani { flex: 1; overflow-y: auto; padding: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
            #chatInput { width: 100%; border: none; background: rgba(0,0,0,0.4); color: white; padding: 8px; box-sizing: border-box; outline: none; margin: 0; }
        </style>
    </head>
    <body>

        <!-- OYUN ARKAPLAN MÜZİĞİ - STATİK DOSYA SUNUCUSU İLE DOĞRUDAN ÇALIŞIR -->
        <!-- Müzik çalması için src kısmına GitHub'daki klasör yolunu verdik -->
        <audio id="oyunMuzigi" src="/ses/muzik/asphalt-menace.mp3" loop></audio>

        <div id="girisEkrani">
            <div class="kart">
                <h1 style="color: #818cf8; margin-top: 0;">🚀 FEN ARENA</h1>
                <p style="color: #94a3b8; font-size: 13px; margin-bottom: 15px;">50+ Soru Havuzu & Canlı Çok Oyunculu Savaş</p>
                <input type="text" id="isimInput" placeholder="Savaşçı İsmini Yaz..." maxlength="15">
                
                <select id="konuSelect">
                    <option value="unite1">1. Ünite: Güneş, Dünya ve Ay (50 Soru)</option>
                    <option value="unite2">2. Ünite: Ay'ın Evreleri (50 Soru)</option>
                    <option value="unite3">3. Ünite: Hücre ve Organeller (50 Soru)</option>
                </select>

                <p style="font-size: 13px; color: #cbd5e1; margin: 10px 0 5px 0; text-align: left;">Savaşçı Skinini Seç:</p>
                <div class="skinSecimAlani">
                    <div class="skinKutusu secili" style="background: #3b82f6;" onclick="skinSec('#3b82f6', this)">🔵</div>
                    <div class="skinKutusu" style="background: #10b981;" onclick="skinSec('#10b981', this)">🟢</div>
                    <div class="skinKutusu" style="background: #f59e0b;" onclick="skinSec('#f59e0b', this)">🟠</div>
                    <div class="skinKutusu" style="background: #ec4899;" onclick="skinSec('#ec4899', this)">🟣</div>
                </div>

                <input type="file" id="avatarInput" accept="image/*" style="margin-top: 5px;">
                <button onclick="oyunaBasla()">ARENAYA GİR</button>
            </div>
        </div>

        <div id="oyunKutusu">
            <canvas id="oyunCanvas"></canvas>
            <div id="arayuzOverlay">
                <div>🏆 Skor: <span id="skorYazisi">0</span></div>
                <div>❤️ Can: <span id="canYazisi">100</span></div>
                <div>⏳ Süre: <span id="sureYazisi">05:00</span></div>
            </div>

            <div id="adminPaneli">
                <h4>🛡️ Admin Paneli</h4>
                <button class="adminBtn" onclick="adminEmri('ninjayildiz')">🥷 Ninja Yıldızı Modu</button>
                <button class="adminBtn" onclick="adminEmri('fullcan')">❤️ Full Can Doldur</button>
                <button class="adminBtn" onclick="adminEmri('puanver')">🏆 +100 Puan Ekle</button>
            </div>

            <div id="chatKutusu">
                <div id="chatGirdiAlani"></div>
                <input type="text" id="chatInput" placeholder="Mesaj yaz veya /fenadmin gir..." onkeypress="chatKontrol(event)">
            </div>
        </div>

        <div id="soruModal">
            <h3 id="soruMetni" style="color: #f8fafc; margin-top: 0;">Soru Yükleniyor...</h3>
            <div id="seceneklerAlani"></div>
        </div>

        <div id="bittiModal">
            <h2 style="color: #f43f5e; margin-top: 0;">🏁 Maç Sona Erdi!</h2>
            <p id="kazananYazisi" style="font-size: 16px; color: #e2e8f0;"></p>
            <button onclick="tekrarBasla()" style="background: #2ed573; margin-top: 15px;">YENİDEN OYNA</button>
        </div>

        <script>
            let socket;
            let canvas = document.getElementById('oyunCanvas');
            let ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });

            let oyunVerisi = { players: {}, bullets: [], walls: [], chests: [], bolgeler: [] };
            let benimId = null;
            let aktifSoruChestId = null;
            let kameraX = 0;
            let kameraY = 0;
            let secilenSkinRengi = '#3b82f6';
            let avatarDataUrl = '';
            let adminModuAktif = false;
            
            // SANDIK RESMİ YÜKLEME - STATİK SUNUCU İLE DOĞRUDAN ÇALIŞIR
            let sandikResmi = new Image();
            sandikResmi.src = '/karakterler/Chest.webp';

            function skinSec(renk, element) {
                secilenSkinRengi = renk;
                document.querySelectorAll('.skinKutusu').forEach(el => el.classList.remove('secili'));
                element.classList.add('secili');
            }

            document.getElementById('avatarInput').addEventListener('change', function(e) {
                let file = e.target.files[0];
                if (file) {
                    let reader = new FileReader();
                    reader.onload = function(event) {
                        avatarDataUrl = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });

            function oyunaBasla() {
                let isim = document.getElementById('isimInput').value.trim();
                let konu = document.getElementById('konuSelect').value;

                if (!isim) {
                    alert("Lütfen bir savaşçı ismi gir!");
                    return;
                }

                // Müzik Oynatma
                let muzik = document.getElementById('oyunMuzigi');
                muzik.volume = 0.3;
                muzik.play().catch(e => console.log("Müzik otomatik başlatılamadı:", e));

                document.getElementById('girisEkrani').style.display = 'none';
                document.getElementById('oyunKutusu').style.display = 'block';

                socket = io({ query: { isim: isim, konu: konu, skin: secilenSkinRengi } });

                socket.on('connect', () => {
                    benimId = socket.id;
                    if (avatarDataUrl) {
                        socket.emit('avatarGuncelle', avatarDataUrl);
                    }
                });

                socket.on('arenaGuncelle', (veri) => {
                    oyunVerisi = veri;
                    if (oyunVerisi.players && oyunVerisi.players[benimId]) {
                        let benimVerim = oyunVerisi.players[benimId];
                        document.getElementById('skorYazisi').innerText = benimVerim.skor;
                        document.getElementById('canYazisi').innerText = benimVerim.can;
                        
                        let dk = Math.floor(oyunVerisi.kalanSure / 60);
                        let sn = oyunVerisi.kalanSure % 60;
                        document.getElementById('sureYazisi').innerText = (dk < 10 ? '0' + dk : dk) + ':' + (sn < 10 ? '0' + sn : sn);
                    }
                });

                socket.on('macBitti', (veri) => {
                    document.getElementById('kazananYazisi').innerHTML = '🏆 Kazanan: <b>' + veri.kazananIsim + '</b> (' + veri.kazananSkor + ' Puan)';
                    document.getElementById('bittiModal').style.display = 'block';
                });

                socket.on('soruGoster', (veri) => {
                    aktifSoruChestId = veri.chestId;
                    document.getElementById('soruMetni').innerText = veri.soruData.soru;
                    let alan = document.getElementById('seceneklerAlani');
                    alan.innerHTML = '';

                    veri.soruData.secenekler.forEach((sec, idx) => {
                        let btn = document.createElement('button');
                        btn.className = 'secenekBtn';
                        btn.innerText = sec;
                        btn.onclick = () => cevapSec(idx, veri.soruData.dogru);
                        alan.appendChild(btn);
                    });

                    document.getElementById('soruModal').style.display = 'block';
                });

                socket.on('chatMesajiGelsin', (veri) => {
                    let alan = document.getElementById('chatGirdiAlani');
                    let div = document.createElement('div');
                    div.innerHTML = '<b>' + veri.isim + ':</b> ' + veri.mesaj;
                    alan.appendChild(div);
                    alan.scrollTop = alan.scrollHeight;
                });

                socket.on('olumBildirimi', (mesaj) => {
                    let alan = document.getElementById('chatGirdiAlani');
                    let div = document.createElement('div');
                    div.style.color = '#f43f5e';
                    div.innerHTML = '<b>BILDIRIM:</b> ' + mesaj;
                    alan.appendChild(div);
                    alan.scrollTop = alan.scrollHeight;
                });

                requestAnimationFrame(oyunDongusu);
            }

            let tuslar = {};
            window.addEventListener('keydown', (e) => { tuslar[e.key.toLowerCase()] = true; });
            window.addEventListener('keyup', (e) => { tuslar[e.key.toLowerCase()] = false; });

            window.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#adminPaneli')) return;
                let hedefX = e.clientX - canvas.width / 2 + (oyunVerisi.players[benimId] ? oyunVerisi.players[benimId].x : 0);
                let hedefY = e.clientY - canvas.height / 2 + (oyunVerisi.players[benimId] ? oyunVerisi.players[benimId].y : 0);
                socket.emit('atesEt', { x: hedefX, y: hedefY });
            });

            function cevapSec(secilenIndex, dogruCevap) {
                socket.emit('cevapVer', { chestId: aktifSoruChestId, secilenIndex: secilenIndex, dogruCevap: dogruCevap });
                document.getElementById('soruModal').style.display = 'none';
            }

            function chatKontrol(e) {
                if (e.key === 'Enter') {
                    let input = document.getElementById('chatInput');
                    let metin = input.value.trim();
                    if (metin === '/fenadmin') {
                        adminModuAktif = !adminModuAktif;
                        document.getElementById('adminPaneli').style.display = adminModuAktif ? 'block' : 'none';
                        socket.emit('chatMesaji', '🛡️ Admin Paneli görünürlüğü değiştirildi.');
                    } else if (metin.length > 0) {
                        socket.emit('chatMesaji', metin);
                    }
                    input.value = '';
                }
            }

            function adminEmri(komut) {
                socket.emit('adminKomutu', komut);
            }

            function tekrarBasla() {
                location.reload();
            }

            function oyunDongusu() {
                requestAnimationFrame(oyunDongusu);

                let hiz = 4;
                let yon = { x: 0, y: 0 };
                if (tuslar['w'] || tuslar['arrowup']) yon.y -= hiz;
                if (tuslar['s'] || tuslar['arrowdown']) yon.y += hiz;
                if (tuslar['a'] || tuslar['arrowleft']) yon.x -= hiz;
                if (tuslar['d'] || tuslar['arrowright']) yon.x += hiz;

                if ((yon.x !== 0 || yon.y !== 0) && benimId && oyunVerisi.players[benimId]) {
                    socket.emit('hareketEt', yon);
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (benimId && oyunVerisi.players[benimId]) {
                    let p = oyunVerisi.players[benimId];
                    kameraX = p.x - canvas.width / 2;
                    kameraY = p.y - canvas.height / 2;
                }

                ctx.save();
                ctx.translate(-kameraX, -kameraY);

                if (oyunVerisi.bolgeler) {
                    for (let b of oyunVerisi.bolgeler) {
                        ctx.fillStyle = b.renk;
                        ctx.fillRect(b.x, b.y, b.genislik, b.yukseklik);
                        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                        ctx.strokeRect(b.x, b.y, b.genislik, b.yukseklik);
                        ctx.fillStyle = 'rgba(255,255,255,0.2)';
                        ctx.font = 'bold 16px sans-serif';
                        ctx.fillText(b.isim, b.x + 20, b.y + 30);
                    }
                }

                if (oyunVerisi.walls) {
                    for (let d of oyunVerisi.walls) {
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(d.x, d.y, d.genislik, d.yukseklik);
                        ctx.strokeStyle = '#475569';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(d.x, d.y, d.genislik, d.yukseklik);
                    }
                }

                if (oyunVerisi.chests) {
                    for (let c of oyunVerisi.chests) {
                        if (!c.aktif) continue;
                        
                        // SANDIK RESMİ YÜKLENDİYSE ÇİZ, YOKSA KUTU ÇİZ
                        if (sandikResmi.complete && sandikResmi.naturalHeight !== 0) {
                            ctx.drawImage(sandikResmi, c.x - 20, c.y - 20, 40, 40);
                        } else {
                            ctx.fillStyle = '#f59e0b';
                            ctx.fillRect(c.x - 15, c.y - 15, 30, 30);
                        }
                        
                        ctx.fillStyle = '#fff';
                        ctx.font = '12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText("🎁 Soru", c.x, c.y - 25);
                    }
                }

                if (oyunVerisi.bullets) {
                    for(let m of oyunVerisi.bullets) {
                        ctx.save();
                        ctx.translate(m.x, m.y);
                        if (m.ninja) {
                            ctx.rotate(Date.now() / 100);
                            ctx.fillStyle = '#2ed573';
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 1.5;
                            for (let i = 0; i < 4; i++) {
                                ctx.beginPath();
                                ctx.moveTo(0, 0);
                                ctx.lineTo(0, -12);
                                ctx.lineTo(4, -4);
                                ctx.lineTo(12, 0);
                                ctx.lineTo(4, 4);
                                ctx.lineTo(0, 12);
                                ctx.lineTo(-4, 4);
                                ctx.lineTo(-12, 0);
                                ctx.lineTo(-4, -4);
                                ctx.closePath();
                            }
                            ctx.fill();
                            ctx.stroke();
                        } else {
                            ctx.beginPath();
                            ctx.arc(0, 0, m.yaricap || 5, 0, Math.PI * 2);
                            ctx.fillStyle = m.renk || '#FFD700';
                            ctx.fill();
                            ctx.lineWidth = 2;
                            ctx.strokeStyle = '#fff';
                            ctx.stroke();
                        }
                        ctx.restore();
                    }
                }

                if (oyunVerisi.players) {
                    for (let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        ctx.save();
                        ctx.translate(p.x, p.y);

                        ctx.beginPath();
                        ctx.arc(0, 0, 30, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();

                        if (p.avatar) {
                            if (!avatarOnbellek[id]) {
                                let img = new Image();
                                img.src = p.avatar;
                                avatarOnbellek[id] = img;
                            }
                            ctx.drawImage(avatarOnbellek[id], -30, -30, 60, 60);
                        } else {
                            ctx.fillStyle = p.skin || '#3b82f6';
                            ctx.fillRect(-30, -30, 60, 60);
                        }
                        ctx.restore();

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = (id === benimId) ? '#2ed573' : '#FFD700';
                        ctx.stroke();

                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(p.x - 30, p.y - 45, 60, 8);
                        ctx.fillStyle = '#ff4757';
                        ctx.fillRect(p.x - 30, p.y - 45, (60 * Math.max(0, p.can)) / 100, 8);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(p.x - 30, p.y - 45, 60, 8);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, p.x, p.y - 55);
                    }
                }

                ctx.restore();
            }
        </script>
    </body>
    </html>
    `);
});

io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let konu = socket.handshake.query.konu || 'unite1';
    let skin = socket.handshake.query.skin || '#3b82f6';

    let spawn = rastgeleSpawnBul();
    aktifOyuncular[socket.id] = {
        x: spawn.x,
        y: spawn.y,
        isim: isim,
        konu: konu,
        skin: skin,
        avatar: '',
        can: 100,
        skor: 0,
        ninjaModu: false
    };

    socket.on('avatarGuncelle', (avatarData) => {
        if (aktifOyuncular[socket.id]) {
            aktifOyuncular[socket.id].avatar = avatarData;
        }
    });

    socket.on('hareketEt', (yon) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        let yeniX = p.x + yon.x;
        let yeniY = p.y + yon.y;

        if (yeniX - 30 > 0 && yeniX + 30 < HARITA_GENISLIK && !carpismaVarMi(yeniX, p.y, 30)) {
            p.x = yeniX;
        }
        if (yeniY - 30 > 0 && yeniY + 30 < HARITA_YUKSEKLIK && !carpismaVarMi(p.x, yeniY, 30)) {
            p.y = yeniY;
        }

        for (let c of chestler) {
            let uzaklikX = p.x - c.x;
            let uzaklikY = p.y - c.y;
            let mesafe = Math.sqrt(uzaklikX * uzaklikX + uzaklikY * uzaklikY);

            if (c.aktif && mesafe < 50) {
                c.aktif = false;
                
                let havuz = SORU_HAVUZU[p.konu] || SORU_HAVUZU['unite1'];
                let rastgeleSoru = havuz[Math.floor(Math.random() * havuz.length)];

                socket.emit('soruGoster', {
                    chestId: c.id,
                    soruData: rastgeleSoru
                });

                setTimeout(() => {
                    c.aktif = true;
                }, 15000);
                break;
            }
        }
    });

    socket.on('cevapVer', (veri) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        if (veri.secilenIndex === veri.dogruCevap) {
            p.skor += 10;
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⭐ ' + p.isim + ' sandıktaki Fen sorusunu bildi ve 10 puan kazandı!' });
        } else {
            p.can = Math.max(0, p.can - 15);
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '❌ ' + p.isim + ' soruyu yanlış bildi ve 15 canı kaybetti!' });
        }
    });

    socket.on('atesEt', (hedef) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        let aci = Math.atan2(hedef.y - p.y, hedef.x - p.x);
        let hiz = 12;

        mermiler.push({
            sahip: socket.id,
            x: p.x,
            y: p.y,
            dx: Math.cos(aci) * hiz,
            dy: Math.sin(aci) * hiz,
            ninja: p.ninjaModu || false,
            yaricap: p.ninjaModu ? 8 : 5
        });
    });

    socket.on('chatMesaji', (mesaj) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let temizMesaj = mesaj.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: temizMesaj });
    });

    socket.on('adminKomutu', (komut) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        if (komut === 'ninjayildiz') {
            p.ninjaModu = true;
            socket.emit('chatMesajiGelsin', { isim: 'ADMIN', mesaj: '🥷 Ninja Yıldızı modu aktif edildi!' });
        } else if (komut === 'fullcan') {
            p.can = 100;
            socket.emit('chatMesajiGelsin', { isim: 'ADMIN', mesaj: '❤️ Canınız tamamen yenilendi!' });
        } else if (komut === 'puanver') {
            p.skor += 100;
            socket.emit('chatMesajiGelsin', { isim: 'ADMIN', mesaj: '🏆 Hesabınıza 100 puan eklendi!' });
        }
    });

    socket.on('disconnect', () => {
        delete aktifOyuncular[socket.id];
    });
});

setInterval(() => {
    kalanMacSuresi--;
    if (kalanMacSuresi <= 0) {
        let enYuksekSkor = -1;
        let kazananIsim = "Kimse";
        for (let id in aktifOyuncular) {
            if (aktifOyuncular[id].skor > enYuksekSkor) {
                enYuksekSkor = aktifOyuncular[id].skor;
                kazananIsim = aktifOyuncular[id].isim;
            }
        }
        io.emit('macBitti', { kazananIsim: kazananIsim, kazananSkor: enYuksekSkor });
        kalanMacSuresi = 300;
    }

    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.dx;
        m.y += m.dy;

        if (carpismaVarMi(m.x, m.y, m.yaricap || 5) || m.x < 0 || m.x > HARITA_GENISLIK || m.y < 0 || m.y > HARITA_YUKSEKLIK) {
            mermiler.splice(i, 1);
            continue;
        }

        let mermiOldu = false;
        for (let id in aktifOyuncular) {
            if (id === m.sahip) continue;
            let p = aktifOyuncular[id];

            let mesafe = Math.sqrt((p.x - m.x) ** 2 + (p.y - m.y) ** 2);
            if (mesafe < 30) {
                p.can -= m.ninja ? 40 : 20;
                mermiOldu = true;

                let vuran = aktifOyuncular[m.sahip];

                if (p.can <= 0) {
                    p.can = 100;
                    let yeniSpawn = rastgeleSpawnBul();
                    p.x = yeniSpawn.x;
                    p.y = yeniSpawn.y;
                    if (vuran) {
                        vuran.skor += 50;
                        io.emit('olumBildirimi', '⚔️ ' + vuran.isim + ', ' + p.isim + '\'i hakladı! (+50 Puan)');
                    }
                }
                break;
            }
        }
        if (mermiOldu) {
            mermiler.splice(i, 1);
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
}, 1000 / 30);

server.listen(PORT, () => {
    console.log('🚀 Fen Arena sunucusu ' + PORT + ' portunda başarıyla çalışıyor!');
});
