// ==========================================
// FEN BİLİMLERİ TURNUVA OYUNU - ANA KOD
// ==========================================

const SORU_HAVUZU = {
  "1": [ // 1. Ünite: Güneş Sistemi ve Ötesi
    {
      soru: "Yıldızların doğduğu, gaz ve toz bulutlarının yoğun olduğu bölgelere ne ad verilir?",
      secenekler: ["A) Galaksi", "B) Bulutsu (Nebula)", "C) Süpernova", "D) Karadelik"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi bir bulutsu (nebula) örneğidir?",
      secenekler: ["A) Samanyolu", "B) Andromeda", "C) Yengeç Bulutsusu", "D) Sirius"],
      dogruCevap: "C"
    },
    {
      soru: "Yıldızlar yaşamlarının sonunda kütlelerine göre farklı evrelere ayrılırlar. Güneş'ten çok büyük kütleli yıldızlar ömürlerinin sonunda neye dönüşürler?",
      secenekler: ["A) Beyaz Cüce", "B) Karadelik veya Nötron Yıldızı", "C) Gezegen", "D) Akımtı Bulutsusu"],
      dogruCevap: "B"
    },
    {
      soru: "Dünya'nın da içinde bulunduğu, çubuklu sarmal yapısındaki galaksi hangisidir?",
      secenekler: ["A) Andromeda", "B) Samanyolu", "C) Sombrero", "D) Büyük Macellan"],
      dogruCevap: "B"
    },
    {
      soru: "Işığın bile çekim kuvvetinden kaçamadığı, çok büyük kütleli uzay cisimlerine ne denir?",
      secenekler: ["A) Pulsar", "B) Karadelik", "C) Kuasar", "D) Beyaz Cüce"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdaki gök cisimlerinden hangisi evrendeki en büyük yapısal birimdir?",
      secenekler: ["A) Yıldız", "B) Gezegen sistemi", "C) Galaksi (Gökada)", "D) Bulutsu"],
      dogruCevap: "C"
    },
    {
      soru: "Yıldızların doğuşu, gelişimi ve ölüm sürecini inceleyen bilim dalı veya kavram aşağıdakilerden hangisiyle ilgilidir?",
      secenekler: ["A) Yıldız Oluşum Süreci (Yıldız Yaşam Döngüsü)", "B) Astroloji", "C) Meteoroloji", "D) Sismoloji"],
      dogruCevap: "A"
    },
    {
      soru: "Güneş'in yapısında en çok bulunan elementler sırasıyla hangileridir?",
      secenekler: ["A) Oksijen - Azot", "B) Hidrojen - Helyum", "C) Demir - Nikel", "D) Karbon - Hidrojen"],
      dogruCevap: "B"
    },
    {
      soru: "Samanyolu galaksisine en yakın büyük komşu galaksi hangisidir?",
      secenekler: ["A) Küçük Macellan", "B) Andromeda", "C) Sombrero", "D) Girdap"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi gök cisimleri arasındaki uzaklıkları ifade etmek için kullanılan birimdir?",
      secenekler: ["A) Kilometre", "B) Işık yılı", "C) Mil", "D) Metre"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi bir ışık yılı tanımıdır?",
      secenekler: ["A) Işığın bir yılda aldığı yol", "B) Güneş ile Dünya arasındaki mesafe", "C) Dünyanın kendi etrafındaki dönüş süresi", "D) Bir yıldızın ömrü"],
      dogruCevap: "A"
    },
    {
      soru: "Karasal gezegenler ile gazsal gezegenleri birbirinden ayıran kuşak hangisidir?",
      secenekler: ["A) Kuiper Kuşağı", "B) Asteroid Kuşağı", "C) Oort Bulutu", "D) Meteor Kuşağı"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi Güneş sistemindeki iç (karasal) gezegenlerden biridir?",
      secenekler: ["A) Jüpiter", "B) Satürn", "C) Mars", "D) Neptün"],
      dogruCevap: "C"
    },
    {
      soru: "Aşağıdakilerden hangisi dış (gazsal) gezegenlerin ortak özelliklerinden biri değildir?",
      secenekler: ["A) Halka sistemlerinin olması", "B) Yüzeylerinin katı taşlardan oluşması", "C) Büyük yapılı olmaları", "D) Çoğunun uydusunun fazla olması"],
      dogruCevap: "B"
    },
    {
      soru: "Hangi gezegen diğerlerinden farklı yönde (doğudan batıya) döner?",
      secenekler: ["A) Dünya", "B) Venüs", "C) Mars", "D) Jüpiter"],
      dogruCevap: "B"
    },
    {
      soru: "Uydusu ve halkası olmayan, güneşe en yakın gezegen hangisidir?",
      secenekler: ["A) Merkür", "B) Venüs", "C) Mars", "D) Dünya"],
      dogruCevap: "A"
    },
    {
      soru: "Halkası en belirgin ve büyük olan gaz dev gezegen hangisidir?",
      secenekler: ["A) Jüpiter", "B) Satürn", "C) Uranüs", "D) Neptün"],
      dogruCevap: "B"
    },
    {
      soru: "Güneş sisteminin en büyük gezegeni aşağıdakilerden hangisidir?",
      secenekler: ["A) Satürn", "B) Jüpiter", "C) Neptün", "D) Dünya"],
      dogruCevap: "B"
    },
    {
      soru: "Atmosferindeki gazlar (özellikle metan) nedeniyle mavimsi yeşil renkte görünen ve varil gibi yuvarlanarak dönen gezegen hangisidir?",
      secenekler: ["A) Mars", "B) Uranüs", "C) Venüs", "D) Satürn"],
      dogruCevap: "B"
    },
    {
      soru: "Güneş'e en uzak olan gezegen hangisidir?",
      secenekler: ["A) Uranüs", "B) Neptün", "C) Satürn", "D) Jüpiter"],
      dogruCevap: "B"
    },
    {
      soru: "Halk arasında 'Çoban Yıldızı' olarak bilinen gezegen aslında hangisidir?",
      secenekler: ["A) Mars", "B) Venüs", "C) Merkür", "D) Jüpiter"],
      dogruCevap: "B"
    },
    {
      soru: "Kızıl Gezegen olarak bilinen, yüzeyinde demir oksit bulunan gezegen hangisidir?",
      secenekler: ["A) Merkür", "B) Mars", "C) Jüpiter", "D) Satürn"],
      dogruCevap: "B"
    },
    {
      soru: "Atmosferi çok kalın olduğu için Güneş sisteminin en sıcak gezegeni olan gök cismi hangisidir?",
      secenekler: ["A) Merkür", "B) Venüs", "C) Güneş", "D) Mars"],
      dogruCevap: "B"
    },
    {
      soru: "Gök cisimlerini incelemek, uzaya uydu göndermek ve bilgi toplamak amacıyla kurulan yerleşkelere ne denir?",
      secenekler: ["A) Gözlemevi (Rasadhane)", "B) Laboratuvar", "C) Planetaryum", "D) Sergi salonu"],
      doğruCevap: "A"
    },
    {
      soru: "Gözlemevleri kurulurken aşağıdakilerden hangisine dikkat edilmez?",
      secenekler: ["A) Bulutsuz gece sayısının fazla olmasına", "B) Işık kirliliğinden uzak olmasına", "C) Şehir merkezlerine çok yakın ve kalabalık yerlere kurulmasına", "D) Deniz seviyesinden yüksek yerlerde olmasına"],
      dogruCevap: "C"
    },
    {
      soru: "Aşağıdakilerden hangisi ışık kirliliğinin olumsuz sonuçlarından biri değildir?",
      secenekler: ["A) Gökyüzündeki yıldızların net görünmesini engeller.", "B) Göçmen kuşların yönlerini şaşırmasına neden olur.", "C) Gözlemevlerinin çalışmalarını olumsuz etkiler.", "D) Enerji tasarrufu sağlar."],
      dogruCevap: "D"
    },
    {
      soru: "Uzay araştırmalarında kullanılan ilk yapay uydu hangisidir?",
      secenekler: ["A) Hubble", "B) Sputnik 1", "C) Türksat 4A", "D) Voyager 1"],
      dogruCevap: "B"
    },
    {
      soru: "Türkiye'nin aktif haberleşme uydularından biri aşağıdakilerden hangisidir?",
      secenekler: ["A) Göktürk-2", "B) Türksat 3A", "C) Rasat", "D) Bilsat"],
      dogruCevap: "B"
    },
    {
      soru: "Türkiye'nin gözlem amaçlı (yerleşke ve harita) uydularından biri hangisidir?",
      secenekler: ["A) Türksat 4B", "B) Göktürk", "C) Sputnik", "D) Hubble"],
      dogruCevap: "B"
    },
    {
      soru: "Uzayda görev yapan ve halen Dünya etrafında dönen en ünlü uzay teleskobu hangisidir?",
      secenekler: ["A) James Webb", "B) Hubble", "C) Kepler", "D) Spitzer"],
      dogruCevap: "B"
    },
    {
      soru: "Uyduların veya uzay araçlarının görevleri bittiğinde uzayda bırakılması sonucunda oluşan ve tehlike yaratan duruma ne denir?",
      secenekler: ["A) Işık kirliliği", "B) Uzay kirliliği", "C) Hava kirliliği", "D) Ses kirliliği"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi uzay kirliliğine neden olur?",
      secenekler: ["A) İşlevini yitirmiş uydular", "B) Roket kalıntıları", "C) Yakıt tankları", "D) Hepsi"],
      dogruCevap: "D"
    },
    {
      soru: "Yıldızların ömrünün son evresinde büyük bir patlamayla parlaması olayına ne denir?",
      secenekler: ["A) Süpernova", "B) Nebula", "C) Bulutsu", "D) Karadelik"],
      dogruCevap: "A"
    },
    {
      soru: "Güneş'in orta büyüklükte bir yıldız olduğu bilinmektedir. Güneş'in ömrünün sonunda dönüşeceği yapı hangisidir?",
      secenekler: ["A) Karadelik", "B) Beyaz Cüce", "C) Nötron yıldızı", "D) Süpernova"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi bir takımyıldız örneğidir?",
      secenekler: ["A) Samanyolu", "B) Büyük Ayı", "C) Andromeda", "D) Güneş Sistemi"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdaki gök cisimlerinden hangisi ısı ve ışık yayar?",
      secenekler: ["A) Gezegen", "B) Uydu", "C) Yıldız", "D) Asteroit"],
      dogruCevap: "C"
    },
    {
      soru: "Gezegenler yıldızlar gibi parlamazlar. Gezegenlerin parlak görünmesinin temel nedeni nedir?",
      secenekler: ["A) Kendi ışıklarını üretmeleri", "B) Güneş'ten aldıkları ışığı yansıtmaları", "C) Çok sıcak olmaları", "D) Sürtünmeden dolayı yanmaları"],
      dogruCevap: "B"
    },
    {
      soru: "Atmosfere giren gök taşlarının sürtünme etkisiyle yanarak ışık saçması olayına ne ad verilir?",
      secenekler: ["A) Meteor (Yıldız kayması)", "B) Asteroit", "C) Kometa", "D) Süpernova"],
      dogruCevap: "A"
    },
    {
      soru: "Meteorların yeryüzüne düşerek oluşturduğu çukurlara ne denir?",
      secenekler: ["A) Krater", "B) Vadi", "C) Fay", "D) Kanyon"],
      dogruCevap: "A"
    },
    {
      soru: "Yeryüzüne düşebilen gök taşlarına ne ad verilir?",
      secenekler: ["A) Meteorit", "B) Uydu", "C) Yıldız", "D) Kuyruklu yıldız"],
      dogruCevap: "A"
    },
    {
      soru: "Yapılarında bol miktarda buz, toz ve gaz bulunduran, güneş etrafındaki yörüngeleri çok uzun olan gök cisimlerine ne denir?",
      secenekler: ["A) Kuyruklu yıldız", "B) İç gezegen", "C) Karadelik", "D) Takımyıldız"],
      dogruCevap: "A"
    },
    {
      soru: "Ünlü Halley kuyruklu yıldızı yaklaşık kaç yılda bir dünyadan gözlemlenebilir?",
      secenekler: ["A) 25 yıl", "B) 76 yıl", "C) 100 yıl", "D) 500 yıl"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdakilerden hangisi teleskop çeşitlerinden biri değildir?",
      secenekler: ["A) Mercekli teleskop", "B) Aynalı teleskop", "C) Radyo teleskop", "D) Manyetik teleskop"],
      dogruCevap: "D"
    },
    {
      soru: "İlk defa gökyüzü incelemesi için teleskobu kullanan ünlü bilim insanı kimdir?",
      secenekler: ["A) Isaac Newton", "B) Galileo Galilei", "C) Albert Einstein", "D) Nicolaus Copernicus"],
      dogruCevap: "B"
    },
    {
      soru: "Uzay istasyonlarında (UAS gibi) astronotların yaşaması ve araştırma yapması hangi amaçla desteklenir?",
      secenekler: ["A) Uzayda yerleşim imkanlarını ve insan fizyolojisini incelemek", "B) Sadece tatil yapmak", "C) Maden aramak", "D) Yıldız satmak"],
      dogruCevap: "A"
    },
    {
      soru: "Güneş sistemindeki en büyük dağ (Olympus Mons) hangi gezegende yer alır?",
      secenekler: ["A) Dünya", "B) Mars", "C) Venüs", "D) Jüpiter"],
      dogruCevap: "B"
    },
    {
      soru: "Güneş sistemindeki en büyük uydu olan Ganymede hangi gezegenin etrafında döner?",
      secenekler: ["A) Satürn", "B) Jüpiter", "C) Neptün", "D) Uranüs"],
      dogruCevap: "B"
    },
    {
      soru: "Evrenin oluşumu ile ilgili en kabul gören teori hangisidir?",
      secenekler: ["A) Büyük Patlama (Big Bang)", "B) Sabit Durum", "C) Çarpışan Evrenler", "D) Büzülme Teorisi"],
      dogruCevap: "A"
    },
    {
      soru: "Samanyolu galaksisinin şekli nasıldır?",
      secenekler: ["A) Eliptik", "B) Çubuklu sarmal", "C) Düzensiz", "D) Küresel"],
      dogruCevap: "B"
    },
    {
      soru: "1. Ünite Son Soru: Yıldızların sıcaklıklarına göre renkleri farklılık gösterir. En sıcak yıldızlar hangi renkte görünür?",
      secenekler: ["A) Kırmızı", "B) Sarı", "C) Mavi veya Beyaz", "D) Turuncu"],
      dogruCevap: "C"
    }
  ],

  "2": [ // 2. Ünite: Hücre ve Bölünmeler
    {
      soru: "Vücut hücrelerinin oluşmasını ve büyümesini sağlayan hücre bölünmesi çeşidi hangisidir?",
      secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Eşeyli üreme"],
      dogruCevap: "B"
    },
    {
      soru: "Mayoz bölünme sonucunda bir hücreden kaç yeni hücre oluşur?",
      secenekler: ["A) 1", "B) 2", "C) 4", "D) 8"],
      dogruCevap: "C"
    },
    {
      soru: "İnsanlarda üreme hücrelerinin (sperm ve yumurta) kromozom sayısı kaça düşer?",
      secenekler: ["A) 46", "B) 23", "C) 92", "D) 12"],
      dogruCevap: "B"
    },
    {
      soru: "Mitoz bölünme ile ilgili aşağıdakilerden hangisi yanlıştır?",
      secenekler: ["A) Oluşan hücrelerin kalıtsal özellikleri birbirinin aynısıdır.", "B) Çok hücreli canlılarda büyüme, gelişme ve onarımı sağlar.", "C) Kromozom sayısı yarıya iner.", "D) Tek hücrelilerde üremeyi sağlar."],
      dogruCevap: "C"
    },
    {
      soru: "Mayoz bölünme sırasında gerçekleşen ve canlılarda çeşitliliği (farklılığı) sağlayan en önemli olay nedir?",
      secenekler: ["A) Sitoplazma bölünmesi", "B) Kromozom sayısının yarıya inmesi", "C) Parça değişimi (Krossing-over)", "D) DNA'nın kendini eşlemesi"],
      dogruCevap: "C"
    },
    {
      soru: "Aşağıdaki canlılardan hangisinde mitoz bölünme üremeyi (çoğalmayı) sağlar?",
      secenekler: ["A) İnsan", "B) Amip (Tek hücreli)", "C) Kedi", "D) Çam ağacı"],
      dogruCevap: "B"
    },
    {
      soru: "Hücre bölünmesi öncesinde DNA'nın kendini kopyalayarak miktarını iki katına çıkarmasına ne denir?",
      secenekler: ["A) Mutasyon", "B) DNA Eşlenmesi (Replikasyon)", "C) Krossing-over", "D) Mayoz"],
      dogruCevap: "B"
    },
    {
      soru: "Kırılan kemiklerin zamanla kaynaması ve onarılması hangi olay sayesinde gerçekleşir?",
      secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Fotosentez"],
      dogruCevap: "B"
    },
    {
      soru: "Mayoz bölünme hangi hücrelerde gerçekleşir?",
      secenekler: ["A) Vücut hücreleri", "B) Sadece sinir hücreleri", "C) Üreme ana hücreleri", "D) Deri hücreleri"],
      dogruCevap: "C"
    },
    {
      soru: "2n = 40 kromozomlu bir hayvan hücresi art arda 2 kez mitoz geçirdiğinde oluşacak son hücrelerin kromozom sayısı kaç olur?",
      secenekler: ["A) 10", "B) 20", "C) 40", "D) 80"],
      dogruCevap: "C"
    },
    {
      soru: "n = 15 kromozomlu üreme ana hücresi mayoz geçirdiğinde oluşan yeni hücrelerin kromozom sayısı kaç olur?",
      secenekler: ["A) 30", "B) 15", "C) 7.5", "D) 60"],
      dogruCevap: "B" // Dikkat: Üreme ana hücresi 2n'dir, n=15 ise 2n=30'dur. Mayoz geçiren hücrenin kromozomu n=15 olur.
    },
    {
      soru: "Bitki ve hayvan hücrelerinin mitoz bölünmesi arasındaki en belirgin fark aşağıdakilerden hangisidir?",
      secenekler: ["A) DNA'nın kendini eşlemesi", "B) Ara lamel (akut plaka) oluşumu ve boğumlanma", "C) Çekirdek zarının erimesi", "D) İğ ipliklerinin oluşması"],
      dogruCevap: "B"
    },
    {
      soru: "Hücrenin hayat döngüsünde bölünme öncesi hazırlık evresinde en önemli olay hangisidir?",
      secenekler: ["A) DNA'nın kendini eşlemesi", "B) Hücrenin küçülmesi", "C) Çekirdeğin yok olması", "D) Organellerin ölmesi"],
      dogruCevap: "A"
    },
    {
      soru: "İnsan vücudunda aşağıdaki hücrelerden hangisi mitoz bölünme geçiremez?",
      secenekler: ["A) Deri hücresi", "B) Karaciğer hücresi", "C) Olgun al yuvar ve sinir hücreleri", "D) Kas hücresi"],
      dogruCevap: "C"
    },
    {
      soru: "Mayoz bölünme kaç aşamada (safhada) gerçekleşir?",
      secenekler: ["A) Sadece Mayoz 1", "B) Mayoz 1 ve Mayoz 2", "C) Tek aşamalı", "D) 4 aşamalı mitoz"],
      dogruCevap: "B"
    },
    {
      soru: "Mayoz bölünme sonucunda oluşan hücrelerin özellikleri nasıldır?",
      secenekler: ["A) Kalıtsal yapıları birbirinden farklıdır ve n kromozomludur.", "B) Kalıtsal yapıları tamamen aynıdır ve 2n kromozomludur.", "C) Hepsi erkektir.", "D) Büyüme sağlarlar."],
      dogruCevap: "A"
    },
    {
      soru: "Aşağıdakilerden hangisi mitoz bölünmenin özelliklerinden biridir?",
      secenekler: ["A) Tür içi genetik çeşitliliği sağlar.", "B) Tek hücrelilerde üremeyi, çok hücrelilerde büyüme ve onarımı sağlar.", "C) Mayozdan daha uzun sürer.", "D) Parça değişimi gerçekleşir."],
      dogruCevap: "B"
    },
    {
      soru: "Embriyonun gelişerek bebeği oluşturması hangi hücre bölünmesi ile gerçekleşir?",
      secenekler: ["A) Mayoz", "B) Mitoz", "C) Döllenme", "D) Krossing-over"],
      dogruCevap: "B"
    },
    {
      soru: "Yaralanan bir derinin eski haline gelmesi süreci hangi olaylarla açıklanır?",
      secenekler: ["A) Deri hücrelerinin mitoz bölünme ile çoğalması", "B) Mayoz bölünme ile üreme hücrelerinin oluşması", "C) Hücrelerin su kaybetmesi", "D) DNA mutasyonu"],
      dogruCevap: "A"
    },
    {
      soru: "Çiçekli bir bitkide sperm (polen) ve yumurta hücrelerinin oluşumu hangi bölünmeyle sağlanır?",
      secenekler: ["A) Mitoz", "B) Mayoz", "C) Replikasyon", "D) Binar bölüme"],
      dogruCevap: "B"
    },
    {
      soru: "Aşağıdaki canlılardan hangisi mitoz bölünmeyle (veya tomurcuklanma/rejenarasyon gibi mitoz temelli olaylarla) üreyebilir?",
      secenekler: ["A) Denizyıldızı", "B) İnsan", "C) Kartal", "D) İnek"],
      dogruCevap: "A"
    },
    {
      soru: "Bir canlı türünün nesiller boyunca kromozom sayısının sabit kalmasını sağlayan temel olaylar ikilisi hangisidir?",
      secenekler: ["A) Mitoz ve Mutasyon", "B) Mayoz ve Döllenme", "C) Fotosentez ve Solunum", "D) Sindirim ve Boşaltım"],
      dogruCevap: "B"
    },
    {
      soru: "Hücrede kalıtsal bilgileri taşıyan, DNA ve özel proteinlerin birleşmesiyle oluşan yapılara ne denir?",
      secenekler: ["A) Kromozom", "B) Ribozom", "C) Koful", "D) Mitokondri"],
      dogruCevap: "A"
    },
    {
      soru: "Aşağıdaki ifadelerden hangisi doğrudur?",
      secenekler: ["A) Bütün sağlıklı insanların vücut hücrelerinde 46 kromozom bulunur.", "B) Kromozom sayısı ile canlının gelişmişliği arasında doğrudan ilişki vardır.", "C) Kedi ile insanın kromozom sayısı her zaman aynıdır.", "D) Mayoz geçiren bir hücrenin kromozom sayısı artar."],
      dogruCevap: "A"
    },
    {
      soru: "Mayoz 1'in başında homologous kromozomların yan yana gelmesiyle kardeş olmayan kromatitlerin parça değiştirmesine ne denir?",
      secenekler: ["A) Krossing-over (Parça değişimi)", "B) Klonlama", "C) Mayozlama", "D) Sitokinez"],
      dogruCevap: "A"
    },
    {
      soru: "Mitoz bölünmede çekirdek bölünmesinden hemen sonra ne gerçekleşir?",
      secenekler: ["A) Sitoplazma bölünmesi (Sitokinez)", "B) Mayoz 2", "C) Döllenme", "D) DNA eşlenmesi"],
      dogruCevap: "A"
    },
    {
      soru: "Bitki hücrelerinde sitoplazma bölünmesi sırasında boğumlanma olmaz, bunun yerine ne oluşur?",
      secenekler: ["A) Ara lamel (orta lamel)", "B) Çift zar", "C) Hücre duvarı erimesi", "D) Koful patlaması"],
      dogruCevap: "A"
    },
    {
      soru: "Hayvan hücrelerinde sitoplazma bölünmesi nasıl gerçekleşir?",
      secenekler: ["A) Dıştan içe doğru boğumlanarak", "B) Ara lamel oluşarak", "C) Patlayarak", "D) Bölünmeyerek"],
      dogruCevap: "A"
    },
    {
      soru: "Aşağıdakilerden hangisi hücrenin bölünme gerekçelerinden biri değildir?",
      secenekler: ["A) Hücrenin yüzey/hacim oranının bozulması ve besin alışverişinde zorlanması", "B) Hücrenin çok büyümesi", "C) DNA'nın çekirdeği yönetmekte zorlanması", "D) Hücrenin ölümsüzleşmek istemesi"],
      dogruCevap: "D"
    },
    {
      soru: "Tek hücreli canlılarda (örneğin parazit veya bakterilerde) mitoz benzeri bölünmeler neyi sağlar?",
      secenekler: ["A) Üremeyi (çoğalmayı)", "B) Sindirimi", "C) Doku onarımını", "D) Çeşitliliği"],
      dogruCevap: "A"
    },
    {
      soru: "Mayoz bölünme sonucunda oluşan 4 hücrenin özellikleri nasıldır?",
      secenekler: ["A) Birbirinden farklı 4 yeni hücre", "B) Birbirinin aynısı 4 hücre", "C) 2 büyük 2 küçük hücre", "D) 4 tane 2n hücre"],
      dogruCevap: "A"
    },
    {
      soru: "Aşağıdaki canlıların hangisinde üreme hücreleri mayozla oluşmaz?",
      secenekler: ["A) Bakteri (Tek hücreli prokaryot)", "B) İnsan", "C) Kuş", "D) Eğrelti otu"],
      dogruCevap: "A" // Bakteriler amitoz benzeri (bölünerek) çoğalır.
    },
    {
      soru: "Kromozom sayısı 2n = 70 olan bir bitki hücresi 3 kez mitoz geçirirse, oluşan toplam hücre sayısı kaç olur?",
      secenekler: ["A) 6", "B) 8", "C) 16", "D) 32"],
      dogruCevap: "B" // 2 üssü 3 = 8 hücre
    },
    {
      soru: "Mayoz bölünmede kromozom sayısının yarıya indiği evre hangisidir?",
      secenekler: ["A) Mayoz 1", "B) Mayoz 2", "C) İnterfaz", "D) Sitokinez 2"],
      dogruCevap: "A"
    },
    {
      soru: "Mayoz 2'nin temel olarak hangi olaya benzediği söylenir?",
      secenekler: ["A) Mitoz bölünmeye", "B) Döllenmeye", "C) Sindirime", "D) Solunuma"],
      dogruCevap: "A"
    },
    {
      soru: "Saçımızın uzaması, tırnağımızın uzaması hangi bölünme çeşidiyle gerçekleşir?",
      secenekler: ["A) Mitoz", "B) Mayoz", "C) Krossing-over", "D) Sperm oluşumu"],
      dogruCevap: "A"
    },
    {
      soru: "Aşağıdakilerden hangisi ortak bir özelliktir? (Mitoz ve Mayoz için)",
      secenekler: ["A) İğ ipliklerinin oluşması", "B) Parça değişimi", "C) Kromozom sayısının yarıya inmesi", "D) 4 hücre oluşumu"],
      dogruCevap: "A"
    },
    {
      soru: "Kardeş kromatitlerin birbirinden ayrıldığı evre hangi bölünmelerde görülür?",
      secenekler: ["A) Hem mitozda hem mayoz 2'de", "B) Sadece mayoz 1'de", "C) Sadece mayoz 2'de", "D) Hiçbirinde"],
      dogruCevap: "A"
    },
    {
      soru: "Canlıların kalıtsal özelliklerini nesilden nesile aktarmasını ve çeşitlilik kazanmasını sağlayan ana süreç nedir?",
      secenekler: ["A) Mayoz ve Eşeyli Üreme", "B) Mitoz ve Büyüme", "C) Solunum", "D) Fotosentez"],
      dogruCevap: "A"
    },
    {
      soru: "2. Ünite Son Soru: Vücudumuzdaki bir yaranın iyileşmesi sırasında gerçekleşen hücre bölünmesi sonucunda oluşan yeni hücrelerin DNA'ları ana hücre ile nasıldır?",
      secenekler: ["A) Tamamen aynıdır.", "B) Tamamen farklıdır.", "C) Kromozom sayısı yarıya inmiştir.", "D) Çeşitlilik göstermiştir."],
      dogruCevap: "A"
    }
  ]
};

// Oyun yöneticisi ve turnuva fonksiyonları buraya eklenebilir.
console.log("Soru havuzu başarıyla yüklendi. Toplam ünite:", Object.keys(SORU_HAVUZU).length);
