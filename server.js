const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 2000;

let aktifOyuncular = {};
let mermiler = [];
let kalanMacSuresi = 300; // 5 Dakika

// --- FEN BİLGİSİ SORU HAVUZU ---
const SORU_HAVUZU = {
    unite1: [
        { soru: "Güneş'in katmanlarından en dışta yer alan ve gözle görülebilen tabaka hangisidir?", secenekler: ["Işık Küre (Fotosfer)", "Taç Küre", "Renksiz Küre", "Çekirdek"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Güneş lekelerinin özelliklerinden biridir?", secenekler: ["Güneş'in en sıcak bölgeleridir.", "Soğuk bölgeler olduğu için koyu görünürler.", "Sürekli aynı yerde kalırlar.", "Büyüklükleri hiç değişmez."], dogru: 1 },
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
        if (mesafeKare < (yaricap * yaricap)) return true;
    }
    return false;
}

function rastgeleSpawnBul() {
    let deneme = 0;
    while (deneme < 50) {
        let x = Math.floor(Math.random() * (HARITA_GENISLIK - 200)) + 100;
        let y = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 200)) + 100;
        if (!carpismaVarMi(x, y, 35)) return { x, y };
        deneme++;
    }
    return { x: 500, y: 500 };
}

// --- HTML VE ARAYÜZ (404 Üreten Harici Dosyalar Kaldırıldı) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Fen Arena</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            body { margin: 0; background: #0f172a; color: #fff; font-family: 'Segoe UI', Tahoma, sans-serif; overflow: hidden; user-select: none; }
            #girisEkrani { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #1e1b4b, #0f172a); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
            .kart { background: rgba(30, 41, 59, 0.9); padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; border: 1px solid rgba(255,255,255,0.1); width: 380px; }
            input, select { width: 100%; padding: 10px; margin: 8px 0; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px; font-size: 15px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 8px; }
            button:hover { background: #4f46e5; }
            .skinSecimAlani { display: flex; justify-content: space-around; margin: 12px 0; }
            .skinKutusu { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .skinKutusu.secili { border-color: #2ed573; transform: scale(1.1); box-shadow: 0 0 10px #2ed573; }
            #oyunKutusu { display: none; width: 100vw; height: 100vh; position: relative; }
            canvas { display: block; background: #1e293b; }
            #arayuzOverlay { position: absolute; top: 20px; left: 20px; pointer-events: none; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            #soruModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 30px; border-radius: 15px; border: 2px solid #6366f1; z-index: 100; width: 450px; text-align: center; }
            .secenekBtn { background: #334155; margin: 8px 0; padding: 12px; width: 100%; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; pointer-events: auto; }
            #adminPaneli { display: none; position: absolute; top: 20px; right: 20px; background: rgba(15, 23, 42, 0.9); border: 2px solid #f43f5e; padding: 15px; border-radius: 10px; z-index: 50; width: 220px; pointer-events: auto; }
            .adminBtn { background: #f43f5e; margin: 4px 0; padding: 8px; font-size: 13px; width: 100%; color: white; border: none; border-radius: 5px; cursor: pointer; }
            #bittiModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 40px; border-radius: 15px; border: 2px solid #2ed573; z-index: 200; width: 400px; text-align: center; }
            #chatKutusu { position: absolute; bottom: 20px; left: 20px; width: 320px; height: 180px; background: rgba(15, 23, 42, 0.75); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; }
            #chatGirdiAlani { flex: 1; overflow-y: auto; padding: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
            #chatInput { width: 100%; border: none; background: rgba(0,0,0,0.4); color: white; padding: 8px; box-sizing: border-box; outline: none; margin: 0; }
        </style>
    </head>
    <body>

        <div id="girisEkrani">
            <div class="kart">
                <h1 style="color: #818cf8; margin-top: 0;">🚀 FEN ARENA</h1>
                <input type="text" id="isimInput" placeholder="Savaşçı İsmini Yaz..." maxlength="15">
                <select id="konuSelect">
                    <option value="unite1">1. Ünite: Güneş, Dünya ve Ay</option>
                </select>
                <div class="skinSecimAlani">
                    <div class="skinKutusu secili" style="background: #3b82f6;" onclick="skinSec('#3b82f6', this)">🔵</div>
                    <div class="skinKutusu" style="background: #10b981;" onclick="skinSec('#10b981', this)">🟢</div>
                    <div class="skinKutusu" style="background: #f59e0b;" onclick="skinSec('#f59e0b', this)">🟠</div>
                </div>
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
                <h4 style="color:#f43f5e; margin:0 0 10px 0;">🛡️ Admin</h4>
                <button class="adminBtn" onclick="adminEmri('fullcan')">❤️ Full Can</button>
                <button class="adminBtn" onclick="adminEmri('puanver')">🏆 +100 Puan</button>
            </div>
            <div id="chatKutusu">
                <div id="chatGirdiAlani"></div>
                <input type="text" id="chatInput" placeholder="Mesaj veya /fenadmin yaz..." onkeypress="chatKontrol(event)">
            </div>
        </div>

        <div id="soruModal">
            <h3 id="soruMetni" style="color: #f8fafc; margin-top: 0;">Soru</h3>
            <div id="seceneklerAlani"></div>
        </div>

        <div id="bittiModal">
            <h2 style="color: #2ed573; margin-top: 0;">🏁 Maç Bitti!</h2>
            <p id="kazananYazisi" style="color: #fff;"></p>
            <button onclick="location.reload()" style="background: #2ed573;">YENİDEN OYNA</button>
        </div>

        <script>
            let socket;
            let canvas = document.getElementById('oyunCanvas');
            let ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            let oyunVerisi = { players: {}, bullets: [], walls: [], chests: [], bolgeler: [] };
            let benimId = null;
            let aktifSoruChestId = null;
            let kameraX = 0, kameraY = 0;
            let secilenSkinRengi = '#3b82f6';
            let adminAktif = false;

            function skinSec(renk, el) {
                secilenSkinRengi = renk;
                document.querySelectorAll('.skinKutusu').forEach(e => e.classList.remove('secili'));
                el.classList.add('secili');
            }

            function oyunaBasla() {
                let isim = document.getElementById('isimInput').value.trim();
                if (!isim) { alert("İsim yazmalısın!"); return; }

                document.getElementById('girisEkrani').style.display = 'none';
                document.getElementById('oyunKutusu').style.display = 'block';

                socket = io({ query: { isim: isim, skin: secilenSkinRengi } });

                socket.on('connect', () => { benimId = socket.id; });
                socket.on('arenaGuncelle', (veri) => {
                    oyunVerisi = veri;
                    if (oyunVerisi.players && oyunVerisi.players[benimId]) {
                        let b = oyunVerisi.players[benimId];
                        document.getElementById('skorYazisi').innerText = b.skor;
                        document.getElementById('canYazisi').innerText = b.can;
                        let dk = Math.floor(oyunVerisi.kalanSure / 60);
                        let sn = oyunVerisi.kalanSure % 60;
                        document.getElementById('sureYazisi').innerText = (dk < 10 ? '0'+dk : dk) + ':' + (sn < 10 ? '0'+sn : sn);
                    }
                });

                socket.on('macBitti', (v) => {
                    document.getElementById('kazananYazisi').innerHTML = 'Kazanan: <b>' + v.kazananIsim + '</b> (' + v.kazananSkor + ' Puan)';
                    document.getElementById('bittiModal').style.display = 'block';
                });

                socket.on('soruGoster', (v) => {
                    aktifSoruChestId = v.chestId;
                    document.getElementById('soruMetni').innerText = v.soruData.soru;
                    let alan = document.getElementById('seceneklerAlani');
                    alan.innerHTML = '';
                    v.soruData.secenekler.forEach((sec, idx) => {
                        let btn = document.createElement('button');
                        btn.className = 'secenekBtn';
                        btn.innerText = sec;
                        btn.onclick = () => {
                            socket.emit('cevapVer', { chestId: aktifSoruChestId, secilenIndex: idx, dogruCevap: v.soruData.dogru });
                            document.getElementById('soruModal').style.display = 'none';
                        };
                        alan.appendChild(btn);
                    });
                    document.getElementById('soruModal').style.display = 'block';
                });

                socket.on('chatMesajiGelsin', (v) => {
                    let alan = document.getElementById('chatGirdiAlani');
                    alan.innerHTML += '<div><b>' + v.isim + ':</b> ' + v.mesaj + '</div>';
                    alan.scrollTop = alan.scrollHeight;
                });

                requestAnimationFrame(oyunDongusu);
            }

            let tuslar = {};
            window.addEventListener('keydown', e => tuslar[e.key.toLowerCase()] = true);
            window.addEventListener('keyup', e => tuslar[e.key.toLowerCase()] = false);

            window.addEventListener('mousedown', e => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('#adminPaneli')) return;
                let hedefX = e.clientX - canvas.width / 2 + oyunVerisi.players[benimId].x;
                let hedefY = e.clientY - canvas.height / 2 + oyunVerisi.players[benimId].y;
                socket.emit('atesEt', { x: hedefX, y: hedefY });
            });

            function chatKontrol(e) {
                if (e.key === 'Enter') {
                    let inp = document.getElementById('chatInput');
                    let val = inp.value.trim();
                    if (val === '/fenadmin') {
                        adminAktif = !adminAktif;
                        document.getElementById('adminPaneli').style.display = adminAktif ? 'block' : 'none';
                    } else if (val) { socket.emit('chatMesaji', val); }
                    inp.value = '';
                }
            }

            function adminEmri(k) { socket.emit('adminKomutu', k); }

            function oyunDongusu() {
                requestAnimationFrame(oyunDongusu);
                let yon = { x: 0, y: 0 };
                let hiz = 4;
                if (tuslar['w']) yon.y -= hiz;
                if (tuslar['s']) yon.y += hiz;
                if (tuslar['a']) yon.x -= hiz;
                if (tuslar['d']) yon.x += hiz;

                if ((yon.x !== 0 || yon.y !== 0) && benimId && oyunVerisi.players[benimId]) {
                    socket.emit('hareketEt', yon);
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (benimId && oyunVerisi.players[benimId]) {
                    kameraX = oyunVerisi.players[benimId].x - canvas.width / 2;
                    kameraY = oyunVerisi.players[benimId].y - canvas.height / 2;
                }

                ctx.save();
                ctx.translate(-kameraX, -kameraY);

                if (oyunVerisi.bolgeler) {
                    oyunVerisi.bolgeler.forEach(b => {
                        ctx.fillStyle = b.renk;
                        ctx.fillRect(b.x, b.y, b.genislik, b.yukseklik);
                    });
                }
                if (oyunVerisi.walls) {
                    oyunVerisi.walls.forEach(d => {
                        ctx.fillStyle = '#334155';
                        ctx.fillRect(d.x, d.y, d.genislik, d.yukseklik);
                    });
                }
                if (oyunVerisi.chests) {
                    oyunVerisi.chests.forEach(c => {
                        if (!c.aktif) return;
                        ctx.fillStyle = '#f59e0b';
                        ctx.fillRect(c.x - 15, c.y - 15, 30, 30);
                        ctx.fillStyle = '#fff';
                        ctx.font = '12px sans-serif';
                        ctx.fillText("🎁 Soru", c.x - 15, c.y - 20);
                    });
                }
                if (oyunVerisi.bullets) {
                    oyunVerisi.bullets.forEach(m => {
                        ctx.beginPath();
                        ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
                        ctx.fillStyle = '#FFD700';
                        ctx.fill();
                    });
                }
                if (oyunVerisi.players) {
                    for (let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        ctx.fillStyle = p.skin || '#3b82f6';
                        ctx.fillRect(p.x - 20, p.y - 20, 40, 40);

                        ctx.fillStyle = '#ff4757';
                        ctx.fillRect(p.x - 20, p.y - 32, 40, 6);
                        ctx.fillStyle = '#2ed573';
                        ctx.fillRect(p.x - 20, p.y - 32, (40 * Math.max(0, p.can)) / 100, 6);

                        ctx.fillStyle = '#fff';
                        ctx.font = '12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, p.x, p.y - 40);
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
    let skin = socket.handshake.query.skin || '#3b82f6';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = { x: spawn.x, y: spawn.y, isim: isim, skin: skin, can: 100, skor: 0 };

    socket.on('hareketEt', (yon) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let yeniX = p.x + yon.x;
        let yeniY = p.y + yon.y;
        if (yeniX > 0 && yeniX < HARITA_GENISLIK && !carpismaVarMi(yeniX, p.y, 20)) p.x = yeniX;
        if (yeniY > 0 && yeniY < HARITA_YUKSEKLIK && !carpismaVarMi(p.x, yeniY, 20)) p.y = yeniY;

        chestler.forEach(c => {
            if (c.aktif && Math.hypot(p.x - c.x, p.y - c.y) < 40) {
                c.aktif = false;
                let havuz = SORU_HAVUZU['unite1'];
                socket.emit('soruGoster', { chestId: c.id, soruData: havuz[Math.floor(Math.random() * havuz.length)] });
                setTimeout(() => { c.aktif = true; }, 15000);
            }
        });
    });

    socket.on('cevapVer', (v) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        if (v.secilenIndex === v.dogruCevap) {
            p.skor += 10;
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⭐ ' + p.isim + ' bildi (+10 Puan)!' });
        } else {
            p.can = Math.max(0, p.can - 15);
            io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '❌ ' + p.isim + ' bilemedi (-15 Can)!' });
        }
    });

    socket.on('atesEt', (hedef) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let aci = Math.atan2(hedef.y - p.y, hedef.x - p.x);
        mermiler.push({ sahip: socket.id, x: p.x, y: p.y, dx: Math.cos(aci) * 10, dy: Math.sin(aci) * 10 });
    });

    socket.on('chatMesaji', (m) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: m.replace(/</g, "&lt;") });
    });

    socket.on('adminKomutu', (k) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        if (k === 'fullcan') p.can = 100;
        if (k === 'puanver') p.skor += 100;
    });

    socket.on('disconnect', () => { delete aktifOyuncular[socket.id]; });
});

setInterval(() => {
    kalanMacSuresi--;
    if (kalanMacSuresi <= 0) {
        let enYuksek = -1, kazanan = "Kimse";
        for (let id in aktifOyuncular) {
            if (aktifOyuncular[id].skor > enYuksek) {
                enYuksek = aktifOyuncular[id].skor;
                kazanan = aktifOyuncular[id].isim;
            }
        }
        io.emit('macBitti', { kazananIsim: kazanan, kazananSkor: enYuksek });
        kalanMacSuresi = 300;
    }

    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.dx; m.y += m.dy;
        if (carpismaVarMi(m.x, m.y, 5) || m.x < 0 || m.x > HARITA_GENISLIK || m.y < 0 || m.y > HARITA_YUKSEKLIK) {
            mermiler.splice(i, 1);
            continue;
        }
        for (let id in aktifOyuncular) {
            if (id === m.sahip) continue;
            let p = aktifOyuncular[id];
            if (Math.hypot(p.x - m.x, p.y - m.y) < 25) {
                p.can -= 20;
                mermiler.splice(i, 1);
                if (p.can <= 0) {
                    p.can = 100;
                    let s = rastgeleSpawnBul();
                    p.x = s.x; p.y = s.y;
                }
                break;
            }
        }
    }

    io.emit('arenaGuncelle', { players: aktifOyuncular, bullets: mermiler, walls: DUVARLAR, chests: chestler, bolgeler: BOLGELER, kalanSure: kalanMacSuresi });
}, 1000 / 30);

server.listen(PORT, () => {
    console.log('Sunucu aktif: ' + PORT);
});
