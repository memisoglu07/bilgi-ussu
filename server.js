else if (anaKomut === 'kill') {
            let hedefSira = parseInt(parcalar[1]);
            if (isNaN(hedefSira)) {
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⚠️ Geçersiz sıra! Örn: kill 1' });
                return;
            }

            let siraliOyuncular = Object.values(aktifOyuncular).sort((a, b) => b.skor - a.skor);
            let hedefOyuncu = siraliOyuncular[hedefSira - 1];

            if (hedefOyuncu) {
                // Hızlıca yanına koşma hissi için hızı geçici artırabiliriz veya direkt 
                // saniyede 10 mermi atacak çılgın bir "Seri Ateş" modunu tetikleyebiliriz!
                p.seriAtesSuresi = 60; // 2 saniye boyunca saniyede 10 mermi (toplam 20 mermi) yağdırır
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `🔥 SERİ ATEŞ MODU AKTİF! ${hedefOyuncu.isim} hedeflendi, kurşun yağmuru başlıyor!` });
            } else {
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `⚠️ ${hedefSira}. sırada bir oyuncu bulunamadı!` });
            }
        }
