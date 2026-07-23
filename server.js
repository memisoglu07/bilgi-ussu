const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = __dirname; // Sunucu dosyasının olduğu ana dizini baz alıyoruz

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Doğrudan ana proje klasörünü statik olarak sunuyoruz (index.html bu klasörde olmalı)
app.use(express.static(path));

app.get('/', (req, res) => {
    res.sendFile(path + '/index.html');
});

let players = {};
let matchTime = 300; // 5 dakika
let isMatchActive = true;

// Fen Bilimleri Soru Havuzu
const questionsData = {
    "Güneş, Dünya ve Ay": [
        { question: "Dünya'nın tek doğal uydusu nedir?", options: ["Güneş", "Ay", "Mars", "Yıldız"], answer: "Ay" },
        { question: "Güneş, Dünya'ya en yakın...?", options: ["Gezegendir", "Yıldızdır", "Uydudur", "Galaksidir"], answer: "Yıldızdır" },
        { question: "Ay'ın ana evrelerinin tamamlanma süresi yaklaşık ne kadardır?", options: ["1 gün", "1 hafta", "1 ay", "1 yıl"], answer: "1 ay" },
        { question: "Güneş'in şekli hangi geometrik cisme benzetilir?", options: ["Küre", "Küp", "Silindir", "Koni"], answer: "Küre" },
        { question: "Dünya kendi ekseni etrafında hangi yöne döner?", options: ["Doğudan batıya", "Batıdan doğuya", "Kuzeyden güneşe", "Güneyden kuzeye"], answer: "Batıdan doğuya" }
    ],
    "Kuvvetin Etkileri": [
        { question: "Duran bir cismi harekete geçiren etkiye ne denir?", options: ["Kuvvet", "Enerji", "Hız", "Sürtünme"], answer: "Kuvvet" },
        { question: "Mıknatısların aynı kutupları birbirini ne yapar?", options: ["Çeker", "İter", "Etkilemez", "Yakar"], answer: "İter" },
        { question: "Hangi cisimlere kuvvet uygulandığında şekil değiştirdikten sonra eski haline döner?", options: ["Esnek", "Sert", "Kırılgan", "Pürüzlü"], answer: "Esnek" },
        { question: "Temas gerektiren kuvvet hangisidir?", options: ["Yerçekimi", "Manyetik kuvvet", "İtme kuvveti", "Elektriksel kuvvet"], answer: "İtme kuvveti" },
        { question: "Mıknatıslar hangi maddeleri çekmez?", options: ["Demir", "Nikel", "Kobalt", "Tahta"], answer: "Tahta" }
    ]
};

let currentTopic = "Güneş, Dünya ve Ay";

// Süre ve Maç Döngüsü
setInterval(() => {
    if (isMatchActive) {
        matchTime--;
        if (matchTime <= 0) {
            isMatchActive = false;
            io.emit('matchEnded', { message: 'Süre bitti, yeni maç başladı!' });
            io.emit('chatMessage', { sender: 'Sistem', text: 'Süre bitti, yeni maç başladı!' });
            
            setTimeout(() => {
                matchTime = 300;
                isMatchActive = true;
                io.emit('matchRestarted', { message: 'Yeni maç aktif!', topic: currentTopic });
            }, 3000);
        }
    }
}, 1000);

io.on('connection', (socket) => {
    console.log('Oyuncu bağlandı:', socket.id);

    players[socket.id] = {
        x: 100,
        y: 100,
        score: 0,
        skin: 'default',
        isInvincible: false, // Görünmezlik hilesi
        isNinjaStar: false,   // Ninja yıldızı mermi hilesi
        selectedTopic: currentTopic
    };

    socket.emit('timeUpdate', { matchTime, isMatchActive });
    socket.emit('setQuestions', { topic: currentTopic, questions: questionsData[currentTopic] });

    // Skin Değiştirme
    socket.on('changeSkin', (skinName) => {
        if (players[socket.id]) {
            players[socket.id].skin = skinName;
            io.emit('updatePlayers', players);
        }
    });

    // Konu Seçimi
    socket.on('selectTopic', (topic) => {
        if (questionsData[topic]) {
            currentTopic = topic;
            for (let id in players) {
                players[id].selectedTopic = topic;
            }
            io.emit('setQuestions', { topic: currentTopic, questions: questionsData[currentTopic] });
            io.emit('chatMessage', { sender: 'Sistem', text: `Konu değiştirildi: ${topic}` });
        }
    });

    // Oyuncu Hareketi
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
    });

    // Soru Cevaplama
    socket.on('submitAnswer', (data) => {
        if (players[socket.id] && isMatchActive) {
            const activeQuestions = questionsData[currentTopic];
            if (activeQuestions && activeQuestions[data.questionIndex]) {
                const correct = activeQuestions[data.questionIndex].answer === data.selectedAnswer;
                if (correct) {
                    players[socket.id].score += 10;
                    socket.emit('answerResult', { correct: true, score: players[socket.id].score });
                } else {
                    socket.emit('answerResult', { correct: false, score: players[socket.id].score });
                }
                io.emit('updatePlayers', players);
            }
        }
    });

    // Hile Paneli (Ninja Yıldızı, Görünmezlik, Kill Hilesi)
    socket.on('adminCheat', (cheatData) => {
        if (players[socket.id]) {
            if (cheatData.type === 'ninjaStar') {
                players[socket.id].isNinjaStar = cheatData.status;
            } else if (cheatData.type === 'invisibility') {
                players[socket.id].isInvincible = cheatData.status;
            } else if (cheatData.type === 'killAll') {
                for (let id in players) {
                    if (id !== socket.id) {
                        players[id].score = 0;
                    }
                }
                io.emit('chatMessage', { sender: 'Sistem', text: 'Bir oyuncu hile ile ortalığı temizledi!' });
            }
            io.emit('updatePlayers', players);
        }
    });

    // Chat Mesajları
    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', { sender: players[socket.id]?.skin || 'Oyuncu', text: data.text });
    });

    socket.on('disconnect', () => {
        console.log('Oyuncu ayrıldı:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

setInterval(() => {
    io.emit('updatePlayers', players);
    io.emit('timeUpdate', { matchTime, isMatchActive });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor.`);
});
