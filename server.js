const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Sabit Harita Ölçüleri
const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 2000;

// Aktif Oyuncular ve Oyun Verileri
let aktifOyuncular = {};
let mermiler = [];
let avatarOnbellek = {};
let kalanMacSuresi = 300; // 5 Dakika

// --- FEN BİLGİSİ SORU HAVUZU (Ünitelere Göre) ---
const SORU_HAVUZU = {
    unite1: [
        { soru: "Güneş'in katmanlarından en dışta yer alan ve gözle görülebilen tabaka hangisidir?", secenekler: ["Işık Küre (Fotosfer)", "Taç Küre", "Renksiz Küre", "Çekirdek"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Güneş lekelerinin özelliklerinden biridir?", secenekler: ["Güneş'in en sıcak bölgeleridir.", "Soğuk bölgeler olduğu için koyu görünürler.", "Sürekli aynı yerde kalırlar.", "Büyüklükleri hiç değişmez."], dogru: 1 },
        { soru: "Güneş kendi ekseni etrafındaki dönme hareketini hangi yönün tersine yapar?", secenekler: ["Kuzeyden Güneye", "Doğudan Batıya", "Batıdan Doğuya", "Güneyden Kuzeye"], dogru: 2 }
    ],
    unite2: [
        { soru: "Ay'ın ana evreleri arasındaki süre yaklaşık ne kadardır?", secenekler: ["1 Hafta", "15 Gün", "1 Ay (29.5 gün)", "1 Yıl"], dogru: 2 },
        { soru: "Ay'ın Dünya'dan bakıldığında hep aynı yüzünün görülmesinin temel nedeni nedir?", secenekler: ["Kendi etrafında dönmemesi", "Dünya ile aynı hızda dönmesi", "Kendi ekseni etrafındaki dönme süresi ile Dünya etrafındaki dolanma süresinin eşit olması", "Güneş tarafından aydınlatılamaması"], dogru: 2 }
    ],
    unite3: [
        { soru: "Hücrede enerji üretimiyle görevli organel hangisidir?", secenekler: ["Kloroplast", "Mitokondri", "Ribozom", "Golgi Cihazı"], dogru: 1 },
        { soru: "Aşağıdakilerden hangisi bitki hücresinde olup hayvan hücresinde bulunmaz?", secenekler: ["Çekirdek", "Sitoplazma", "Hücre Duvarı (Çeper)", "Mitokondri"], dogru: 2 }
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

// Yardımcı Fonksiyonlar
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

// --- HTML / FRONTEND ARAYÜZÜ ---
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
            .kart { background: rgba(30, 41, 59, 0.85); padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; border: 1px solid rgba(255,255,255,0.1); width: 350px; }
            input, select { width: 100%; padding: 12px; margin: 12px 0; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
            button { width: 100%; padding: 14px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 10px; }
            button:hover { background: #4f46e5; transform: translateY(-2px); }
            #oyunKutusu { display: none; width: 100vw; height: 100vh; position: relative; }
            canvas { display: block; background: #1e293b; }
            #arayuzOverlay { position: absolute; top: 20px; left: 20px; pointer-events: none; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            #soruModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 30px; border-radius: 15px; border: 2px solid #6366f1; z-index: 100; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(99,102,241,0.5); }
            .secenekBtn { background: #334155; margin: 8px 0; padding: 12px; width: 100%; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; transition: 0.2s; pointer-events: auto; }
            .secenekBtn:hover { background: #475569; }
            #chatKutusu { position: absolute; bottom: 20px; left: 20px; width: 320px; height: 180px; background: rgba(15, 23, 42, 0.75); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; }
            #chatGirdiAlani { flex: 1; overflow-y: auto; padding: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
            #chatInput { width: 100%; border: none; background: rgba(0,0,0,0.4); color: white; padding: 8px; box-sizing: border-box; outline: none; }
        </style>
    </head>
    <body>

        <!-- Giriş Ekranı -->
        <div id="girisEkrani">
            <div class="kart">
                <h1 style="color: #818cf8; margin-top: 0;">🚀 FEN ARENA</h1>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Fen Bilimleri Çok Oyunculu Savaş ve Bilgi Arenası</p>
                <input type="text" id="isimInput" placeholder="Savaşçı İsmini Yaz..." maxlength="15">
                <select id="konuSelect">
                    <option value="unite1">1. Ünite: Güneş, Dünya ve Ay</option>
                    <option value="unite2">2. Ünite: Ay'ın Evreleri</option>
                    <option value="unite3">3. Ünite: Hücre ve Organeller</option>
                </select>
                <input type="file" id="avatarInput" accept="image/*">
                <button onclick="oyunaBasla()">ARENAYA GİR</button>
            </div>
        </div>

        <!-- Oyun Ekranı -->
        <div id="oyunKutusu">
            <canvas id="oyunCanvas"></canvas>
            <div id="arayuzOverlay">
                <div>🏆 Skor: <span id="skorYazisi">0</span></div>
                <div>❤️ Can: <span id="canYazisi">100</span></div>
                <div>⏳ Süre: <span id="sureYazisi">05:00</span></div>
            </div>

            <div id="chatKutusu">
                <div id="chatGirdiAlani"></div>
                <input type="text" id="chatInput" placeholder="Mesaj yaz veya /komut gir..." onkeypress="chatKontrol(event)">
            </div>
        </div>

        <!-- Soru Modalı -->
        <div id="soruModal">
            <h3 id="soruMetni" style="color: #f8fafc; margin-top: 0;">Soru Yükleniyor...</h3>
            <div id="seceneklerAlani"></div>
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
            let avatarDataUrl = '';

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

                document.getElementById('girisEkrani').style.display = 'none';
                document.getElementById('oyunKutusu').style.display = 'block';

                socket = io({ query: { isim: isim, konu: konu } });

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
                        document.getElementById('sureYazisi').innerText = \`\${dk < 10 ? '0' + dk : dk}:\${sn < 10 ? '0' + sn : sn}\`;
                    }
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
                    div.innerHTML = \`<b>\${veri.isim}:</b> \${veri.mesaj}\`;
                    alan.appendChild(div);
                    alan.scrollTop = alan.scrollHeight;
                });

                socket.on('olumBildirimi', (mesaj) => {
                    let alan = document.getElementById('chatGirdiAlani');
                    let div = document.createElement('div');
                    div.style.color = '#f43f5e';
                    div.innerHTML = \`<b>BILDIRIM:</b> \${mesaj}\`;
                    alan.appendChild(div);
                    alan.scrollTop = alan.scrollHeight;
                });

                requestAnimationFrame
(oyunDongusu);
            }

            // Klavye ve Fare Kontrolleri
            let tuslar = {};
            window.addEventListener('keydown', (e) => { tuslar[e.key.toLowerCase()] = true; });
            window.addEventListener('keyup', (e) => { tuslar[e.key.toLowerCase()] = false; });

            window.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
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
                    if (metin.startsWith('/')) {
                        let komut = metin.substring(1);
                        if (komut === 'ninjayildiz' || komut === 'fullcan' || komut === 'puanver') {
                            socket.emit('adminKomutu', komut);
                        } else {
                            socket.emit('chatMesaji', 'Bilinmeyen admin komutu!');
                        }
                    } else if (metin.length > 0) {
                        socket.emit('chatMesaji', metin);
                    }
                    input.value = '';
                }
            }

            // --- CANVAS ÇİZİM DÖNGÜSÜ ---
            function oyunDongusu() {
                requestAnimationFrame(oyunDongusu);

                // Hareket Gönderimi
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

                // Bölgeleri Çiz
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

                // Duvarları Çiz
                if (oyunVerisi.walls) {
                    for (let d of oyunVerisi.walls) {
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(d.x, d.y, d.genislik, d.yukseklik);
                        ctx.strokeStyle = '#475569';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(d.x, d.y, d.genislik, d.yukseklik);
                    }
                }

                // Sandıkları Çiz
                if (oyunVerisi.chests) {
                    for (let c of oyunVerisi.chests) {
                        if (!c.aktif) continue;
                        ctx.fillStyle = '#f59e0b';
                        ctx.fillRect(c.x - 15, c.y - 15, 30, 30);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(c.x - 15, c.y - 15, 30, 30);
                        ctx.fillStyle = '#fff';
                        ctx.font = '12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText("🎁 Soru", c.x, c.y - 20);
                    }
                }

                // Mermiler ve Ninja Yıldızları Çizimi
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

                // Oyuncuları Çizme
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
                            ctx.fillStyle = '#333';
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

// --- SOCKET.IO OYUN MANTIĞI VE SUNUCU LOOP ---
io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let konu = socket.handshake.query.konu || 'unite1';

    let spawn = rastgeleSpawnBul();
    aktifOyuncular[socket.id] = {
        x: spawn.x,
        y: spawn.y,
        isim: isim,
        konu: konu,
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
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `⭐ ${p.isim} sandıktaki Fen sorusunu bildi ve 10 puan kazandı!` });
        } else {
            p.can = Math.max(0, p.can - 15);
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `❌ ${p.isim} soruyu yanlış bildi ve 15 canı kaybetti!` });
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

// --- ANA OYUN GÜNCELLEME DÖNGÜSÜ (SERVER TICK) ---
setInterval(() => {
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
                        io.emit('olumBildirimi', `⚔️ ${vuran.isim}, ${p.isim}'i hakladı! (+50 Puan)`);
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
    console.log(`🚀 Fen Arena sunucusu ${PORT} portunda başarıyla çalışıyor!`);
});
