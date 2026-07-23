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
let oyunDurumu = 'devam'; // 'devam' veya 'bitti'

// --- 50'ŞER SORULUK FEN BİLGİSİ SORU HAVUZU ---
const SORU_HAVUZU = {
    unite1: [
        { soru: "Güneş'in katmanlarından en dışta yer alan ve gözle görülebilen tabaka hangisidir?", secenekler: ["Işık Küre (Fotosfer)", "Taç Küre", "Renksiz Küre", "Çekirdek"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Güneş lekelerinin özelliklerinden biridir?", secenekler: ["Güneş'in en sıcak bölgeleridir.", "Soğuk bölgeler olduğu için koyu görünürler.", "Sürekli aynı yerde kalırlar.", "Büyüklükleri hiç değişmez."], dogru: 1 },
        { soru: "Güneş kendi ekseni etrafındaki dönme hareketini hangi yönün tersine yapar?", secenekler: ["Kuzeyden Güneye", "Doğudan Batıya", "Batıdan Doğuya", "Güneyden Kuzeye"], dogru: 2 },
        { soru: "Güneş'in yapısında en çok bulunan gaz hangisidir?", secenekler: ["Oksijen", "Helyum", "Hidrojen", "Azot"], dogru: 2 },
        { soru: "Güneş'in şekli aşağıdakilerden hangisine benzer?", secenekler: ["Mükemmel küre", "Küreye yakın küresel", "Elips", "Silindir"], dogru: 1 },
        { soru: "Güneş bir yıldız mıdır, gezegen mi?", secenekler: ["Gezegendir", "Yıldızdır", "Uydu", "Meteor"], dogru: 1 },
        { soru: "Güneş dünyamıza en yakın ne konumdadır?", secenekler: ["Gezegen", "Yıldız", "Galaksi", "Bulutsu"], dogru: 1 },
        { soru: "Güneş lekelerini ilk defa teleskopla detaylı inceleyen bilim insanı kimdir?", secenekler: ["Newton", "Galileo Galilei", "Einstein", "Copernicus"], dogru: 1 },
        { soru: "Güneş'in sıcaklığı dış yüzeyinde yaklaşık kaç derecedir?", secenekler: ["6000 °C", "100 °C", "1 milyon °C", "50 °C"], dogru: 0 },
        { soru: "Güneş enerjisini hangi maddelerin tepkimesinden alır?", secenekler: ["Hidrojen-Helyum", "Karbon-Oksijen", "Su-Tuz", "Demir-Nikel"], dogru: 0 },
        { soru: "Dünya'nın güneşe olan konumu değiştikçe ne oluşur?", secenekler: ["Mevsimler", "Günlük sıcaklık farkı", "Yıldız kayması", "Pusula sapması"], dogru: 0 },
        { soru: "Güneş sistemi hangi galakside yer alır?", secenekler: ["Andromeda", "Samanyolu", "Sombrero", "Büyük Macellan"], dogru: 1 },
        { soru: "Güneş'in dünyaya uzaklığı yaklaşık ne kadardır?", secenekler: ["150 milyon km", "15 bin km", "384 bin km", "10 milyar km"], dogru: 0 },
        { soru: "Güneş kendi ekseni etrafında dönüşünü ortalama kaç günde tamamlar?", secenekler: ["25 günde", "365 günde", "24 saatte", "30 günde"], dogru: 0 },
        { soru: "Güneş'in çekirdek sıcaklığı dış katmanına göre nasıl?", secenekler: ["Daha çok sıcaktır", "Daha soğuktur", "Aynıdır", "Değişken değildir"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Güneş'in katmanlarından biri değildir?", secenekler: ["Fotosfer", "Çekirdek", "Mantel", "Taç Küre"], dogru: 2 },
        { soru: "Güneş'in yaydığı ısı ve ışık birer ne tür enerjidir?", secenekler: ["Kinetik enerji", "Yenilenemez enerji", "Nükleer kökenli ışıma", "Potansiyel enerji"], dogru: 2 },
        { soru: "Güneş sistemi içinde kaç tane gezegen vardır?", secenekler: ["8", "9", "7", "10"], dogru: 0 },
        { soru: "Güneş'in kütlesi Güneş sistemindeki toplam kütlenin yüzde kaçını oluşturur?", secenekler: ["%99.8", "%50", "%20", "%80"], dogru: 0 },
        { soru: "Güneş lekeleri neden diğer bölgelerden daha koyu görünür?", secenekler: ["Daha soğuk oldukları için", "Gölgede kaldıkları için", "Toz bulutundan", "Su katmanından"], dogru: 0 },
        { soru: "Güneş ışınları dünyaya kaç dakikada ulaşır?", secenekler: ["8 dakika", "1 saat", "24 saniye", "2 gün"], dogru: 0 },
        { soru: "Güneş'in ömrü hakkında bilim insanlarının tahmini hangi aşamadadır?", secenekler: ["Orta yaşlarında", "Ömrünün sonuna gelmiş", "Yeni oluşmuş", "Yok olmak üzere"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi bir orta büyüklükte yıldızdır?", secenekler: ["Demir Yıldızı", "Güneş", "Kutup Yıldızı", "Sirius"], dogru: 1 },
        { soru: "Güneş'in çapı Dünya'nın çapının yaklaşık kaç katıdır?", secenekler: ["109 kat", "5 kat", "10 kat", "1000 kat"], dogru: 0 },
        { soru: "Güneş dünyadan yaklaşık kaç kat daha büyüktür?", secenekler: ["1.3 milyon", "50 bin", "1000", "500"], dogru: 0 },
        { soru: "Güneş'in rengi çıplak gözle uzaydan bakıldığında asıl hangi renktir?", secenekler: ["Sarı", "Beyaz", "Kırmızı", "Mavi"], dogru: 1 },
        { soru: "Güneş'in kendi etrafında dönme yönü hangi taraftadır?", secenekler: ["Batıdan Doğuya", "Doğudan Batıya", "Kuzeyden Güneye", "Sabittir dönmez"], dogru: 0 },
        { soru: "Güneş rüzgarları dünyada neye sebep olur?", secenekler: ["Kutup ışıklarına (Aurora)", "Depremlere", "Tsunamiye", "Kasırgalara"], dogru: 0 },
        { soru: "Güneş'in en sıcak katmanı hangisidir?", secenekler: ["Çekirdek", "Fotosfer", "Kromosfer", "Taç Küre"], dogru: 0 },
        { soru: "Güneş'in kütlesinin çoğunu oluşturan element çifti hangisidir?", secenekler: ["Hidrojen ve Helyum", "Demir ve Karbon", "Oksijen ve Azot", "Kalsiyum ve Sodyum"], dogru: 0 },
        { soru: "Güneş bir galaksinin neresinde yer alır?", secenekler: ["Merkezinde", "Sarmal kolların birinde", "Dış boşluğunda", "Galaksi dışındadır"], dogru: 1 },
        { soru: "Güneş'in çekirdeğinde hangi nükleer olay gerçekleşir?", secenekler: ["Füzyon (Kaynaşma)", "Fisyon (Bölünme)", "Yanma", "Buharlaşma"], dogru: 0 },
        { soru: "Güneş saatte uzay boşluğunda kaç km hızla hareket eder?", secenekler: ["720.000 km", "100 km", "5000 km", "1 milyon km"], dogru: 0 },
        { soru: "Güneş'in yüzeyinde görülen parlak alanlara ne denir?", secenekler: ["Granül", "Leke", "Krater", "Dağ"], dogru: 0 },
        { soru: "Güneş tutulması hangi cismin araya girmesiyle olur?", secenekler: ["Ay", "Dünya", "Mars", "Venüs"], dogru: 0 },
        { soru: "Güneş enerjisi doğrudan hangi teknoloji ile elektrik enerjisine çevrilir?", secenekler: ["Güneş panelleri", "Rüzgâr türbini", "Termosifon", "Dinamolar"], dogru: 0 },
        { soru: "Güneş'in kütleçekim kuvveti sistemdeki cisimleri ne yapar?", secenekler: ["Yörüngede tutar", "Uzaklaştırır", "Yok eder", "Çarpıştırır"], dogru: 0 },
        { soru: "Güneş'in katmanları dıştan içe doğru hangi sırayla dizilir?", secenekler: ["Taçküre - Renküre - Işıkküre", "Işıkküre - Renküre - Taçküre", "Çekirdek - Taçküre - Işıkküre", "Hepsiburada"], dogru: 0 },
        { soru: "Güneş'in çekirdek sıcaklığı yaklaşık kaç Kelvin veya Celsius'tur?", secenekler: ["15 milyon derece", "15 bin derece", "1500 derece", "100 bin derece"], dogru: 0 },
        { soru: "Güneş'in manyetik alanı her kaç yılda bir ters döner?", secenekler: ["11 yılda bir", "1 yılda bir", "100 yılda bir", "Hiçbir zaman"], dogru: 0 },
        { soru: "Dünya'nın Güneş etrafındaki yörüngesinin şekli nedir?", secenekler: ["Elips", "Tam çember", "Kare", "Dikdörtgen"], dogru: 0 },
        { soru: "Güneş ışınlarının düşme açısı değiştikçe ne değişir?", secenekler: ["Sıcaklık ve gölge boyu", "Gezegenin boyutu", "Ay'ın evresi", "Yıldız sayısı"], dogru: 0 },
        { soru: "Güneş sistemi gök cisimlerini bir arada tutan en büyük güç nedir?", secenekler: ["Kütle çekim kuvveti", "Manyetik alan", "Işık basıncı", "Rüzgâr gücü"], dogru: 0 },
        { soru: "Güneş lekelerinin sayısı kaç yıllık döngülerle değişir?", secenekler: ["11 yıllık", "5 yıllık", "50 yıllık", "500 yıllık"], dogru: 0 },
        { soru: "Güneş'in atmosferine ne ad verilir?", secenekler: ["Atmosfer yoktur", "Taçküre ve Renküre", "Stratosfer", "Troposfer"], dogru: 1 },
        { soru: "Güneş'in gaz halinde olması onun hangi tür gök cismi olduğunu gösterir?", secenekler: ["Gaz devi yıldız", "Katı kayaç", "Buz kütlesi", "Kara delik"], dogru: 0 },
        { soru: "Güneş'in yaydığı zararlı ışınları dünyada ne engeller?", secenekler: ["Ozon tabakası", "Bulutlar", "Yıldızlar", "Okyanuslar"], dogru: 0 },
        { soru: "Güneş enerjisi dünyaya en çok hangi yolla ulaşır?", secenekler: ["Işıma (Radyasyon)", "İlettim (Kondüksiyon)", "Taşınım (Konveksiyon)", "Çarpışma"], dogru: 0 },
        { soru: "Güneş'in kendi ekseni etrafında dönüşü her yerinde aynı hızı mı izler?", secenekler: ["Hayır, ekvatorda daha hızlıdır", "Evet, her yer eşittir", "Kutuplarda daha hızlıdır", "Sabit değildir"], dogru: 0 },
        { soru: "Güneş tutulması hangi evrede meydana gelir?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Son Dördün"], dogru: 0 }
    ],
    unite2: [
        { soru: "Ay'ın ana evreleri arasındaki süre yaklaşık ne kadardır?", secenekler: ["1 Hafta", "15 Gün", "1 Ay (29.5 gün)", "1 Yıl"], dogru: 2 },
        { soru: "Ay'ın Dünya'dan bakıldığında hep aynı yüzünün görülmesinin temel nedeni nedir?", secenekler: ["Kendi etrafında dönmemesi", "Dünya ile aynı hızda dönmesi", "Kendi ekseni etrafındaki dönme süresi ile Dünya etrafındaki dolanma süresinin eşit olması", "Güneş tarafından aydınlatılamaması"], dogru: 2 },
        { soru: "Aşağıdakilerden hangisi Ay'ın ana evrelerinden biri değildir?", secenekler: ["Yeni Ay", "Dolunay", "Hilal", "Şişkin Ay"], dogru: 2 }, // Hilal ve şişkin ara evredir, temel ana evreler Yeni Ay, İlk Dördün, Dolunay, Son Dördündür.
        { soru: "Yeni Ay evresinden bir hafta sonra hangi ana evre görülür?", secenekler: ["İlk Dördün", "Dolunay", "Son Dördün", "Hilal"], dogru: 0 },
        { soru: "İlk Dördün evresinden bir hafta sonra hangi ana evre görülür?", secenekler: ["Dolunay", "Yeni Ay", "Son Dördün", "Hilal"], dogru: 0 },
        { soru: "Dolunay evresinden bir hafta sonra hangi ana evre görülür?", secenekler: ["Son Dördün", "İlk Dördün", "Yeni Ay", "Hilal"], dogru: 0 },
        { soru: "Son Dördün evresinden bir hafta sonra hangi ana evre görülür?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Hilal"], dogru: 0 },
        { soru: "Ay'ın Dünya etrafındaki dolanım yönü nasıldır?", secenekler: ["Batıdan Doğuya (Saatin tersi yönünde)", "Doğudan Batıya", "Kuzeyden Güneye", "Sabit durur"], dogru: 0 },
        { soru: "Ay'ın yüzeyinde görülen çukur alanlara ne ad verilir?", secenekler: ["Krater", "Dağ", "Vadi", "Tepe"], dogru: 0 },
        { soru: "Ay'da atmosferin yok denecek kadar az olmasının sonucu hangisidir?", secenekler: ["Gece gündüz sıcaklık farkının çok fazla olması", "Hava olaylarının çok görülmesi", "Yağmur yağması", "Rüzgâr esmesi"], dogru: 0 },
        { soru: "Ay'ın kendi etrafında dönme süresi ile Dünya etrafındaki dolanma süresi kaç gündür?", secenekler: ["27.3 gün", "365 gün", "15 gün", "30 gün"], dogru: 0 },
        { soru: "Ay'ın ışık kaynağı nedir?", secenekler: ["Güneş'ten aldığı ışığı yansıtır", "Kendi ışığı vardır", "Yıldızlardan alır", "Dünya'dan ışık yayar"], dogru: 0 },
        { soru: "Ay'ın Dünya'ya uzaklığı ortalama ne kadardır?", secenekler: ["384.400 km", "150 milyon km", "10 bin km", "5 milyon km"], dogru: 0 },
        { soru: "Ay'ın çapı Dünya'nın çapının yaklaşık kaçta kadarıdır?", secenekler: ["Dörtte biri (1/4)", "Yarısı (1/2)", "Onda biri (1/10)", "Eşittir"], dogru: 0 },
        { soru: "Ay'da rüzgâr ve yağmur gibi hava olaylarının görülmemesinin nedeni nedir?", secenekler: ["Atmosferin olmaması", "Çok sıcak olması", "Su bulunmaması", "Dönmemesi"], dogru: 0 },
        { soru: "Ay ilk defa hangi yıl insanlı uzay aracıyla ziyaret edilmiştir?", secenekler: ["1969", "1950", "1985", "2000"], dogru: 0 },
        { soru: "Ay'a ayak basan ilk insan kimdir?", secenekler: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "Isaac Newton"], dogru: 0 },
        { soru: "Ay'ın yüzeyini kaplayan ince toz tabakasına ne denir?", secenekler: ["Regolit (Ay tozu)", "Toprak", "Kum", "Çakıl"], dogru: 0 },
        { soru: "Ay tutulması hangi evrede gerçekleşir?", secenekler: ["Dolunay", "Yeni Ay", "İlk Dördün", "Son Dördün"], dogru: 0 },
        { soru: "Ay'ın ana ve ara evrelerinin tamamlanması (bir döngü) ne kadar sürer?", secenekler: ["29.5 gün", "24 saat", "365 gün", "7 gün"], dogru: 0 },
        { soru: "Hilal hangi evreler arasında görülen bir ara evredir?", secenekler: ["Yeni Ay ile İlk Dördün", "Dolunay ile Son Dördün", "İlk Dördün ile Dolunay", "Hiçbiri"], dogru: 0 },
        { soru: "Şişkin Ay hangi ana evreler arasında görülür?", secenekler: ["İlk Dördün ile Dolunay arası", "Yeni Ay ile Hilal arası", "Son Dördün ile Yeni Ay", "Dolunay ile Yeni Ay"], dogru: 0 },
        { soru: "Ay'ın Dünya'dan bakıldığında aydınlık kısmının her gün değişmesinin nedeni nedir?", secenekler: ["Dünya ve Ay'ın hareketleri", "Güneş'in sönmesi", "Ay'ın şekil değiştirmesi", "Bulutlar"], dogru: 0 },
        { soru: "Ay'da yer çekimi Dünya'dakinin yaklaşık kaç katıdır?", secenekler: ["Altıda biri (1/6)", "Yarısı", "Eşittir", "İki katı"], dogru: 0 },
        { soru: "Ay'ın evreleri takvimin hangisinin belirlenmesinde eski çağlarda kullanılmıştır?", secenekler: ["Kameri (Ay) takvimi", "Miladi takvim", "Güneş takvimi", "Saat"], dogru: 0 },
        { soru: "Ay'ın gökyüzünde Güneş ile aynı büyüklükte görünmesinin sebebi nedir?", secenekler: ["Dünya'ya yakın olması ile Güneş'in büyük ama çok uzakta olmasının oran dengesi", "Gerçekte aynı boyutta olmaları", "Göz yanılması", "Işığın kırılması"], dogru: 0 },
        { soru: "Ay bir gezegen midir?", secenekler: ["Hayır, Dünya'nın uydusudur", "Evet gezegendir", "Yıldızdır", "Meteoroiddir"], dogru: 0 },
        { soru: "Ay'ın karanlık yüzü denilen kısım aslında ne anlama gelir?", secenekler: ["Dünya'dan görünmeyen yüzü", "Hiç güneş almayan yüzü", "Siyah boyalı kısmı", "Geceleri oluşan yüzü"], dogru: 0 },
        { soru: "Ay'ın evrelerinde 'D' harfine benzeyen evre hangisidir?", secenekler: ["İlk Dördün", "Son Dördün", "Yeni Ay", "Dolunay"], dogru: 0 },
        { soru: "Ay'ın evrelerinde ters 'D' (veya 'C') harfine benzeyen evre hangisidir?", secenekler: ["Son Dördün", "İlk Dördün", "Dolunay", "Hilal"], dogru: 0 },
        { soru: "Ay tutulmasında araya hangi gök cismi girer?", secenekler: ["Dünya", "Ay", "Güneş", "Mars"], dogru: 0 },
        { soru: "Ay'ın evreleri sırasında Ay, Dünya ve Güneş hangi evrede aynı doğrultudadır?", secenekler: ["Yeni Ay ve Dolunay", "İlk Dördün", "Son Dördün", "Hiçbir zaman"], dogru: 0 },
        { soru: "Ay'ın hareketlerinden hangisi onun kendi ekseni etrafındaki dönmesidir?", secenekler: ["Kendi dönmesi", "Dünya etrafında dolanması", "Güneş etrafında dönmesi", "Hiçbiri"], dogru: 0 },
        { soru: "Ay'ın şekli uzayda gerçekten nasıldır?", secenekler: ["Küre şeklindedir", "Orak şeklindedir", "Dairedir", "Yumurtadır"], dogru: 0 },
        { soru: "Ay üzerinde ayak izlerinin milyonlarca yıl kalabilmesinin sebebi nedir?", secenekler: ["Rüzgâr ve erozyonun (atmosfer olmadığı için) olmaması", "Toprağın beton gibi sert olması", "Ay'ın donmuş olması", "İnsanların hafif basması"], dogru: 0 },
        { soru: "Ay'ın evreleri döngüsü kaç günde bir tekrarlanır?", secenekler: ["29.5 gün", "30 gün", "28 gün", "365 gün"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi Ay için söylenemez?", secenekler: ["Su kaynakları boldur", "Atmosferi çok incedir", "Kayaç yapıdadır", "Işığı yansıtır"], dogru: 0 },
        { soru: "Ay'ın en büyük yüzey şekilleri olan karanlık düzlüklere ne ad verilir?", secenekler: ["Ay denizleri (Maria)", "Okyanuslar", "Göl", "Nehir yatakları"], dogru: 0 },
        { soru: "Ay tutulması olayında gözlem hangi vakit yapılabilir?", secenekler: ["Gece vakti", "Gündüz vakti", "Öğle güneşinde", "Sabah ezanında"], dogru: 0 },
        { soru: "Ay'ın evreleri sırasıyla nasıl başlar?", secenekler: ["Yeni Ay ile başlar", "Dolunay ile başlar", "Hilal ile başlar", "Son dördünle başlar"], dogru: 0 },
        { soru: "Ay dünyadan uzaklaşmakta mıdır yoksa yaklaşmakta mıdır?", secenekler: ["Yılda birkaç cm uzaklaşmaktadır", "Yaklaşmaktadır", "Mesafesi sabittir", "Hızla uzaklaşmaktadır"], dogru: 0 },
        { soru: "Ay'ın evrelerinin oluşmasının temel sebebi nedir?", secenekler: ["Ay'ın Dünya etrafında dolanması ve Güneş ışığını farklı açılardan yansıtması", "Dünya'nın gölgesinin düşmesi", "Güneş'in batması", "Ay'ın büyümesi"], dogru: 0 },
        { soru: "Aşağıdaki evrelerin hangisinde Ay hiç görünmez?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Son Dördün"], dogru: 0 },
        { soru: "Ay'ın evrelerinden hangisinde Ay parlak bir daire şeklinde görülür?", secenekler: ["Dolunay", "Yeni Ay", "Hilal", "Son Dördün"], dogru: 0 },
        { soru: "Ay'ın evre değişimleri dünyamızda neye doğrudan etki eder?", secenekler: ["Okyanuslardaki gelgit (med-cezir) olayına", "Hava sıcaklığına", "Yıldız kaymasına", "Rüzgârlara"], dogru: 0 },
        { soru: "Ay'ın evreleri kaç ana evreden oluşur?", secenekler: ["4", "2", "8", "6"], dogru: 0 },
        { soru: "Ay'ın evreleri kaç ara evreden oluşur?", secenekler: ["4", "2", "8", "10"], dogru: 0 },
        { soru: "İlk Dördün evresinde Ay'ın hangi tarafı aydınlıktır?", secenekler: ["Sağ tarafı", "Sol tarafı", "Tamamı", "Hiçbiri"], dogru: 0 },
        { soru: "Son Dördün evresinde Ay'ın hangi tarafı aydınlıktır?", secenekler: ["Sol tarafı", "Sağ tarafı", "Tamamı", "Hiçbiri"], dogru: 0 },
        { soru: "Ay'ın evrelerini ilk defa doğru şekilde haritalandıran medeniyetler kimlerdir?", secenekler: ["Eski gök bilimciler / Babilliler ve Yunanlılar", "Sadece günümüz bilim insanları", "Hiçbiri", "Orta çağ avrupası"], dogru: 0 }
    ],
    unite3: [
        { soru: "Hücrede enerji üretimiyle görevli organel hangisidir?", secenekler: ["Kloroplast", "Mitokondri", "Ribozom", "Golgi Cihazı"], dogru: 1 },
        { soru: "Aşağıdakilerden hangisi bitki hücresinde olup hayvan hücresinde bulunmaz?", secenekler: ["Çekirdek", "Sitoplazma", "Hücre Duvarı (Çeper)", "Mitokondri"], dogru: 2 },
        { soru: "Hücrenin yönetim merkezi ve kalıtım materyalinin bulunduğu kısım neresidir?", secenekler: ["Çekirdek", "Sitoplazma", "Hücre Zarı", "Koful"], dogru: 0 },
        { soru: "Protein sentezinden sorumlu en küçük organel hangisidir?", secenekler: ["Ribozom", "Mitokondri", "Lizozom", "Kloroplast"], dogru: 0 },
        { soru: "Hücre içi sindirimden sorumlu, yaşlanmış organelleri yok eden organel hangisidir?", secenekler: ["Lizozom", "Ribozom", "Koful", "Endoplazmik Retikulum"], dogru: 0 },
        { soru: "Madde iletimi ve taşınmasında görevli kanalcık sistemi olan organel hangisidir?", secenekler: ["Endoplazmik Retikulum", "Mitokondri", "Kloroplast", "Çekirdekçik"], dogru: 0 },
        { soru: "Salgı üretimi ve paketlenmesinden sorumlu organel hangisidir?", secenekler: ["Golgi Cihazı", "Ribozom", "Lizozom", "Mitokondri"], dogru: 0 },
        { soru: "Bitki hücresinde kofullar nasıldır?", secenekler: ["Büyük ve az sayıdadır", "Küçük ve çok sayıdadır", "Hiç yoktur", "Değişken değildir"], dogru: 0 },
        { soru: "Hayvan hücresinde kofullar nasıldır?", secenekler: ["Küçük ve çok sayıdadır", "Büyük ve tektir", "Yoktur", "Dev boyuttadır"], dogru: 0 },
        { soru: "Hücreyi dış ortamdan ayıran, seçici geçirgen canlı yapı hangisidir?", secenekler: ["Hücre Zarı", "Hücre Duvarı", "Kapsül", "Kabuk"], dogru: 0 },
        { soru: "Bitki hücresinin şeklinin köşeli olmasını sağlayan yapı nedir?", secenekler: ["Hücre Duvarı (Çeper)", "Hücre Zarı", "Sitoplazma", "Çekirdek"], dogru: 0 },
        { soru: "Yumurta hücresi hangi şekle sahiptir?", secenekler: ["Küresel", "Yıldız", "Lifli", "Çokgen"], dogru: 0 },
        { soru: "Sinir hücresi hangi yapıdadır?", secenekler: ["Uzantılı ve lifli", "Küp şeklinde", "Yuvarlak", "Basık"], dogru: 0 },
        { soru: "Kas hücresi nasıldır?", secenekler: ["Uzun ve esnek (kasılıp gevşeme)", "Yuvarlak", "Hareketsiz", "Sabit"], dogru: 0 },
        { soru: "Canlıların temel yapı birimi nedir?", secenekler: ["Hücre", "Doku", "Organ", "Sistem"], dogru: 0 },
        { soru: "Hücrenin su, besin ve atık maddelerini depolayan kese şeklindeki yapı nedir?", secenekler: ["Koful", "Mitokondri", "Ribozom", "Lizozom"], dogru: 0 },
        { soru: "Fotosentez yaparak besin ve oksijen üreten organel hangisidir?", secenekler: ["Kloroplast", "Mitokondri", "Ribozom", "Koful"], dogru: 0 },
        { soru: "Kloroplast hangi renk pigmentini taşır?", secenekler: ["Klorofil (Yeşil)", "Karoten", "antosiyanin", "Melanin"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi hayvansal hücrede bulunur ama bitkisel hücrede bulunmaz?", secenekler: ["Sentriyoller (Sentrozom)", "Kloroplast", "Hücre Duvarı", "Kalın çeper"], dogru: 0 },
        { soru: "Hücre içi akışkan, yumurta akı kıvamındaki sıvıya ne denir?", secenekler: ["Sitoplazma", "Çekirdek suyu", "Kan", "Lenf"], dogru: 0 },
        { soru: "Mikroskop ilk defa hücreyi incelemek için kim tarafından kullanılmıştır?", secenekler: ["Robert Hooke", "Newton", "Einstein", "Darwin"], dogru: 0 },
        { soru: "Hücre teorisine göre aşağıdakilerden hangisi yanlıştır?", secenekler: ["Tüm hücreler yoktan var olur", "Tüm canlılar hücrelerden oluşur", "Hücreler canlılığın temel birimidir", "Yeni hücreler eski hücrelerin bölünmesiyle oluşur"], dogru: 0 },
        { soru: "Aşağıdakilerden hangisi tek hücreli bir canlıdır?", secenekler: ["Amip / Öglena / Paramesyum", "Kedi", "Ağaç", "Mantar"], dogru: 0 },
        { soru: "Çok hücreli bir canlı örneği hangisidir?", secenekler: ["İnsan", "Amip", "Bakteri", "Öglena"], dogru: 0 },
        { soru: "Hücreden organa doğru giden sıralama nasıldır?", secenekler: ["Hücre -> Doku -> Organ -> Sistem -> Organizma", "Organ -> Hücre -> Doku", "Sistem -> Organ -> Hücre", "Hiçbiri"], dogru: 0 },
        { soru: "Aynı görevi yapan hücrelerin birleşmesiyle ne oluşur?", secenekler: ["Doku", "Organ", "Sistem", "Organizma"], dogru: 0 },
        { soru: "Farklı dokuların bir araya gelmesiyle ne oluşur?", secenekler: ["Organ", "Doku", "Hücre", "Sitoplazma"], dogru: 0 },
        { soru: "Organların bir araya gelerek belirli bir hayatsal faaliyeti yürütmesine ne denir?", secenekler: ["Sistem", "Doku", "Hücre", "Çekirdekçik"], dogru: 0 },
        { soru: "Aşağıdaki organellerden hangisi zarsızdır?", secenekler: ["Ribozom", "Mitokondri", "Koful", "Golgi"], dogru: 0 },
        { soru: "Çift zarla çevrili organeller hangileridir?", secenekler: ["Mitokondri ve Kloroplast", "Ribozom ve Koful", "Lizozom", "Endoplazmik retikulum"], dogru: 0 },
        { soru: "Hücre zarının temel özelliği nedir?", secenekler: ["Canlı, esnek ve seçici geçirgen", "Ölü ve sert", "Geçirgen olmayan", "Deliksiz"], dogru: 0 },
        { soru: "Kloroplast bitkinin hangi kısımlarında daha çok bulunur?",secenekler: ["Yeşil yapraklarda", "Köklerde", "Gövdenin kabuğunda", "Tohumda"], dogru: 0 },
        { soru: "Bitkilerde kloroplast dışında renk veren plastitler hangileridir?", secenekler: ["Kromoplast ve Lökoplast", "Mitokondri", "Ribozom", "Koful"], dogru: 0 },
        { soru: "Lökoplast ne renk maddesiz plastittir ve ne depolar?", secenekler: ["Renksizdir, nişasta depolar", "Yeşildir", "Kırmızıdır", "Mavidir"], dogru: 0 },
        { soru: "Kromoplast bitkilerde hangi kısımlara renk verir?", secenekler: ["Çiçek ve meyvelere", "Kök sistemine", "Toprak altı gövdeye", "Damarlara"], dogru: 0 },
        { soru: "Hücre bölünmesinde iğ ipliklerini oluşturan hayvan hücreli organel nedir?", secenekler: ["Sentrozom", "Ribozom", "Golgi", "Mitokondri"], dogru: 0 },
        { soru: "Bitki hücrelerinde sentrozom var mıdır?", secenekler: ["Yoktur (gelişmiş bitkilerde)", "Vardır", "Çok fazladır", "Değişkendir"], dogru: 0 },
        { soru: "Çekirdeğin içinde bulunan ve kalıtım moleküllerini (DNA) taşıyan ipliksi yapılara ne denir?", secenekler: ["Kromozom", "Ribozom", "Mitokondri", "Koful"], dogru: 0 },
        { soru: "İnsan vücudundaki normal bir hücrede kaç kromozom bulunur?", secenekler: ["46", "23", "32", "78"], dogru: 0 },
        { soru: "Aşağıdaki canlılardan hangisinin kromozom sayısı insandan fazla olabilir?", secenekler: ["Moli balığı / Eğrelti otu", "Bakteri", "Virüs", "Amip"], dogru: 0 },
        { soru: "Kromozomun temel yapı taşı olan ve kalıtsal bilgileri taşıyan molekül nedir?", secenekler: ["DNA", "RNA", "Protein", "Su"], dogru: 0 },
        { soru: "DNA'nın yapı birimlerine ne denir?", secenekler: ["Nükleotid", "Aminoasit", "Glikoz", "Yağ asidi"], dogru: 0 },
        { soru: "Hücre zarındaki geçişleri kontrol eden 'seçici geçirgen' özellik ne anlama gelir?", secenekler: ["Bazı maddeleri geçirip bazılarını geçirmemesi", "Her şeyi içeri alması", "Hiçbir şey geçirmemesi", "Sadece suyu alması"], dogru: 0 },
        { soru: "Bitki hücrelerinde hücre çeperinin yapısında hangi madde bulunur?", secenekler: ["Selüloz", "Kitin", "Peptidoglikan", "Protein"], dogru: 0 },
        { soru: "Mantar hücrelerinin çeperinde hangi madde bulunur?", secenekler: ["Kitin", "Selüloz", "Nişasta", "Glikojen"], dogru: 0 },
        { soru: "Hücre içi maddelerin taşınmasında paketleme yapan organelin salgı ürettiği bilindiğine göre en çok hangi organda bulunur?", secenekler: ["Tükürük bezi / Gözyaşı bezi (Glandüler dokular)", "Kas", "Kemik", "Kıkırdak"], dogru: 0 },
        { soru: "Enerji ihtiyacının çok fazla olduğu kas ve karaciğer hücrelerinde hangi organel sayıca fazladır?", secenekler: ["Mitokondri", "Ribozom", "Koful", "Lizozom"], dogru: 0 },
        { soru: "Bitkilerde fotosentez yapılmayan kök hücrelerinde hangi plastit bulunur?", secenekler: ["Lökoplast", "Kloroplast", "Kromoplast", "Hiçbiri"], dogru: 0 },
        { soru: "Hücreler neden küçük kalır, büyüyemezler?", secenekler: ["Yüzey/hacim oranının bozulması ve çekirdeğin hücreyi yönetmekte zorlanması", "Doydukları için", "Enerjileri bittiği için", "Yer kalmadığı için"], dogru: 0 },
        { soru: "Gelişmiş yapılı çok hücreli canlıların hücre sıralaması en küçükten en büyüğe hangisidir?", secenekler: ["Hücre-Doku-Organ-Sistem-Organizma", "Organizma-Sistem-Organ", "Doku-Hücre-Organ", "Hücre-Organ-Doku"], dogru: 0 }
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
            
            /* Skin Seçim Alanı */
            .skinSecimAlani { display: flex; justify-content: space-around; margin: 12px 0; }
            .skinKutusu { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #334155; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: 0.2s; }
            .skinKutusu.secili { border-color: #2ed573; transform: scale(1.1); box-shadow: 0 0 10px #2ed573; }
            
            #oyunKutusu { display: none; width: 100vw; height: 100vh; position: relative; }
            canvas { display: block; background: #1e293b; }
            #arayuzOverlay { position: absolute; top: 20px; left: 20px; pointer-events: none; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            
            #soruModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 30px; border-radius: 15px; border: 2px solid #6366f1; z-index: 100; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(99,102,241,0.5); }
            .secenekBtn { background: #334155; margin: 8px 0; padding: 12px; width: 100%; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; transition: 0.2s; pointer-events: auto; }
            .secenekBtn:hover { background: #475569; }

            /* Admin Paneli */
            #adminPaneli { display: none; position: absolute; top: 20px; right: 20px; background: rgba(15, 23, 42, 0.9); border: 2px solid #f43f5e; padding: 15px; border-radius: 10px; z-index: 50; width: 220px; pointer-events: auto; }
            #adminPaneli h4 { margin: 0 0 10px 0; color: #f43f5e; text-align: center; }
            .adminBtn { background: #f43f5e; margin: 4px 0; padding: 8px; font-size: 13px; }
            .adminBtn:hover { background: #e11d48; }

            /* Oyun Bitti Ekranı */
            #bittiModal { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.95); padding: 40px; border-radius: 15px; border: 2px solid #2ed573; z-index: 200; width: 400px; text-align: center; }

            #chatKutusu { position: absolute; bottom: 20px; left: 20px; width: 320px; height: 180px; background: rgba(15, 23, 42, 0.75); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; pointer-events: auto; }
            #chatGirdiAlani { flex: 1; overflow-y: auto; padding: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
            #chatInput { width: 100%; border: none; background: rgba(0,0,0,0.4); color: white; padding: 8px; box-sizing: border-box; outline: none; margin: 0; }
        </style>
    </head>
    <body>

        <!-- Giriş ve Skin Seçim Ekranı -->
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

        <!-- Oyun Ekranı -->
        <div id="oyunKutusu">
            <canvas id="oyunCanvas"></canvas>
            <div id="arayuzOverlay">
                <div>🏆 Skor: <span id="skorYazisi">0</span></div>
                <div>❤️ Can: <span id="canYazisi">100</span></div>
                <div>⏳ Süre: <span id="sureYazisi">05:00</span></div>
            </div>

            <!-- Admin Kontrol Paneli (Admin şifresi: 'fenadmin') -->
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

        <!-- Soru Modalı -->
        <div id="soruModal">
            <h3 id="soruMetni" style="color: #f8fafc; margin-top: 0;">Soru Yükleniyor...</h3>
            <div id="seceneklerAlani"></div>
        </div>

        <!-- Oyun Bitti / Yeniden Oyna Modalı -->
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
                    document.getElementById('kazananYazisi.innerHTML') = '🏆 Kazanan: <b>' + veri.kazananIsim + '</b> (' + veri.kazananSkor + ' Puan)';
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

            // --- CANVAS ÇİZİM DÖNGÜSÜ ---
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

// --- SOCKET.IO OYUN MANTIĞI VE SUNUCU LOOP ---
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

// --- ANA OYUN GÜNCELLEME DÖNGÜSÜ (SERVER TICK) ---
setInterval(() => {
    kalanMacSuresi--;
    if (kalanMacSuresi <= 0) {
        // En yüksek skora sahip oyuncuyu bul
        let en YuksekSkor = -1;
        let kazananIsim = "Kimse";
        for (let id in aktifOyuncular) {
            if (aktifOyuncular[id].skor > enYuksekSkor) {
                enYuksekSkor = aktifOyuncular[id].skor;
                kazananIsim = aktifOyuncular[id].isim;
            }
        }
        io.emit('macBitti', { kazananIsim: kazananIsim, kazananSkor: enYuksekSkor });
        kalanMacSuresi = 300; // Süreyi sıfırla
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
