const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları sunma (public klasörü varsayılmıştır, progene göre değiştirebilirsin)
app.use(express.static(path.join(__dirname, 'public')));

// Oyun ve Maç Durumları
let matchState = {
    timeRemaining: 300, // 5 dakika (saniye cinsinden)
    isGameActive: true,
    timerInterval: null
};

let players = {};

// Maç süresini başlatan fonksiyon
function startMatchTimer() {
    if (matchState.timerInterval) clearInterval(matchState.timerInterval);

    matchState.timeRemaining = 300;
    matchState.isGameActive = true;

    matchState.timerInterval = setInterval(() => {
        matchState.timeRemaining--;

        // Süre bittiğinde maçı bitir
        if (matchState.timeRemaining <= 0) {
            matchState.timeRemaining = 0;
            matchState.isGameActive = false;
            clearInterval(matchState.timerInterval);

            // Tüm oyunculara maçın bittiğini bildir
            io.emit('gameOver', { message: "Maç Süresi Bitti!" });
        }

        // Her saniye kalan süreyi oyunculara gönder
        io.emit('timerUpdate', matchState.timeRemaining);
    }, 1000);
}

// Socket.io Bağlantıları
io.on('connection', (socket) => {
    console.log(`Bir oyuncu bağlandı: ${socket.id}`);

    // Yeni oyuncuyu listeye ekle
    players[socket.id] = {
        id: socket.id,
        x: 100,
        y: 100,
        score: 0
    };

    // Oyuncuya güncel maç durumunu gönder
    socket.emit('initGame', {
        timeRemaining: matchState.timeRemaining,
        isGameActive: matchState.isGameActive,
        players: players
    });

    // Oyuncu yeniden başlatma isteği gönderirse
    socket.on('restartMatch', () => {
        startMatchTimer();
        io.emit('matchRestarted', {
            timeRemaining: matchState.timeRemaining,
            isGameActive: matchState.isGameActive
        });
        console.log("Maç yeniden başlatıldı!");
    });

    socket.on('disconnect', () => {
        console.log(`Oyuncu ayrıldı: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// "Cannot GET" hatalarını önlemek için tüm yönlendirmeleri ana HTML dosyasına bağla
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucu ilk açıldığında maçı başlat
startMatchTimer();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
