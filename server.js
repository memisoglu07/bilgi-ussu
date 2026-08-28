const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// 50 Adet Eksiksiz Bilgi-Üssü Sorusu
const questions = [
    { q: "Türkiye'nin başkenti neresidir?", options: ["Ankara", "İstanbul", "İzmir", "Bursa"], answer: 0 },
    { q: "2 + 2 kaç eder?", options: ["3", "4", "5", "22"], answer: 1 },
    { q: "Cumhuriyet kaç yılında ilan edilmiştir?", options: ["1920", "1922", "1923", "19 Mayis 1919"], answer: 2 },
    { q: "Dünyaya en yakın gezegen hangisidir?", options: ["Mars", "Venüs", "Jüpiter", "Satürn"], answer: 1 },
    { q: "Su hangi sıcaklıkta kaynar (normal şartlarda)?", options: ["0°C", "50°C", "100°C", "212°C"], answer: 2 },
    { q: "İstiklal Marşı'mızın şairi kimdir?", options: ["Mehmet Akif Ersoy", "Atatürk", "Orhan Veli", "Namık Kemal"], answer: 0 },
    { q: "Hücrenin enerji merkezi hangi organeldir?", options: ["Ribozom", "Mitokondri", "Çekirdek", "Golgi"], answer: 1 },
    { q: "Türkiye'nin en uzun nehridir?", options: ["Kızılırmak", "Fırat", "Dicle", "Sakarya"], answer: 0 },
    { q: "DNA'nın tam açılımı nedir?", options: ["Deoksiribo Nükleik Asit", "Ribonükleik Asit", "Dinamik Nükleer Asit", "Deoksi Nükleotit"], answer: 0 },
    { q: "Güneş sistemindeki en büyük gezegen hangisidir?", options: ["Mars", "Dünya", "Jüpiter", "Neptün"], answer: 2 },
    { q: "İlk Türk devletlerinde kağana danışmanlık yapan meclise ne ad verilirdi?", options: ["Kurultay", "Divan", "Toy", "Meclis-i Mebusan"], answer: 0 },
    { q: "Aşağıdakilerden hangisi bir programlama dili değildir?", options: ["Python", "JavaScript", "HTML", "C++"], answer: 2 },
    { q: "İstanbul kaç yılında fethedilmiştir?", options: ["1453", "1071", "1299", "1923"], answer: 0 },
    { q: "Periyodik tablonun simgesi 'Fe' olan elementi hangisidir?", options: ["Bakır", "Demir", "Altın", "Gümüş"], answer: 1 },
    { q: "Türkiye'nin komşularından biri değildir?", options: ["İran", "Bulgaristan", "Ukrayna", "Yunanistan"], answer: 2 },
    { q: "Dünya'nın uydusu nedir?", options: ["Mars", "Ay", "Güneş", "Titan"], answer: 1 },
    { q: "E = mc² formülü kime aittir?", options: ["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Galileo"], answer: 1 },
    { q: "Tiyatroda sahnede yer alan sanatçıların topluluğuna ne denir?", options: ["Koro", "Tiyatro Kumpanyası", "Orkestra", "Bando"], answer: 1 },
    { q: "Türkiye kaç coğrafi bölgeye ayrılmıştır?", options: ["5", "7", "4", "3"], answer: 1 },
    { q: "Sabit disklerin kısaltması nedir?", options: ["RAM", "CPU", "HDD", "GPU"], answer: 2 },
    { q: "İnsan vücudundaki en büyük kemik hangisidir?", options: ["Uyluk kemiği (Femur)", "Kaval kemiği", "Pazı kemiği", "Kafatası"], answer: 0 },
    { q: "Osmanlı Devleti'nin kurucusu kimdir?", options: ["Osman Bey", "Ertuğrul Gazi", "Orhan Bey", "Yıldırım Bayezid"], answer: 0 },
    { q: "Hangi gaz atmosferde en yüksek oranda bulunur?", options: ["Oksijen", "Karbondioksit", "Azot", "Hidrojen"], answer: 2 },
    { q: "Asya ile Avrupa'yı ayıran boğazların adlarından biri değildir?", options: ["İstanbul Boğazı", "Çanakkale Boğazı", "Cebelitarık", "Her ikisi de boğazdır"], answer: 2 },
    { q: "Aşağıdakilerden hangisi bir arama motorudur?", options: ["Google", "Photoshop", "Notepad", "Windows"], answer: 0 },
    { q: "Türkiye'nin plaka kodu en son hangisidir?", options: ["81", "82", "79", "80"], answer: 0 },
    { q: "Mona Lisa tablosu kime aittir?", options: ["Picasso", "Leonardo da Vinci", "Van Gogh", "Rembrandt"], answer: 1 },
    { q: "Yarım küreleri birbirinden ayıran hayali çizgiye ne denir?", options: ["Ekvator", "Meridyen", "Yengeç Dönencesi", "Oğlak Dönencesi"], answer: 0 },
    { q: "Türkiye'de kadınlara seçme ve seçilme hakkı hangi yıl verilmiştir?", options: ["1923", "1930", "1934", "1926"], answer: 2 },
    { q: "Bilgisayarda 'Ctrl + C' tuş kombinasyonunun işlevi nedir?", options: ["Yapıştır", "Kopyala", "Kes", "Geri Al"], answer: 1 },
    { q: "Güneş'e en yakın olan gezegen hangisidir?", options: ["Merkür", "Venüs", "Mars", "Dünya"], answer: 0 },
    { q: "Hangi ülke Asya ve Avrupa kıtalarında toprakları olan bir ülkedir?", options: ["Mısır", "Türkiye", "Kanada", "Brezilya"], answer: 1 },
    { q: "Nobel ödülleri hangi ülkede verilmektedir?", options: ["İsveç", "İsviçre", "Almanya", "İngiltere"], answer: 0 },
    { q: "İnsan vücudunda kaç tane duyu organı vardır?", options: ["4", "5", "6", "3"], answer: 1 },
    { q: "Bir kilometre kaç metredir?", options: ["100", "1000", "10", "10000"], answer: 1 },
    { q: "Atatürk'ün doğduğu şehir hangisidir?", options: ["Ankara", "İstanbul", "Selanik", "İzmir"], answer: 2 },
    { q: "Hangi element suyun yapısında bulunmaz?", options: ["Hidrojen", "Oksijen", "Helyum", "Hepsi bulunur"], answer: 2 },
    { q: "İnternetin protokollü adresi ne olarak bilinir?", options: ["HTML", "IP", "URL", "HTTP"], answer: 1 },
    { q: "Türkiye'nin en yüksek dağı hangisidir?", options: ["Ağrı Dağı", "Erciyes", "Uludağ", "Kaçkar"], answer: 0 },
    { q: "Yer çekimini bulan bilim insanı kimdir?", options: ["Einstein", "Newton", "Tesla", "Edison"], answer: 1 },
    { q: "Hangi renkler ana renkler arasındadır?", options: ["Kırmızı, Sarı, Mavi", "Yeşil, Mor, Turuncu", "Siyah, Beyaz, Gri", "Mavi, Yeşil, Kırmızı"], answer: 0 },
    { q: "Futbol maçında bir takım sahada kaç oyuncuyla yer alır?", options: ["10", "11", "12", "9"], answer: 1 },
    { q: "Hangi organımız kanı pompalar?", options: ["Akciğer", "Kalp", "Böbrek", "Karaciğer"], answer: 1 },
    { q: "Anıtkabir hangi ilimizdedir?", options: ["İstanbul", "Ankara", "İzmir", "Konya"], answer: 1 },
    { q: "P piksellerden oluşan dijital görüntü birimine ne ad verilir?", options: ["Bit", "Byte", "Pixel", "Resolution"], answer: 2 },
    { q: "Hangi yıl İstanbul'un fethinin 500. yılı kutlanmıştır?", options: ["1953", "1945", "1960", "1973"], answer: 0 },
    { q: "Şimşek çaktıktan sonra sesin geç gelmesinin nedeni nedir?", options: ["Işığın sesten hızlı gitmesi", "Sesin ışıktan hızlı gitmesi", "Havanın sıcaklığı", "Bulutların uzaklığı"], answer: 0 },
    { q: "Dünya'nın eksen eğikliği kaç derecedir?", options: ["23° 27'", "45°", "0°", "90°"], answer: 0 },
    { q: "Aşağıdakilerden hangisi bir işletim sistemi değildir?", options: ["Windows", "Linux", "Microsoft Word", "macOS"], answer: 2 },
    { q: "Bilgi Üssü'nün kurucusu ve lideri kimdir?", options: ["Sen (Oyuncu)", "Robot", "Yapay Zeka", "Hiçbiri"], answer: 0 }
];

let players = {};
let currentQuestionIndex = 0;
let gameState = "waiting"; // waiting, playing, ended
let timer = 15;
let timerInterval = null;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Bilgi Üssü Arena</title>
            <script src="/socket.io/socket.io.js"></script>
            <style>
                body { background: #0f172a; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                .card { background: #1e293b; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 450px; border: 1px solid #334155; }
                input { width: 90%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 16px; text-align: center; }
                button { width: 95%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; margin-top: 10px; }
                button:hover { background: #2563eb; }
                .skin-selector { display: flex; justify-content: space-around; margin: 15px 0; }
                .skin-option { font-size: 32px; cursor: pointer; padding: 10px; border-radius: 50%; border: 2px solid transparent; transition: 0.2s; }
                .skin-option.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.2); }
                .option-btn { background: #334155; margin: 8px 0; width: 100%; text-align: left; padding: 12px 20px; }
                .option-btn:hover { background: #475569; }
                #gameArea { display: none; }
                #lobbyArea { display: block; }
            </style>
        </head>
        <body>
            <div class="card" id="lobbyArea">
                <h2>🚀 BİLGİ ÜSSÜ ARENA</h2>
                <p>Karakterini seç ve areneya katıl!</p>
                <input type="text" id="username" placeholder="Kullanıcı Adı Gir..." maxlength="15">
                <div class="skin-selector">
                    <span class="skin-option selected" onclick="selectSkin('🚀', this)">🚀</span>
                    <span class="skin-option" onclick="selectSkin('🤖', this)">🤖</span>
                    <span class="skin-option" onclick="selectSkin('🐱', this)">🐱</span>
                    <span class="skin-option" onclick="selectSkin('🦊', this)">🦊</span>
                </div>
                <button onclick="joinGame()">OYUNA GİR</button>
            </div>

            <div class="card" id="gameArea">
                <h3 id="questionTitle">Soru yükleniyor...</h3>
                <div id="optionsContainer"></div>
                <h4 id="timerText">Süre: 15s</h4>
                <p id="scoreText">Puan: 0</p>
                <div id="leaderboard" style="margin-top: 15px; font-size: 14px; text-align: left; background: #0f172a; padding: 10px; border-radius: 8px;"></div>
            </div>

            <script>
                const socket = io();
                let selectedSkin = '🚀';
                let myScore = 0;

                function selectSkin(skin, el) {
                    document.querySelectorAll('.skin-option').forEach(s => s.classList.remove('selected'));
                    el.classList.add('selected');
                    selectedSkin = skin;
                }

                function joinGame() {
                    const name = document.getElementById('username').value.trim();
                    if(!name) { alert("Lütfen bir kullanıcı adı gir!"); return; }
                    socket.emit('joinGame', { name, skin: selectedSkin });
                    document.getElementById('lobbyArea').style.display = 'none';
                    document.getElementById('gameArea').style.display = 'block';
                }

                socket.on('newQuestion', (data) => {
                    document.getElementById('questionTitle').innerText = data.qNumber + ". " + data.q;
                    const container = document.getElementById('optionsContainer');
                    container.innerHTML = '';
                    data.options.forEach((opt, idx) => {
                        const btn = document.createElement('button');
                        btn.className = 'option-btn';
                        btn.innerText = (idx + 1) + ") " + opt;
                        btn.onclick = () => {
                            socket.emit('answer', idx);
                            // Butonları geçici devre dışı bırak
                            const allBtns = document.querySelectorAll('.option-btn');
                            allBtns.forEach(b => b.disabled = true);
                        };
                        container.appendChild(btn);
                    });
                });

                socket.on('timerUpdate', (t) => {
                    document.getElementById('timerText').innerText = "Süre: " + t + "s";
                });

                socket.on('scoreUpdate', (score) => {
                    myScore = score;
                    document.getElementById('scoreText').innerText = "Puan: " + myScore;
                });

                socket.on('leaderboardUpdate', (lb) => {
                    let html = "<b>Canlı Sıralama:</b><br>";
                    lb.forEach((p, index) => {
                        html += \`\${index + 1}. \${p.skin} \${p.name} - \${p.score} Puan<br>\`;
                    });
                    document.getElementById('leaderboard').innerHTML = html;
                });
            </script>
        </body>
        </html>
    `);
});

const io = new Server(server);

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı:', socket.id);

    socket.on('joinGame', (data) => {
        players[socket.id] = {
            name: data.name || 'Misafir',
            skin: data.skin || '🚀',
            score: 0
        };
        broadcastLeaderboard();
        
        // İlk bağlantıda oyun akışı başlamadıysa başlat
        if (gameState === "waiting") {
            gameState = "playing";
            startQuestionCycle();
        } else {
            // Aktif soru varsa gönder
            socket.emit('newQuestion', {
                qNumber: currentQuestionIndex + 1,
                q: questions[currentQuestionIndex].q,
                options: questions[currentQuestionIndex].options
            });
        }
    });

    socket.on('answer', (optionIndex) => {
        if (!players[socket.id]) return;
        const currentQ = questions[currentQuestionIndex];
        if (optionIndex === currentQ.answer) {
            players[socket.id].score += 10;
            socket.emit('scoreUpdate', players[socket.id].score);
        }
        broadcastLeaderboard();
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log('Oyuncu ayrıldı:', socket.id);
        broadcastLeaderboard();
    });
});

function startQuestionCycle() {
    timer = 15;
    
    // Her tur başı tüm aktif oyunculara yeni soruyu gönder
    io.emit('newQuestion', {
        qNumber: currentQuestionIndex + 1,
        q: questions[currentQuestionIndex].q,
        options: questions[currentQuestionIndex].options
    });

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timer--;
        io.emit('timerUpdate', timer);

        if (timer <= 0) {
            currentQuestionIndex++;
            if (currentQuestionIndex >= questions.length) {
                currentQuestionIndex = 0; // Sorular bitince başa dön
            }
            startQuestionCycle(); // Sonraki soruya geç
        }
    }, 1000);
}

function broadcastLeaderboard() {
    const lb = Object.values(players).sort((a, b) => b.score - a.score);
    io.emit('leaderboardUpdate', lb);
}

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor.`);
});
