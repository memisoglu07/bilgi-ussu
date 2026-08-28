const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(__dirname));

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
    { soru: "Güneş tutulması olayı Ay'ın hangi evresinde gerçekleşir?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Son Dördün"], cevap: 0 }
];

const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 1500;

const BOLGELER = [
    { isim: "TURUNCU BÖLGE", x: 0, y: 0, w: 1000, h: 750, renk: "rgba(255, 140, 0, 0.08)" },
    { isim: "SİYAH BÖLGE", x: 1000, y: 0, w: 1000, h: 750, renk: "rgba(30, 30, 30, 0.15)" },
    { isim: "MAVİ BÖLGE", x: 0, y: 750, w: 1000, h: 750, renk: "rgba(0, 150, 255, 0.08)" },
    { isim: "YEŞİL BÖLGE", x: 1000, y: 750, w: 1000, h: 750, renk: "rgba(0, 255, 100, 0.08)" }
];

const DUVARLAR = [
    { x: 0, y: 0, w: 2000, h: 40 },
    { x: 0, y: 1460, w: 2000, h: 40 },
    { x: 0, y: 0, w: 40, h: 1500 },
    { x: 1960, y: 0, w: 40, h: 1500 },
    { x: 300, y: 300, w: 150, h: 150 },
    { x: 1550, y: 300, w: 150, h: 150 },
    { x: 300, y: 1050, w: 150, h: 150 },
    { x: 1550, y: 1050, w: 150, h: 150 }
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
const NEON_RENKLER = ['#00ffcc', '#ff00ff', '#00ffff', '#ff5050', '#ffff00', '#ff9900'];

function carpismaVarMi(x, y, yaricap) {
    for (let d of DUVARLAR) {
        let closestX = Math.max(d.x, Math.min(x, d.x + d.w));
        let closestY = Math.max(d.y, Math.min(y, d.y + d.h));
        if (Math.hypot(x - closestX, y - closestY) < yaricap) return true;
    }
    return false;
}

function rastgeleSpawnBul() {
    for (let i = 0; i < 30; i++) {
        let rx = Math.floor(Math.random() * (HARITA_GENISLIK - 200)) + 100;
        let ry = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 200)) + 100;
        if (!carpismaVarMi(rx, ry, 30)) return { x: rx, y: ry };
    }
    return { x: 1000, y: 750 };
}

// TEK SAYFA YAPISI (KARAKTER SEÇİMİ VE OYUN BİR ARADA - SİYAH EKRAN HATASINI ÇÖZER)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Bilgi Üssü Arena</title><style>
            body { background:#0a0a0a; color:#FFD700; font-family:'Segoe UI', sans-serif; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; overflow:hidden; }
            #girisEkrani { background:linear-gradient(145deg, #1e1e1e, #000); padding:30px; border-radius:20px; border:2px solid #FFD700; width:360px; text-align:center; box-shadow:0 0 30px rgba(255,215,0,0.2); }
            input[type="text"] { width: 100%; padding: 12px; margin: 15px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; box-sizing: border-box; text-align: center; font-size: 16px; outline: none; }
            .btn { display:block; padding:12px; border-radius:10px; background:#FFD700; color:#000; font-weight:bold; cursor:pointer; border:none; width:100%; font-size:16px; transition:0.2s; }
            .btn:hover { background:#ffc107; transform:scale(1.02); }
            
            #oyunAlani { display:none; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100vh; }
            canvas { background:#181818; border:4px solid #FFD700; box-shadow:0 0 30px rgba(255,215,0,0.4); cursor: crosshair; }
            .ui { margin-bottom:6px; font-size:16px; color:#FFD700; font-weight:bold; }
            
            #soruModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(20, 20, 20, 0.95); border: 3px solid #FFD700; padding: 25px; border-radius: 15px; z-index: 10000; width: 400px; text-align: center; }
            .secenekBtn { display: block; width: 100%; padding: 10px; margin: 8px 0; background: #333; color: #fff; border: 1px solid #FFD700; border-radius: 8px; cursor: pointer; font-size: 14px; }
            .secenekBtn:hover { background: #FFD700; color: #000; font-weight: bold; }
        </style></head><body>

            <div id="girisEkrani">
                <h2>BİLGİ ÜSSÜ</h2>
                <p style="font-size:13px; color:#aaa;">Fen Bilimleri Chest Arenası</p>
                <input type="text" id="oyuncuAdi" placeholder="Oyuncu Adın" maxlength="12" value="Savaşçı">
                <button class="btn" onclick="oyunuBaslat()">Savaş Alanına Gir!</button>
            </div>

            <div id="oyunAlani">
                <div class="ui">⭐ BİLGİ ÜSSÜ FEN ARENA ⭐</div>
                <div style="font-size:12px; color:#aaa; margin-bottom:6px;">W,A,S,D ile hareket et | Sol tık ile ateş et</div>
                <canvas id="arena" width="900" height="520"></canvas>
            </div>

            <div id="soruModal">
                <div id="soruBaslik" style="color:#FFD700; font-weight:bold; margin-bottom:12px; font-size:15px;">Soru</div>
                <div id="seceneklerDiv"></div>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                let socket;
                function oyunuBaslat() {
                    let isim = document.getElementById('oyuncuAdi').value.trim() || 'Savaşçı';
                    document.getElementById('girisEkrani').style.display = 'none';
                    document.getElementById('oyunAlani').style.display = 'flex';

                    socket = io({ query: { isim: isim } });
                    baslatOyunDöngüsü();
                }

                function baslatOyunDöngüsü() {
                    const canvas = document.getElementById('arena');
                    const ctx = canvas.getContext('2d');

                    let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)} };
                    let tuslar = {};
                    let soruAcik = false;

                    window.addEventListener('keydown', (e) => { if(!soruAcik) tuslar[e.key.toLowerCase()] = true; });
                    window.addEventListener('keyup', (e) => { if(!soruAcik) tuslar[e.key.toLowerCase()] = false; });

                    window.addEventListener('mousedown', (e) => {
                        if (soruAcik || e.button !== 0) return;
                        const rect = canvas.getBoundingClientRect();
                        let ben = oyunVerisi.players[socket.id];
                        if (!ben) return;

                        let kameraX = Math.max(0, Math.min(ben.x - canvas.width / 2, ${HARITA_GENISLIK} - canvas.width));
                        let kameraY = Math.max(0, Math.min(ben.y - canvas.height / 2, ${HARITA_YUKSEKLIK} - canvas.height));

                        socket.emit('atesEt', { x: e.clientX - rect.left + kameraX, y: e.clientY - rect.top + kameraY });
                    });

                    setInterval(() => {
                        if (soruAcik) return;
                        let hareket = {x: 0, y: 0};
                        if(tuslar['w'] || tuslar['arrowup']) hareket.y = -6;
                        if(tuslar['s'] || tuslar['arrowdown']) hareket.y = 6;
                        if(tuslar['a'] || tuslar['arrowleft']) hareket.x = -6;
                        if(tuslar['d'] || tuslar['arrowright']) hareket.x = 6;
                        if(hareket.x !== 0 || hareket.y !== 0) socket.emit('hareketEt', hareket);
                    }, 1000 / 30);

                    socket.on('arenaGuncelle', (data) => { 
                        oyunVerisi = data; 
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

                    function cizimYap() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        let ben = oyunVerisi.players[socket.id];
                        let kameraX = ben ? Math.max(0, Math.min(ben.x - canvas.width / 2, ${HARITA_GENISLIK} - canvas.width)) : 0;
                        let kameraY = ben ? Math.max(0, Math.min(ben.y - canvas.height / 2, ${HARITA_YUKSEKLIK} - canvas.height)) : 0;

                        ctx.save();
                        ctx.translate(-kameraX, -kameraY);

                        oyunVerisi.bolgeler.forEach(b => {
                            ctx.fillStyle = b.renk;
                            ctx.fillRect(b.x, b.y, b.w, b.h);
                        });

                        ctx.fillStyle = "#333";
                        oyunVerisi.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

                        ctx.fillStyle = "#FFD700";
                        oyunVerisi.chests.forEach(c => { if(c.aktif) ctx.fillRect(c.x - 15, c.y - 15, 30, 30); });

                        ctx.fillStyle = "#ff4757";
                        oyunVerisi.bullets.forEach(b => {
                            ctx.beginPath();
                            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
                            ctx.fill();
                        });

                        for (let id in oyunVerisi.players) {
                            let p = oyunVerisi.players[id];
                            ctx.fillStyle = p.renk || "#00ffcc";
                            ctx.beginPath();
                            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.fillStyle = "#fff";
                            ctx.font = "12px sans-serif";
                            ctx.textAlign = "center";
                            ctx.fillText(p.isim + " (" + p.skor + "⭐)", p.x, p.y - 25);
                        }
                        ctx.restore();
                    }
                }
            </script>
        </body></html>
    `);
});

io.on('connection', (socket) => {
    let oyuncuIsim = socket.handshake.query.isim || 'Savaşçı';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = {
        id: socket.id,
        isim: oyuncuIsim,
        x: spawn.x,
        y: spawn.y,
        can: 100,
        skor: 0,
        renk: NEON_RENKLER[Math.floor(Math.random() * NEON_RENKLER.length)]
    };

    socket.on('hareketEt', (hareket) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let yeniX = p.x + hareket.x;
        let yeniY = p.y + hareket.y;
        if (!carpismaVarMi(yeniX, p.y, 20)) p.x = yeniX;
        if (!carpismaVarMi(p.x, yeniY, 20)) p.y = yeniY;

        chestler.forEach(c => {
            if (c.aktif && Math.hypot(p.x - c.x, p.y - c.y) < 30) {
                c.aktif = false;
                let rastgeleSoru = FEN_SORULARI[Math.floor(Math.random() * FEN_SORULARI.length)];
                socket.emit('soruGoster', { chestId: c.id, soruData: rastgeleSoru });
                setTimeout(() => { c.aktif = true; }, 15000);
            }
        });
    });

    socket.on('cevapVer', (data) => {
        let p = aktifOyuncular[socket.id];
        if (p && data.secilenIndex === data.dogruCevap) {
            p.skor += 10;
        }
    });

    socket.on('atesEt', (hedef) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let aci = Math.atan2(hedef.y - p.y, hedef.x - p.x);
        mermiler.push({ id: socket.id, x: p.x, y: p.y, vx: Math.cos(aci) * 12, vy: Math.sin(aci) * 12 });
    });

    socket.on('disconnect', () => { delete aktifOyuncular[socket.id]; });
});

setInterval(() => {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.vx;
        m.y += m.vy;
        if (carpismaVarMi(m.x, m.y, 5)) {
            mermiler.splice(i, 1);
            continue;
        }
        for (let id in aktifOyuncular) {
            if (id !== m.id && Math.hypot(aktifOyuncular[id].x - m.x, aktifOyuncular[id].y - m.y) < 20) {
                let katil = aktifOyuncular[m.id];
                if (katil) katil.skor += 5;
                let sp = rastgeleSpawnBul();
                aktifOyuncular[id].x = sp.x;
                aktifOyuncular[id].y = sp.y;
                mermiler.splice(i, 1);
                break;
            }
        }
    }
    io.emit('arenaGuncelle', { players: aktifOyuncular, bullets: mermiler, walls: DUVARLAR, chests: chestler, bolgeler: BOLGELER });
}, 1000 / 30);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    server.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`));
}

module.exports = app;
