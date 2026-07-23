// ==========================================
// FEN BİLİMLERİ TURNUVA OYUNU - TAM KOD
// ==========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// --- HARİTA VE DUVARLAR ---
const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 1500;

const DUVARLAR = [
    { x: 300, y: 200, w: 400, h: 40 },
    { x: 800, y: 500, w: 40, h: 500 },
    { x: 1200, y: 300, w: 500, h: 40 },
    { x: 400, y: 1000, w: 600, h: 40 },
    { x: 1400, y: 900, w: 40, h: 400 }
];

const BOLGELER = [
    { x: 0, y: 0, w: 1000, h: 750, isim: "MAVİ BÖLGE", renk: "rgba(0, 150, 255, 0.12)", yaziRengi: "#00a8ff" },
    { x: 1000, y: 0, w: 1000, h: 750, isim: "TURUNCU BÖLGE", renk: "rgba(255, 150, 0, 0.12)", yaziRengi: "#ff9f43" },
    { x: 0, y: 750, w: 1000, h: 750, isim: "YEŞİL BÖLGE", renk: "rgba(46, 213, 115, 0.12)", yaziRengi: "#2ed573" },
    { x: 1000, y: 750, w: 1000, h: 750, isim: "SİYAH ÜS", renk: "rgba(30, 30, 30, 0.35)", yaziRengi: "#a4b0be" }
];

let chestler = [
    { id: 1, x: 400, y: 400, aktif: true },
    { id: 2, x: 1000, y: 700, aktif: true },
    { id: 3, x: 1500, y: 500, aktif: true },
    { id: 4, x: 600, y: 1200, aktif: true },
    { id: 5, x: 1600, y: 1100, aktif: true }
];

const SORU_HAVUZU = {
  "unite1": [
    { soru: "Yıldızların doğduğu, gaz ve toz bulutlarının yoğun olduğu bölgelere ne ad verilir?", secenekler: ["A) Galaksi", "B) Bulutsu (Nebula)", "C) Süpernova", "D) Karadelik"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi bir bulutsu (nebula) örneğidir?", secenekler: ["A) Samanyolu", "B) Andromeda", "C) Yengeç Bulutsusu", "D) Sirius"], cevap: 2 },
    { soru: "Yıldızlar yaşamlarının sonunda kütlelerine göre farklı evrelere ayrılırlar. Güneş'ten çok büyük kütleli yıldızlar ömürlerinin sonunda neye dönüşürler?", secenekler: ["A) Beyaz Cüce", "B) Karadelik veya Nötron Yıldızı", "C) Gezegen", "D) Akımtı Bulutsusu"], cevap: 1 },
    { soru: "Dünya'nın da içinde bulunduğu, çubuklu sarmal yapısındaki galaksi hangisidir?", secenekler: ["A) Andromeda", "B) Samanyolu", "C) Sombrero", "D) Büyük Macellan"], cevap: 1 },
    { soru: "Işığın bile çekim kuvvetinden kaçamadığı, çok büyük kütleli uzay cisimlerine ne denir?", secenekler: ["A) Pulsar", "B) Karadelik", "C) Kuasar", "D) Beyaz Cüce"], cevap: 1 },
    { soru: "Aşağıdaki gök cisimlerinden hangisi evrendeki en büyük yapısal birimdir?", secenekler: ["A) Yıldız", "B) Gezegen sistemi", "C) Galaksi (Gökada)", "D) Bulutsu"], cevap: 2 },
    { soru: "Yıldızların doğuşu, gelişimi ve ölüm sürecini inceleyen bilim dalı veya kavram aşağıdakilerden hangisiyle ilgilidir?", secenekler: ["A) Yıldız Oluşum Süreci (Yıldız Yaşam Döngüsü)", "B) Astroloji", "C) Meteoroloji", "D) Sismoloji"], cevap: 0 },
    { soru: "Güneş'in yapısında en çok bulunan elementler sırasıyla hangileridir?", secenekler: ["A) Oksijen - Azot", "B) Hidrojen - Helyum", "C) Demir - Nikel", "D) Karbon - Hidrojen"], cevap: 1 },
    { soru: "Samanyolu galaksisine en yakın büyük komşu galaksi hangisidir?", secenekler: ["A) Küçük Macellan", "B) Andromeda", "C) Sombrero", "D) Girdap"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi gök cisimleri arasındaki uzaklıkları ifade etmek için kullanılan birimdir?", secenekler: ["A) Kilometre", "B) Işık yılı", "C) Mil", "D) Metre"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi bir ışık yılı tanımıdır?", secenekler: ["A) Işığın bir yılda aldığı yol", "B) Güneş ile Dünya arasındaki mesafe", "C) Dünyanın kendi etrafındaki dönüş süresi", "D) Bir yıldızın ömrü"], cevap: 0 },
    { soru: "Karasal gezegenler ile gazsal gezegenleri birbirinden ayıran kuşak hangisidir?", secenekler: ["A) Kuiper Kuşağı", "B) Asteroid Kuşağı", "C) Oort Bulutu", "D) Meteor Kuşağı"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi Güneş sistemindeki iç (karasal) gezegenlerden biridir?", secenekler: ["A) Jüpiter", "B) Satürn", "C) Mars", "D) Neptün"], cevap: 2 },
    { soru: "Aşağıdakilerden hangisi dış (gazsal) gezegenlerin ortak özelliklerinden biri değildir?", secenekler: ["A) Halka sistemlerinin olması", "B) Yüzeylerinin katı taşlardan oluşması", "C) Büyük yapılı olmaları", "D) Çoğunun uydusunun fazla olması"], cevap: 1 },
    { soru: "Hangi gezegen diğerlerinden farklı yönde (doğudan batıya) döner?", secenekler: ["A) Dünya", "B) Venüs", "C) Mars", "D) Jüpiter"], cevap: 1 },
    { soru: "Uydusu ve halkası olmayan, güneşe en yakın gezegen hangisidir?", secenekler: ["A) Merkür", "B) Venüs", "C) Mars", "D) Dünya"], cevap: 0 },
    { soru: "Halkası en belirgin ve büyük olan gaz dev gezegen hangisidir?", secenekler: ["A) Jüpiter", "B) Satürn", "C) Uranüs", "D) Neptün"], cevap: 1 },
    { soru: "Güneş sisteminin en büyük gezegeni aşağıdakilerden hangisidir?", secenekler: ["A) Satürn", "B) Jüpiter", "C) Neptün", "D) Dünya"], cevap: 1 },
    { soru: "Atmosferindeki gazlar (özellikle metan) nedeniyle mavimsi yeşil renkte görünen ve varil gibi yuvarlanarak dönen gezegen hangisidir?", secenekler: ["A) Mars", "B) Uranüs", "C) Venüs", "D) Satürn"], cevap: 1 },
    { soru: "Güneş'e en uzak olan gezegen hangisidir?", secenekler: ["A) Uranüs", "B) Neptün", "C) Satürn", "D) Jüpiter"], cevap: 1 },
    { soru: "Halk arasında 'Çoban Yıldızı' olarak bilinen gezegen aslında hangisidir?", secenekler: ["A) Mars", "B) Venüs", "C) Merkür", "D) Jüpiter"], cevap: 1 },
    { soru: "Kızıl Gezegen olarak bilinen, yüzeyinde demir oksit bulunan gezegen hangisidir?", secenekler: ["A) Merkür", "B) Mars", "C) Jüpiter", "D) Satürn"], cevap: 1 },
    { soru: "Atmosferi çok kalın olduğu için Güneş sisteminin en sıcak gezegeni olan gök cismi hangisidir?", secenekler: ["A) Merkür", "B) Venüs", "C) Güneş", "D) Mars"], cevap: 1 },
    { soru: "Gök cisimlerini incelemek, uzaya uydu göndermek ve bilgi toplamak amacıyla kurulan yerleşkelere ne denir?", secenekler: ["A) Gözlemevi (Rasadhane)", "B) Laboratuvar", "C) Planetaryum", "D) Sergi salonu"], cevap: 0 },
    { soru: "Gözlemevleri kurulurken aşağıdakilerden hangisine dikkat edilmez?", secenekler: ["A) Bulutsuz gece sayısının fazla olmasına", "B) Işık kirliliğinden uzak olmasına", "C) Şehir merkezlerine çok yakın ve kalabalık yerlere kurulmasına", "D) Deniz seviyesinden yüksek yerlerde olmasına"], cevap: 2 },
    { soru: "Aşağıdakilerden hangisi ışık kirliliğinin olumsuz sonuçlarından biri değildir?", secenekler: ["A) Gökyüzündeki yıldızların net görünmesini engeller.", "B) Göçmen kuşların yönlerini şaşırmasına neden olur.", "C) Gözlemevlerinin çalışmalarını olumsuz etkiler.", "D) Enerji tasarrufu sağlar."], cevap: 3 },
    { soru: "Uzay araştırmalarında kullanılan ilk yapay uydu hangisidir?", secenekler: ["A) Hubble", "B) Sputnik 1", "C) Türksat 4A", "D) Voyager 1"], cevap: 1 },
    { soru: "Türkiye'nin aktif haberleşme uydularından biri aşağıdakilerden hangisidir?", secenekler: ["A) Göktürk-2", "B) Türksat 3A", "C) Rasat", "D) Bilsat"], cevap: 1 },
    { soru: "Türkiye'nin gözlem amaçlı (yerleşke ve harita) uydularından biri hangisidir?", secenekler: ["A) Türksat 4B", "B) Göktürk", "C) Sputnik", "D) Hubble"], cevap: 1 },
    { soru: "Uzayda görev yapan ve halen Dünya etrafında dönen en ünlü uzay teleskobu hangisidir?", secenekler: ["A) James Webb", "B) Hubble", "C) Kepler", "D) Spitzer"], cevap: 1 },
    { soru: "Uyduların veya uzay araçlarının görevleri bittiğinde uzayda bırakılması sonucunda oluşan ve tehlike yaratan duruma ne denir?", secenekler: ["A) Işık kirliliği", "B) Uzay kirliliği", "C) Hava kirliliği", "D) Ses kirliliği"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi uzay kirliliğine neden olur?", secenekler: ["A) İşlevini yitirmiş uydular", "B) Roket kalıntıları", "C) Yakıt tankları", "D) Hepsi"], cevap: 3 },
    { soru: "Yıldızların ömrünün son evresinde büyük bir patlamayla parlaması olayına ne denir?", secenekler: ["A) Süpernova", "B) Nebula", "C) Bulutsu", "D) Karadelik"], cevap: 0 },
    { soru: "Güneş'in orta büyüklükte bir yıldız olduğu bilinmektedir. Güneş'in ömrünün sonunda dönüşeceği yapı hangisidir?", secenekler: ["A) Karadelik", "B) Beyaz Cüce", "C) Nötron yıldızı", "D) Süpernova"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi bir takımyıldız örneğidir?", secenekler: ["A) Samanyolu", "B) Büyük Ayı", "C) Andromeda", "D) Güneş Sistemi"], cevap: 1 },
    { soru: "Aşağıdaki gök cisimlerinden hangisi ısı ve ışık yayar?", secenekler: ["A) Gezegen", "B) Uydu", "C) Yıldız", "D) Asteroit"], cevap: 2 },
    { soru: "Gezegenler yıldızlar gibi parlamazlar. Gezegenlerin parlak görünmesinin temel nedeni nedir?", secenekler: ["A) Kendi ışıklarını üretmeleri", "B) Güneş'ten aldıkları ışığı yansıtmaları", "C) Çok sıcak olmaları", "D) Sürtünmeden dolayı yanmaları"], cevap: 1 },
    { soru: "Atmosfere giren gök taşlarının sürtünme etkisiyle yanarak ışık saçması olayına ne ad verilir?", secenekler: ["A) Meteor (Yıldız kayması)", "B) Asteroit", "C) Kometa", "D) Süpernova"], cevap: 0 },
    { soru: "Meteorların yeryüzüne düşerek oluşturduğu çukurlara ne denir?", secenekler: ["A) Krater", "B) Vadi", "C) Fay", "D) Kanyon"], cevap: 0 },
    { soru: "Yeryüzüne düşebilen gök taşlarına ne ad verilir?", secenekler: ["A) Meteorit", "B) Uydu", "C) Yıldız", "D) Kuyruklu yıldız"], cevap: 0 },
    { soru: "Yapılarında bol miktarda buz, toz ve gaz bulunduran, güneş etrafındaki yörüngeleri çok uzun olan gök cisimlerine ne denir?", secenekler: ["A) Kuyruklu yıldız", "B) İç gezegen", "C) Karadelik", "D) Takımyıldız"], cevap: 0 },
    { soru: "Ünlü Halley kuyruklu yıldızı yaklaşık kaç yılda bir dünyadan gözlemlenebilir?", secenekler: ["A) 25 yıl", "B) 76 yıl", "C) 100 yıl", "D) 500 yıl"], cevap: 1 },
    { soru: "Aşağıdakilerden hangisi teleskop çeşitlerinden biri değildir?", secenekler: ["A) Mercekli teleskop", "B) Aynalı teleskop", "C) Radyo teleskop", "D) Manyetik teleskop"], cevap: 3 },
    { soru: "İlk defa gökyüzü incelemesi için teleskobu kullanan ünlü bilim insanı kimdir?", secenekler: ["A) Isaac Newton", "B) Galileo Galilei", "C) Albert Einstein", "D) Nicolaus Copernicus"], cevap: 1 },
    { soru: "Uzay istasyonlarında (UAS gibi) astronotların yaşaması ve araştırma yapması hangi amaçla desteklenir?", secenekler: ["A) Uzayda yerleşim imkanlarını ve insan fizyolojisini incelemek", "B) Sadece tatil yapmak", "C) Maden aramak", "D) Yıldız satmak"], cevap: 0 },
    { soru: "Güneş sistemindeki en büyük dağ (Olympus Mons) hangi gezegende yer alır?", secenekler: ["A) Dünya", "B) Mars", "C) Venüs", "D) Jüpiter"], cevap: 1 },
    { soru: "Güneş sistemindeki en büyük uydu olan Ganymede hangi gezegenin etrafında döner?", secenekler: ["A) Satürn", "B) Jüpiter", "C) Neptün", "D) Uranüs"], cevap: 1 },
    { soru: "Evrenin oluşumu ile ilgili en kabul gören teori hangisidir?", secenekler: ["A) Büyük Patlama (Big Bang)", "B) Sabit Durum", "C) Çarpışan Evrenler", "D) Büzülme Teorisi"], cevap: 0 },
    { soru: "Samanyolu galaksisinin şekli nasıldır?", secenekler: ["A) Eliptik", "B) Çubuklu sarmal", "C) Düzensiz", "D) Küresel"], cevap: 1 },
    { soru: "Yıldızların sıcaklıklarına göre renkleri farklılık gösterir. En sıcak yıldızlar hangi renkte görünür?", secenekler: ["A) Kırmızı", "B) Sarı", "C) Mavi veya Beyaz", "D) Turuncu"], cevap: 2 }
  ],
  "unite2": [
    { soru: "Vücut hücrelerinin oluşmasını ve büyümesini sağlayan hücre bölünmesi çeşidi hangisidir?", secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Eşeyli üreme"], cevap: 1 },
    { soru: "Mayoz bölünme sonucunda bir hücreden kaç yeni hücre oluşur?", secenekler: ["A) 1", "B) 2", "C) 4", "D) 8"], cevap: 2 },
    { soru: "İnsanlarda üreme hücrelerinin (sperm ve yumurta) kromozom sayısı kaça düşer?", secenekler: ["A) 46", "B) 23", "C) 92", "D) 12"], cevap: 1 },
    { soru: "Mitoz bölünme ile ilgili aşağıdakilerden hangisi yanlıştır?", secenekler: ["A) Oluşan hücrelerin kalıtsal özellikleri birbirinin aynısıdır.", "B) Çok hücreli canlılarda büyüme, gelişme ve onarımı sağlar.", "C) Kromozom sayısı yarıya iner.", "D) Tek hücrelilerde üremeyi sağlar."], cevap: 2 },
    { soru: "Mayoz bölünme sırasında gerçekleşen ve canlılarda çeşitliliği (farklılığı) sağlayan en önemli olay nedir?", secenekler: ["A) Sitoplazma bölünmesi", "B) Kromozom sayısının yarıya inmesi", "C) Parça değişimi (Krossing-over)", "D) DNA'nın kendini eşlemesi"], cevap: 2 },
    { soru: "Aşağıdaki canlılardan hangisinde mitoz bölünme üremeyi (çoğalmayı) sağlar?", secenekler: ["A) İnsan", "B) Amip (Tek hücreli)", "C) Kedi", "D) Çam ağacı"], cevap: 1 },
    { soru: "Hücre bölünmesi öncesinde DNA'nın kendini kopyalayarak miktarını iki katına çıkarmasına ne denir?", secenekler: ["A) Mutasyon", "B) DNA Eşlenmesi (Replikasyon)", "C) Krossing-over", "D) Mayoz"], cevap: 1 },
    { soru: "Kırılan kemiklerin zamanla kaynaması ve onarılması hangi olay sayesinde gerçekleşir?", secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Fotosentez"], cevap: 1 },
    { soru: "Mayoz bölünme hangi hücrelerde gerçekleşir?", secenekler: ["A) Vücut hücreleri", "B) Sadece sinir hücreleri", "C) Üreme ana hücreleri", "D) Deri hücreleri"], cevap: 2 },
    { soru: "2n = 40 kromozomlu bir hayvan hücresi art arda 2 kez mitoz geçirdiğinde oluşacak son hücrelerin kromozom sayısı kaç olur?", secenekler: ["A) 10", "B) 20", "C) 40", "D) 80"], cevap: 2 },
    { soru: "n = 15 kromozomlu üreme ana hücresi mayoz geçirdiğinde oluşan yeni hücrelerin kromozom sayısı kaç olur?", secenekler: ["A) 30", "B) 15", "C) 7.5", "D) 60"], cevap: 1 },
    { soru: "Bitki ve hayvan hücrelerinin mitoz bölünmesi arasındaki en belirgin fark aşağıdakilerden hangisidir?", secenekler: ["A) DNA'nın kendini eşlemesi", "B) Ara lamel (akut plaka) oluşumu ve boğumlanma", "C) Çekirdek zarının erimesi", "D) İğ ipliklerinin oluşması"], cevap: 1 },
    { soru: "Hücrenin hayat döngüsünde bölünme öncesi hazırlık evresinde en önemli olay hangisidir?", secenekler: ["A) DNA'nın kendini eşlemesi", "B) Hücrenin küçülmesi", "C) Çekirdeğin yok olması", "D) Organellerin ölmesi"], cevap: 0 },
    { soru: "İnsan vücudunda aşağıdaki hücrelerden hangisi mitoz bölünme geçiremez?", secenekler: ["A) Deri hücresi", "B) Karaciğer hücresi", "C) Olgun al yuvar ve sinir hücreleri", "D) Kas hücresi"], cevap: 2 },
    { soru: "Mayoz bölünme kaç aşamada (safhada) gerçekleşir?", secenekler: ["A) Sadece Mayoz 1", "B) Mayoz 1 ve Mayoz 2", "C) Tek aşamalı", "D) 4 aşamalı mitoz"], cevap: 1 },
    { soru: "Mayoz bölünme sonucunda oluşan hücrelerin özellikleri nasıldır?", secenekler: ["A) Kalıtsal yapıları birbirinden farklıdır ve n kromozomludur.", "B) Kalıtsal yapıları tamamen aynıdır ve 2n kromozomludur.", "C) Hepsi erkektir.", "D) Büyüme sağlarlar."], cevap: 0 },
    { soru: "Aşağıdakilerden hangisi mitoz bölünmenin özelliklerinden biridir?", secenekler: ["A) Tür içi genetik çeşitliliği sağlar.", "B) Tek hücrelilerde üremeyi, çok hücrelilerde büyüme ve onarımı sağlar.", "C) Mayozdan daha uzun sürer.", "D) Parça değişimi gerçekleşir."], cevap: 1 },
    { soru: "Embriyonun gelişerek bebeği oluşturması hangi hücre bölünmesi ile gerçekleşir?", secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Krossing-over"], cevap: 1 },
    { soru: "Yaralanan bir derinin eski haline gelmesi süreci hangi olaylarla açıklanır?", secenekler: ["A) Deri hücrelerinin mitoz bölünme ile çoğalması", "B) Mayoz bölünme ile üreme hücrelerinin oluşması", "C) Hücrelerin su kaybetmesi", "D) DNA mutasyonu"], cevap: 0 },
    { soru: "Çiçekli bir bitkide sperm (polen) ve yumurta hücrelerinin oluşumu hangi bölünmeyle sağlanır?", secenekler: ["A) Mitoz", "B) Mayoz", "C) Replikasyon", "D) Binar bölüme"], cevap: 1 },
    { soru: "Aşağıdaki canlılardan hangisi mitoz bölünmeyle (veya tomurcuklanma/rejenarasyon gibi mitoz temelli olaylarla) üreyebilir?", secenekler: ["A) Denizyıldızı", "B) İnsan", "C) Kartal", "D) İnek"], cevap: 0 },
    { soru: "Bir canlı türünün nesiller boyunca kromozom sayısının sabit kalmasını sağlayan temel olaylar ikilisi hangisidir?", secenekler: ["A) Mitoz ve Mutasyon", "B) Mayoz ve Döllenme", "C) Fotosentez ve Solunum", "D) Sindirim ve Boşaltım"], cevap: 1 },
    { soru: "Hücrede kalıtsal bilgileri taşıyan, DNA ve özel proteinlerin birleşmesiyle oluşan yapılara ne denir?", secenekler: ["A) Kromozom", "B) Ribozom", "C) Koful", "D) Mitokondri"], cevap: 0 },
    { soru: "Aşağıdaki ifadelerden hangisi doğrudur?", secenekler: ["A) Bütün sağlıklı insanların vücut hücrelerinde 46 kromozom bulunur.", "B) Kromozom sayısı ile canlının gelişmişliği arasında doğrudan ilişki vardır.", "C) Kedi ile insanın kromozom sayısı her zaman aynıdır.", "D) Mayoz geçiren bir hücrenin kromozom sayısı artar."], cevap: 0 },
    { soru: "Mayoz 1'in başında homologous kromozomların yan yana gelmesiyle kardeş olmayan kromatitlerin parça değiştirmesine ne denir?", secenekler: ["A) Krossing-over (Parça değişimi)", "B) Klonlama", "C) Mayozlama", "D) Sitokinez"], cevap: 0 },
    { soru: "Mitoz bölünmede çekirdek bölünmesinden hemen sonra ne gerçekleşir?", secenekler: ["A) Sitoplazma bölünmesi (Sitokinez)", "B) Mayoz 2", "C) Döllenme", "D) DNA eşlenmesi"], cevap: 0 },
    { soru: "Bitki hücrelerinde sitoplazma bölünmesi sırasında boğumlanma olmaz, bunun yerine ne oluşur?", secenekler: ["A) Ara lamel (orta lamel)", "B) Çift zar", "C) Hücre duvarı erimesi", "D) Koful patlaması"], cevap: 0 },
    { soru: "Hayvan hücrelerinde sitoplazma bölünmesi nasıl gerçekleşir?", secenekler: ["A) Dıştan içe doğru boğumlanarak", "B) Ara lamel oluşarak", "C) Patlayarak", "D) Bölünmeyerek"], cevap: 0 },
    { soru: "Aşağıdakilerden hangisi hücrenin bölünme gerekçelerinden biri değildir?", secenekler: ["A) Hücrenin yüzey/hacim oranının bozulması ve besin alışverişinde zorlanması", "B) Hücrenin çok büyümesi", "C) DNA'nın çekirdeği yönetmekte zorlanması", "D) Hücrenin ölümsüzleşmek istemesi"], cevap: 3 },
    { soru: "Tek hücreli canlılarda (örneğin parazit veya bakterilerde) mitoz benzeri bölünmeler neyi sağlar?", secenekler: ["A) Üremeyi (çoğalmayı)", "B) Sindirimi", "C) Doku onarımını", "D) Çeşitliliği"], cevap: 0 },
    { soru: "Mayoz bölünme sonucunda oluşan 4 hücrenin özellikleri nasıldır?", secenekler: ["A) Birbirinden farklı 4 yeni hücre", "B) Birbirinin aynısı 4 hücre", "C) 2 büyük 2 küçük hücre", "D) 4 tane 2n hücre"], cevap: 0 },
    { soru: "Aşağıdaki canlıların hangisinde üreme hücreleri mayozla oluşmaz?", secenekler: ["A) Bakteri (Tek hücreli prokaryot)", "B) İnsan", "C) Kuş", "D) Eğrelti otu"], cevap: 0 },
    { soru: "Kromozom sayısı 2n = 70 olan bir bitki hücresi 3 kez mitoz geçirirse, oluşan toplam hücre sayısı kaç olur?", secenekler: ["A) 6", "B) 8", "C) 16", "D) 32"], cevap: 1 },
    { soru: "Mayoz bölünmede kromozom sayısının yarıya indiği evre hangisidir?", secenekler: ["A) Mayoz 1", "B) Mayoz 2", "C) İnterfaz", "D) Sitokinez 2"], cevap: 0 },
    { soru: "Mayoz 2'nin temel olarak hangi olaya benzediği söylenir?", secenekler: ["A) Mitoz bölünmeye", "B) Döllenmeye", "C) Sindirime", "D) Solunuma"], cevap: 0 },
    { soru: "Saçımızın uzaması, tırnağımızın uzaması hangi bölünme çeşidiyle gerçekleşir?", secenekler: ["A) Mitoz", "B) Mayoz", "C) Krossing-over", "D) Sperm oluşumu"], cevap: 0 },
    { soru: "Aşağıdakilerden hangisi ortak bir özelliktir? (Mitoz ve Mayoz için)", secenekler: ["A) İğ ipliklerinin oluşması", "B) Parça değişimi", "C) Kromozom sayısının yarıya inmesi", "D) 4 hücre oluşumu"], cevap: 0 },
    { soru: "Kardeş kromatitlerin birbirinden ayrıldığı evre hangi bölünmelerde görülür?", secenekler: ["A) Hem mitozda hem mayoz 2'de", "B) Sadece mayoz 1'de", "C) Sadece mayoz 2'de", "D) Hiçbirinde"], cevap: 0 },
    { soru: "Canlıların kalıtsal özelliklerini nesilden nesile aktarmasını ve çeşitlilik kazanmasını sağlayan ana süreç nedir?", secenekler: ["A) Mayoz ve Eşeyli Üreme", "B) Mitoz ve Büyüme", "C) Solunum", "D) Fotosentez"], cevap: 0 },
    { soru: "Vücudumuzdaki bir yaranın iyileşmesi sırasında gerçekleşen hücre bölünmesi sonucunda oluşan yeni hücrelerin DNA'ları ana hücre ile nasıldır?", secenekler: ["A) Tamamen aynıdır.", "B) Tamamen farklıdır.", "C) Kromozom sayısı yarıya inmiştir.", "D) Çeşitlilik göstermiştir."], cevap: 0 }
  ]
};

let aktifOyuncular = {};
let mermiler = [];
let kalanMacSuresi = 300; 
let macBittiMi = false;

setInterval(() => {
    if (!macBittiMi && kalanMacSuresi > 0) {
        kalanMacSuresi--;
        if (kalanMacSuresi <= 0) {
            macBittiMi = true;
        }
    }
}, 1000);

function carpismaVarMi(x, y, yaricap) {
    for (let i = 0; i < DUVARLAR.length; i++) {
        let d = DUVARLAR[i];
        if (x + yaricap > d.x && x - yaricap < d.x + d.w &&
            y + yaricap > d.y && y - yaricap < d.y + d.h) {
            return true;
        }
    }
    return false;
}

function rastgeleSpawnBul() {
    let x, y, guvenli = false;
    while (!guvenli) {
        x = Math.floor(Math.random() * (HARITA_GENISLIK - 100)) + 50;
        y = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 100)) + 50;
        if (!carpismaVarMi(x, y, 30)) guvenli = true;
    }
    return { x, y };
}

// --- 1. GİRİŞ SAYFASI ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Giriş - Fen Arena</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .kutusu { background: #181818; border: 2px solid #FFD700; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 0 20px rgba(255,215,0,0.3); width: 340px; }
            input, select, button { padding: 12px; margin-top: 12px; width: 90%; border-radius: 6px; border: none; font-size: 15px; }
            input, select { background: #333; color: #fff; border: 1px solid #FFD700; outline: none; }
            button { background: #FFD700; color: #000; font-weight: bold; cursor: pointer; transition: 0.2s; }
            button:hover { background: #fff; transform: scale(1.05); }
            label { font-size: 13px; color: #aaa; display: block; text-align: left; margin-top: 8px; }
        </style></head><body>
            <div class="kutusu">
                <h2>⚡ FEN ARENA ⚡</h2>
                <label>Savaşçı Adı:</label>
                <input type="text" id="isimInput" placeholder="Adını gir..." maxlength="15" value="YTS07">
                
                <label>Fen Bilimleri Konusu:</label>
                <select id="konuSecim">
                    <option value="unite1">1. Ünite: Güneş Sistemi ve Ötesi</option>
                    <option value="unite2">2. Ünite: Hücre ve Bölünmeler</option>
                </select>

                <button onclick="girisYap()" style="margin-top: 20px;">İleri (Kostüm Tasarla) ➔</button>
            </div>
            <script>
                function girisYap() {
                    const isim = document.getElementById('isimInput').value.trim();
                    const konu = document.getElementById('konuSecim').value;
                    if(isim) {
                        sessionStorage.setItem('oyuncuIsim', isim);
                        sessionStorage.setItem('oyuncuKonu', konu);
                        window.location.href = '/avatar-yap';
                    } else { alert('Lütfen bir isim girin!'); }
                }
            </script>
        </body></html>
    `);
});

// --- 2. SKİN TASARIM SAYFASI ---
app.get('/avatar-yap', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Skin Yaratıcı ve Yükleyici</title><style>
            body { background: #0f0f0f; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; height: 100vh; margin: 0; padding-top: 30px; user-select: none; }
            h2 { color: #FFD700; margin-bottom: 10px; }
            .container { display: flex; gap: 30px; background: #181818; padding: 20px; border: 2px solid #FFD700; border-radius: 15px; box-shadow: 0 0 20px rgba(255,215,0,0.2); align-items: center; }
            .canvas-box { position: relative; width: 160px; height: 160px; border-radius: 50%; overflow: hidden; border: 3px solid #FFD700; box-shadow: 0 0 15px rgba(255,215,0,0.4); }
            canvas { background: #fff; cursor: crosshair; image-rendering: pixelated; }
            .tools { display: flex; flex-direction: column; gap: 10px; width: 180px; }
            .color-btn { width: 100%; height: 35px; border: 2px solid #333; border-radius: 6px; cursor: pointer; }
            .color-btn.active { border-color: #FFD700; transform: scale(1.05); }
            button, label.file-btn { background: #FFD700; color: #000; font-weight: bold; padding: 10px; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 13px; text-align: center; display: block; }
            button:hover, label.file-btn:hover { background: #fff; }
            .silgi { background: #ff4757; color: white; }
            .silgi:hover { background: #ff6b81; }
            input[type="file"] { display: none; }
            .bilgi-metin { font-size: 11px; color: #aaa; text-align: center; margin-top: 5px; }
        </style></head><body>
            <h2>🎨 Yuvarlak Savaşçı Kostümünü Tasarla</h2>
            <div class="container">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <div class="canvas-box">
                        <canvas id="cizimAlani" width="160" height="160"></canvas>
                    </div>
                    <span class="bilgi-metin">Karakter oyunda yuvarlak görünecek!</span>
                </div>

                <div class="tools">
                    <p style="margin:0; font-size:12px; color:#aaa;">Özel Renk Seç:</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                        <div class="color-btn active" style="background:#000;" onclick="renkSec(this, '#000')"></div>
                        <div class="color-btn" style="background:#fff;" onclick="renkSec(this, '#fff')"></div>
                        <div class="color-btn" style="background:#ff4757;" onclick="renkSec(this, '#ff4757')"></div>
                        <div class="color-btn" style="background:#2ed573;" onclick="renkSec(this, '#2ed573')"></div>
                        <div class="color-btn" style="background:#1e90ff;" onclick="renkSec(this, '#1e90ff')"></div>
                        <div class="color-btn" style="background:#ffa502;" onclick="renkSec(this, '#ffa502')"></div>
                    </div>
                    <input type="color" id="ozelRenk" onchange="renkSec(null, this.value)" style="width:100%; height:35px; cursor:pointer; margin-top:3px; background:none; border:none;">
                    
                    <button class="silgi" onclick="renkSec(null, '#ffffff')">🧹 Silgi</button>
                    <button onclick="temizle()" style="background:#555; color:white;">Tümünü Temizle</button>
                    
                    <label class="file-btn">
                        📁 Bilgisayardan Yükle
                        <input type="file" id="dosyaYukle" accept="image/*" onchange="resimYukle(event)">
                    </label>
                    
                    <button style="margin-top:10px; font-size:15px; padding:12px; background:#2ed573; color:#fff;" onclick="kaydetVeBasla()">⚔️ OYUNA GİR</button>
                </div>
            </div>
            
            <script>
                const canvas = document.getElementById('cizimAlani');
                const ctx = canvas.getContext('2d');
                const gridBoyutu = 16;
                const hucreBoyutu = canvas.width / gridBoyutu;
                
                let aktifRenk = '#000000';
                let cizimYapiyorMu = false;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                function renkSec(el, renk) {
                    aktifRenk = renk;
                    if(el) {
                        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                        el.classList.add('active');
                    }
                }

                function temizle() {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                function resimYukle(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = new Image();
                            img.onload = function() {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            }
                            img.src = e.target.result;
                        }
                        reader.readAsDataURL(file);
                    }
                }

                function boya(e) {
                    if(!cizimYapiyorMu) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = Math.floor((e.clientX - rect.left) / hucreBoyutu) * hucreBoyutu;
                    const y = Math.floor((e.clientY - rect.top) / hucreBoyutu) * hucreBoyutu;
                    
                    ctx.fillStyle = aktifRenk;
                    ctx.fillRect(x, y, hucreBoyutu, hucreBoyutu);
                }

                canvas.addEventListener('mousedown', (e) => { cizimYapiyorMu = true; boya(e); });
                canvas.addEventListener('mousemove', boya);
                canvas.addEventListener('mouseup', () => cizimYapiyorMu = false);
                canvas.addEventListener('mouseleave', () => cizimYapiyorMu = false);

                function kaydetVeBasla() {
                    const avatarData = canvas.toDataURL();
                    sessionStorage.setItem('oyuncuAvatar', avatarData);
                    window.location.href = '/oyun-alani';
                }
            </script>
        </body></html>
    `);
});

// --- 3. OYUN ALANI SAYFASI ---
app.get('/oyun-alani', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Fen Bilimleri Chest Arena</title><style>
            body { background:#0f0f0f; color:#fff; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; user-select: none; }
            canvas { background:#181818; border:4px solid #FFD700; box-shadow:0 0 30px rgba(255,215,0,0.4); cursor: crosshair; }
            .ui { margin-bottom:4px; font-size:16px; color:#FFD700; font-weight:bold; }
            .bilgi { font-size:12px; color:#aaa; margin-bottom:4px; }
            
            #ustPanel { position: fixed; top: 15px; left: 20px; display: flex; gap: 15px; z-index: 1000; font-family: monospace; }
            .panelKutusu { background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,215,0,0.3); color: #FFD700; font-size: 13px; }
            #skorTablosuListesi { margin: 4px 0 0 0; padding-left: 15px; font-size: 11px; color: #fff; text-align: left; max-height: 80px; overflow-y: auto; }

            #skinDegisBtn { position: fixed; top: 15px; right: 20px; background: #FFD700; color: #000; border: none; padding: 10px 15px; font-weight: bold; border-radius: 8px; cursor: pointer; z-index: 1000; box-shadow: 0 0 10px rgba(255,215,0,0.4); transition: 0.2s; }
            #skinDegisBtn:hover { background: #fff; transform: scale(1.05); }

            #soruModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(20, 20, 20, 0.95); border: 3px solid #FFD700; padding: 25px; border-radius: 15px; z-index: 10000; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(255,215,0,0.5); }
            #soruBaslik { font-size: 16px; color: #FFD700; margin-bottom: 15px; font-weight: bold; }
            .secenekBtn { display: block; width: 100%; padding: 10px; margin: 8px 0; background: #333; color: #fff; border: 1px solid #FFD700; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .secenekBtn:hover { background: #FFD700; color: #000; font-weight: bold; }

            #podyumModal { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 10, 10, 0.96); z-index: 50000; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; }
            #podyumModal h1 { color: #FFD700; font-size: 32px; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255,215,0,0.5); text-align: center; }
            .podyum-liste { background: #1a1a1a; border: 3px solid #FFD700; padding: 20px; border-radius: 12px; width: 650px; max-height: 400px; overflow-y: auto; box-shadow: 0 0 40px rgba(255,215,0,0.3); }
            .podyum-satir { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; font-size: 13px; align-items: center; }

            #sifreModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 15, 15, 0.95); border: 3px solid #FFD700; padding: 20px; border-radius: 12px; z-index: 20000; width: 280px; box-shadow: 0 0 30px rgba(255,215,0,0.4); text-align: center; }
            #sifreModal h3 { color: #FFD700; margin-top: 0; font-size: 15px; }
            .sifre-input { width: 90%; background: #222; border: 2px solid #FFD700; color: #fff; padding: 10px; border-radius: 6px; outline: none; text-align: center; font-size: 16px; margin-bottom: 10px; letter-spacing: 2px; }

            #adminPanel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 15, 15, 0.95); border: 3px solid #ff4757; padding: 20px; border-radius: 12px; z-index: 20000; width: 320px; box-shadow: 0 0 40px rgba(255,71,87,0.5); text-align: center; }
            #adminPanel h3 { color: #ff4757; margin-top: 0; margin-bottom: 15px; font-family: monospace; }
            #adminInput { width: 90%; background: #222; border: 2px solid #ff4757; color: #fff; padding: 10px; border-radius: 6px; outline: none; font-size: 14px; margin-bottom: 12px; font-family: monospace; }
            .admin-btn { background: #ff4757; color: #fff; border: none; padding: 10px 15px; font-weight: bold; border-radius: 6px; cursor: pointer; width: 95%; font-size: 14px; }
            .admin-btn:hover { background: #ff6b81; }

            #chatContainer { position: fixed; bottom: 20px; left: 20px; width: 350px; z-index: 999; display: flex; flex-direction: column; pointer-events: none; }
            #chatGecmisi { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow: hidden; margin-bottom: 6px; }
            .chat-satir { background: rgba(0, 0, 0, 0.45); color: #fff; padding: 4px 8px; font-size: 13px; border-radius: 3px; width: fit-content; text-shadow: 1px 1px 1px #000; font-family: monospace; }
            #chatInput { display: none; width: 100%; background: rgba(0, 0, 0, 0.85); border: 2px solid #FFD700; color: #fff; padding: 8px; font-size: 14px; outline: none; border-radius: 4px; pointer-events: auto; font-family: monospace; box-sizing: border-box; }

            #killFeed { position: fixed; top: 70px; right: 20px; display: flex; flex-direction: column; gap: 5px; z-index: 999; pointer-events: none; align-items: flex-end; }
            .kill-msg { background: rgba(0, 0, 0, 0.65); border-left: 4px solid #ff4757; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
        </style></head><body>
            <div class="ui">⭐ BİLGİ ÜSSÜ FEN BİLİMLERİ ARENA ⭐</div>
            <div class="bilgi">Hareket: <b>W,A,S,D</b> | Ateş Et: <b>Sol Tık</b> | Chat: <b>T</b></div>
            
            <button id="skinDegisBtn" onclick="skinSayfasinaGit()">🎨 Skin Değiştir</button>

            <div id="podyumModal">
                <h1>🏆 MAÇ SONA ERDİ - İLK 3 PODYUMU 🏆</h1>
                <div class="podyum-liste" id="podyumListeIcerik"></div>
                <button onclick="window.location.reload()" style="margin-top:20px; padding:12px 25px; background:#FFD700; color:#000; border:none; font-weight:bold; border-radius:6px; cursor:pointer; font-size:15px;">Yeniden Başla ➔</button>
            </div>

            <div id="sifreModal">
                <h3>🔐 GÜVENLİK ŞİFRESİ</h3>
                <input type="password" id="sifreInput" class="sifre-input" placeholder="Şifre..." autocomplete="off">
                <button class="admin-btn" style="background:#FFD700; color:#000;" onclick="sifreKontrolEt()">Doğrula</button>
            </div>

            <div id="adminPanel">
                <h3>👑 GİZLİ ADMIN PANELİ</h3>
                <input type="text" id="adminInput" placeholder="Komut yaz (örn: ninjayildiz)..." autocomplete="off">
                <button class="admin-btn" onclick="komutUygula()">Çalıştır</button>
            </div>

            <div id="ustPanel">
                <div class="panelKutusu">
                    ⏱️ Maç Süresi: <b id="sayacGosterge" style="color:#fff;">05:00</b>
                </div>
                <div class="panelKutusu" style="min-width: 160px;">
                    🏆 <b>Skor Tablosu</b>
                    <ul id="skorTablosuListesi"></ul>
                </div>
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

            <canvas id="arena" width="1100" height="650"></canvas>
            
            <script src="/socket.io/socket.io.js"></script>
            <script>
                document.addEventListener('contextmenu', e => e.preventDefault());
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j')) || (e.ctrlKey && e.key.toLowerCase() === 'u')) {
                        e.preventDefault();
                        return false;
                    }
                });

                const isim = sessionStorage.getItem('oyuncuIsim') || 'Savaşçı';
                const konu = sessionStorage.getItem('oyuncuKonu') || 'unite1';
                const avatar = sessionStorage.getItem('oyuncuAvatar') || '';

                const socket = io({ query: { isim: isim, konu: konu } });

                socket.on('connect', () => {
                    if(avatar) socket.emit('avatarGuncelle', avatar);
                });

                function skinSayfasinaGit() {
                    window.location.href = '/avatar-yap';
                }

                const canvas = document.getElementById('arena');
                const ctx = canvas.getContext('2d');

                let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)}, kalanSure: 300, macBitti: false };
                let avatarOnbellek = {};

                let chestImg = new Image();
                let chestYuklendi = false;
                chestImg.onload = () => { chestYuklendi = true; };
                chestImg.src = '/karakterler/Chest.webp';

                let tuslar = {};
                let chatAcik = false;
                let soruAcik = false;
                let sifreModalAcik = false;
                let adminAcik = false;
                let macBittiEkranAktif = false;

                window.addEventListener('keydown', (e) => {
                    if (macBittiEkranAktif) return;

                    if (e.shiftKey && e.ctrlKey && e.key === 'Escape') {
                        e.preventDefault();
                        sifreModalAcik = !sifreModalAcik;
                        let modal = document.getElementById('sifreModal');
                        modal.style.display = sifreModalAcik ? 'block' : 'none';
                        if (sifreModalAcik) {
                            document.getElementById('sifreInput').value = '';
                            document.getElementById('sifreInput').focus();
                        }
                        return;
                    }

                    if (soruAcik || sifreModalAcik || adminAcik) return;
                    if (e.key.toLowerCase() === 't' && !chatAcik) {
                        e.preventDefault();
                        chatAcik = true;
                        let input = document.getElementById('chatInput');
                        input.style.display = 'block';
                        input.focus();
                    } else if (e.key === 'Escape' && chatAcik) {
                        chatAcik = false;
                        document.getElementById('chatInput').style.display = 'none';
                    }
                    if (!chatAcik) tuslar[e.key.toLowerCase()] = true;
                });

                window.addEventListener('keyup', (e) => { if (!chatAcik) tuslar[e.key.toLowerCase()] = false; });

                document.getElementById('sifreInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') sifreKontrolEt();
                });

                function sifreKontrolEt() {
                    let girilenSifre = document.getElementById('sifreInput').value.trim();
                    document.getElementById('sifreModal').style.display = 'none';
                    sifreModalAcik = false;

                    if (girilenSifre === '071757') {
                        adminAcik = true;
                        let adminPanel = document.getElementById('adminPanel');
                        adminPanel.style.display = 'block';
                        document.getElementById('adminInput').value = '';
                        document.getElementById('adminInput').focus();
                    } else {
                        alert('❌ Hatalı Şifre!');
                    }
                }

                document.getElementById('adminInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') komutUygula();
                });

                function komutUygula() {
                    let inputEl = document.getElementById('adminInput');
                    let komut = inputEl.value.trim();
                    if (komut.length > 0) socket.emit('adminKomutu', komut);
                    inputEl.value = '';
                    document.getElementById('adminPanel').style.display = 'none';
                    adminAcik = false;
                }

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
                    if (macBittiEkranAktif || chatAcik || soruAcik || sifreModalAcik || adminAcik || e.button !== 0) return; 
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
                    if (macBittiEkranAktif || chatAcik || soruAcik || sifreModalAcik || adminAcik) return;
                    let hareket = {x: 0, y: 0};
                    let hiz = 6;

                    if(tuslar['w'] || tuslar['arrowup']) hareket.y = -hiz;
                    if(tuslar['s'] || tuslar['arrowdown']) hareket.y = hiz;
                    if(tuslar['a'] || tuslar['arrowleft']) hareket.x = -hiz;
                    if(tuslar['d'] || tuslar['arrowright']) hareket.x = hiz;

                    if(hareket.x !== 0 || hareket.y !== 0) socket.emit('hareketEt', hareket);
                }, 1000 / 30);

                socket.on('arenaGuncelle', (data) => { 
                    oyunVerisi = data; 
                    
                    let dk = Math.floor(data.kalanSure / 60);
                    let sn = data.kalanSure % 60;
                    let sayacEl = document.getElementById('sayacGosterge');
                    if (sayacEl) sayacEl.innerText = (dk < 10 ? '0' + dk : dk) + ':' + (sn < 10 ? '0' + sn : sn);
                    
                    let liste = document.getElementById('skorTablosuListesi');
                    if (liste) {
                        liste.innerHTML = '';
                        let oyuncuDizi = Object.values(data.players).sort((a, b) => b.skor - a.skor);
                        oyuncuDizi.forEach((p, index) => {
                            let li = document.createElement('li');
                            li.innerHTML = \`<b>\${index + 1}.</b> \${p.isim}: <b style="color:#FFD700;">\${p.skor}⭐</b>\`;
                            liste.appendChild(li);
                        });
                    }

                    if (data.macBitti) {
                        macBittiEkranAktif = true;
                        let podyumModal = document.getElementById('podyumModal');
                        let podyumListeIcerik = document.getElementById('podyumListeIcerik');
                        podyumListeIcerik.innerHTML = '';
                        
                        let oyuncuDizi = Object.values(data.players).sort((a, b) => b.skor - a.skor);
                        oyuncuDizi.forEach((p, index) => {
                            let renk = index === 0 ? '#FFD700' : (index === 1 ? '#c0c0c0' : (index === 2 ? '#cd7f32' : '#aaa'));
                            let podyumTag = index === 0 ? '👑 1. LİDER' : (index === 1 ? '🥈 2. İKİNCİ' : (index === 2 ? '🥉 3. ÜÇÜNCÜ' : \`#\${index + 1}\`));
                            
                            let div = document.createElement('div');
                            div.className = 'podyum-satir';
                            div.style.background = index < 3 ? 'rgba(255, 215, 0, 0.08)' : 'transparent';
                            div.style.border = index < 3 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid #333';
                            div.style.borderRadius = '6px';
                            div.style.marginBottom = '6px';

                            div.innerHTML = \`
                                <span style="color:\${renk}; width: 110px;"><b>\${podyumTag}</b></span>
                                <span style="width: 100px; font-weight:bold;">\${p.isim}</span>
                                <span>Puan: <b style="color:#FFD700;">\${p.skor}⭐</b></span>
                                <span>Kill: <b style="color:#ff4757">\${p.kill}</b></span>
                                <span>Ölüm: <b style="color:#ffa502">\${p.death}</b></span>
                                <span>Doğru: <b style="color:#2ed573">\${p.dogru}</b></span>
                                <span>Yanlış: <b style="color:#ff4757">\${p.yanlis}</b></span>
                            \`;
                            podyumListeIcerik.appendChild(div);
                        });
                        podyumModal.style.display = 'flex';
                    }
                });

                socket.on('soruGoster', (veri) => {
                    if (macBittiEkranAktif) return;
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

                function oyunDongusu() {
                    cizimYap();
                    if (!macBittiEkranAktif) {
                        requestAnimationFrame(oyunDongusu);
                    }
                }
                requestAnimationFrame(oyunDongusu);

                function cizimYap() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    let benimId = socket.id;
                    let ben = oyunVerisi.players[benimId];

                    let kameraX = 0, kameraY = 0;
                    if (ben) {
                        kameraX = Math.max(0, Math.min(ben.x - canvas.width / 2, ${HARITA_GENISLIK} - canvas.width));
                        kameraY = Math.max(0, Math.min(ben.y - canvas.height / 2, ${HARITA_YUKSEKLIK} - canvas.height));
                    }

                    ctx.save();
                    ctx.translate(-kameraX, -kameraY);

                    for(let b of oyunVerisi.bolgeler) {
                        ctx.fillStyle = b.renk;
                        ctx.fillRect(b.x, b.y, b.w, b.h);
                        ctx.strokeStyle = b.yaziRengi;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(b.x, b.y, b.w, b.h);
                        
                        ctx.fillStyle = b.yaziRengi;
                        ctx.font = 'bold 28px monospace';
                        ctx.fillText(b.isim, b.x + 40, b.y + 50);
                    }

                    ctx.fillStyle = '#444';
                    for(let d of oyunVerisi.walls) {
                        ctx.fillRect(d.x, d.y, d.w, d.h);
                        ctx.strokeStyle = '#666';
                        ctx.strokeRect(d.x, d.y, d.w, d.h);
                    }

                    for(let c of oyunVerisi.chests) {
                        if(c.aktif) {
                            if (chestYuklendi) {
                                ctx.drawImage(chestImg, c.x - 20, c.y - 20, 40, 40);
                            } else {
                                ctx.fillStyle = '#ff9f43';
                                ctx.fillRect(c.x - 20, c.y - 20, 40, 40);
                            }
                        }
                    }

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
                                ctx.lineTo(6, -6);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                ctx.rotate(Math.PI / 2);
                            }
                        } else {
                            ctx.fillStyle = '#ff4757';
                            ctx.beginPath();
                            ctx.arc(0, 0, 6, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.restore();
                    }

                    for(let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        
                        if (p.gorunmez && id !== benimId) continue;

                        ctx.save();
                        ctx.translate(p.x, p.y);

                        if (p.gorunmez && id === benimId) {
                            ctx.globalAlpha = 0.4;
                        }

                        ctx.fillStyle = 'red';
                        ctx.fillRect(-25, -45, 50, 6);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(-25, -45, (Math.min(p.can, 100) / 100) * 50, 6);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, 0, -30);

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.clip();

                        if (p.avatarData) {
                            if (!avatarOnbellek[id] || avatarOnbellek[id].data !== p.avatarData) {
                                let img = new Image();
                                img.src = p.avatarData;
                                avatarOnbellek[id] = { img: img, data: p.avatarData };
                            }
                            let cachedImg = avatarOnbellek[id].img;
                            if (cachedImg.complete) {
                                ctx.drawImage(cachedImg, -20, -20, 40, 40);
                            }
                        } else {
                            ctx.fillStyle = '#FFD700';
                            ctx.fillRect(-20, -20, 40, 40);
                        }
                        ctx.restore();

                        ctx.strokeStyle = p.ninjaYildizAktif ? '#2ed573' : '#fff';
                        ctx.lineWidth = p.ninjaYildizAktif ? 3 : 2;
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

io.on('connection', (socket) => {
    let isim = socket.handshake.query.isim || 'Savaşçı';
    let konu = socket.handshake.query.konu || 'unite1';
    let spawn = rastgeleSpawnBul();

    aktifOyuncular[socket.id] = {
        id: socket.id,
        isim: isim,
        konu: konu,
        ninjaYildizAktif: false,
        gorunmez: false,
        seriAtesSayaci: 0,
        x: spawn.x,
        y: spawn.y,
        can: 100,
        skor: 0,
        kill: 0,
        death: 0,
        dogru: 0,
        yanlis: 0,
        avatarData: ''
    };

    socket.on('avatarGuncelle', (veri) => {
        if(aktifOyuncular[socket.id]) {
            aktifOyuncular[socket.id].avatarData = veri;
        }
    });

    socket.on('hareketEt', (h) => {
        if (macBittiMi) return;
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
        if (macBittiMi) return;
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        let aci = Math.atan2(hedef.y - p.y, hedef.x - p.x);
        mermiler.push({
            id: socket.id,
            x: p.x,
            y: p.y,
            dx: Math.cos(aci) * 12,
            dy: Math.sin(aci) * 12,
            mesafe: 0,
            ninja: p.ninjaYildizAktif
        });
    });

    socket.on('adminKomutu', (komut) => {
        if (macBittiMi) return;
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        let parcalar = komut.trim().split(' ');
        let anaKomut = parcalar[0].toLowerCase();

        if (anaKomut === 'ninjayildiz') {
            p.ninjaYildizAktif = !p.ninjaYildizAktif;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: p.ninjaYildizAktif ? '✨ Ninja Yıldızı Mermileri AKTİF Edildi!' : '❌ Normal Mermilere Geri Dönüldü.' });
        } 
        else if (anaKomut === 'gorunmez') {
            let sureSaniye = parseInt(parcalar[1]) || 5;
            p.gorunmez = true;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `👻 Görünmezlik modu açıldı! Süre: ${sureSaniye} saniye.` });
            
            setTimeout(() => {
                if (aktifOyuncular[socket.id]) {
                    aktifOyuncular[socket.id].gorunmez = false;
                    socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '👀 Görünmezlik süresi bitti!' });
                }
            }, sureSaniye * 1000);
        } 
        else if (anaKomut === 'kill') {
            let hedefSira = parseInt(parcalar[1]);
            if (isNaN(hedefSira)) {
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '⚠️ Geçersiz sıra! Örn: kill 1' });
                return;
            }

            let siraliOyuncular = Object.values(aktifOyuncular).sort((a, b) => b.skor - a.skor);
            let hedefOyuncu = siraliOyuncular[hedefSira - 1];

            if (hedefOyuncu) {
                let acilar = [0, Math.PI/2, Math.PI, (3*Math.PI)/2, Math.PI/4, (3*Math.PI)/4];
                let isinlandi = false;
                
                for (let aci of acilar) {
                    let testX = hedefOyuncu.x + Math.cos(aci) * 45;
                    let testY = hedefOyuncu.y + Math.sin(aci) * 45;
                    if (!carpismaVarMi(testX, testY, 20)) {
                        p.x = testX;
                        p.y = testY;
                        isinlandi = true;
                        break;
                    }
                }
                
                if (!isinlandi) {
                    p.x = hedefOyuncu.x;
                    p.y = hedefOyuncu.y;
                }

                p.seriAtesSayaci = 60;
                p.hedefOyuncuId = hedefOyuncu.id;
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `🔥 ${hedefOyuncu.isim} yanına ışınlandın, seri ateş başladı!` });
            } else {
                socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `⚠️ ${hedefSira}. sırada bir oyuncu bulunamadı!` });
            }
        } 
        else {
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: `❌ Bilinmeyen komut: ${anaKomut}` });
        }
    });

    socket.on('chatMesaji', (mesaj) => {
        let p = aktifOyuncular[socket.id];
        if(!p) return;
        io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: mesaj });
    });

    socket.on('cevapVer', (veri) => {
        if (macBittiMi) return;
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        if (veri.secilenIndex === veri.dogruCevap) {
            p.skor += 3;
            p.dogru += 1;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '🎉 Doğru cevap! +3 Puan kazandın.' });
        } else {
            p.can = Math.max(10, p.can - 15);
            p.yanlis += 1;
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '❌ Yanlış cevap! 15 Can kaybettin.' });
        }
    });

    socket.on('disconnect', () => {
        delete aktifOyuncular[socket.id];
    });
});

setInterval(() => {
    if (macBittiMi) return;

    for (let i = 0; i < chestler.length; i++) {
        let c = chestler[i];
        if (c.aktif) {
            for (let id in aktifOyuncular) {
                let p = aktifOyuncular[id];
                let mesafe = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
                if (mesafe < 35) {
                    c.aktif = false;
                    let oyuncununKonusu = p.konu || 'unite1';
                    let havuz = SORU_HAVUZU[oyuncununKonusu] || SORU_HAVUZU.unite1;
                    let rastgeleSoru = havuz[Math.floor(Math.random() * havuz.length)];

                    io.to(id).emit('soruGoster', { chestId: c.id, soruData: rastgeleSoru });
                    setTimeout(() => { c.aktif = true; }, 10000);
                    break;
                }
            }
        }
    }
}, 500);

setInterval(() => {
    if (macBittiMi) return;

    for (let id in aktifOyuncular) {
        let p = aktifOyuncular[id];
        if (p.seriAtesSayaci > 0) {
            p.seriAtesSayaci--;
            
            let hedefX = p.x + (Math.random() * 200 - 100);
            let hedefY = p.y + (Math.random() * 200 - 100);
            
            if (p.hedefOyuncuId && aktifOyuncular[p.hedefOyuncuId]) {
                let hedefP = aktifOyuncular[p.hedefOyuncuId];
                hedefX = hedefP.x;
                hedefY = hedefP.y;
            }

            let aci = Math.atan2(hedefY - p.y, hedefX - p.x);
            
            mermiler.push({
                id: p.id,
                x: p.x,
                y: p.y,
                dx: Math.cos(aci) * 18,
                dy: Math.sin(aci) * 18,
                mesafe: 0,
                ninja: true
            });
        }
    }

    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];

        m.x += m.dx;
        m.y += m.dy;
        m.mesafe += 10;

        if (m.mesafe > 1800 || carpismaVarMi(m.x, m.y, 5)) {
            mermiler.splice(i, 1);
            continue;
        }

        for (let id in aktifOyuncular) {
            if (id !== m.id) {
                let p = aktifOyuncular[id];
                if (p.gorunmez) continue;

                let uzaklik = Math.sqrt((p.x - m.x) ** 2 + (p.y - m.y) ** 2);
                if (uzaklik < 25) {
                    p.can -= 35;
                    mermiler.splice(i, 1);

                    if (p.can <= 0) {
                        p.can = 100;
                        p.death += 1;
                        let sp = rastgeleSpawnBul();
                        p.x = sp.x;
                        p.y = sp.y;
                        if(aktifOyuncular[m.id]) {
                            aktifOyuncular[m.id].skor += 1;
                            aktifOyuncular[m.id].kill += 1;
                        }
                        let vuranIsim = aktifOyuncular[m.id] ? aktifOyuncular[m.id].isim : "YTS07";
                        io.emit('olumBildirimi', `${p.isim}, ${vuranIsim} Tarafından Katledildi!`);
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
        kalanSure: kalanMacSuresi,
        macBitti: macBittiMi
    });
}, 1000 / 30);

server.listen(PORT, () => {
    console.log(`Sunucu aktif: Port ${PORT}`);
});
