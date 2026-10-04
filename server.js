const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

app.use(express.static(__dirname));
app.use('/ses', express.static(path.join(__dirname, 'ses')));
app.use('/muzik', express.static(path.join(__dirname, 'ses/muzik')));
app.use('/karakterler', express.static(path.join(__dirname, 'karakterler')));

// ================= MÜZİK ÇÖZÜCÜ (dosya adı / büyük-küçük harf / uzantı farkı olsa da bulur) =================
const SES_UZANTILARI = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.webm'];
function muzikDosyalari() {
    const kokler = [path.join(__dirname, 'ses/muzik'), path.join(__dirname, 'ses'), path.join(__dirname, 'muzik'), __dirname];
    const bulunan = [];
    const tara = (klasor, derinlik) => {
        let liste = [];
        try { liste = fs.readdirSync(klasor, { withFileTypes: true }); } catch (e) { return; }
        for (const f of liste) {
            const tam = path.join(klasor, f.name);
            if (f.isDirectory() && derinlik < 2 && f.name !== 'node_modules' && !f.name.startsWith('.')) tara(tam, derinlik + 1);
            else if (f.isFile() && SES_UZANTILARI.includes(path.extname(f.name).toLowerCase())) bulunan.push(tam);
        }
    };
    kokler.forEach(k => tara(k, 0));
    return [...new Set(bulunan)];
}
const adSadelestir = (a) => a.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]/g, '');
function muzikBul(istenen) {
    const anahtar = adSadelestir(istenen);
    const dosyalar = muzikDosyalari();
    return dosyalar.find(f => adSadelestir(path.basename(f)) === anahtar)
        || dosyalar.find(f => { const n = adSadelestir(path.basename(f)); return anahtar && (n.includes(anahtar) || anahtar.includes(n)); })
        || null;
}
app.get('/muzik/:ad', (req, res) => {
    const f = muzikBul(req.params.ad);
    if (f) return res.sendFile(f);
    res.status(404).send('Müzik bulunamadı: ' + req.params.ad + ' — sunucunun bulduğu dosyalar için /muzik-liste adresine bak.');
});
app.get('/muzik-liste', (req, res) => res.json(muzikDosyalari().map(f => path.relative(__dirname, f))));

// ================= KONU ANLATIMI İÇERİKLERİ (yeni ünite eklemek için aynı yapıyı kopyala) =================
const UNITELER = {
    gunes: {
        ad: 'Güneş Sistemi ve Tutulmalar', ikon: '🪐', renk: '#ff8c00',
        konular: [
            { baslik: 'Güneş, Dünya ve Ay', sure: '10 dk', bolumler: [
                { b: '🎯 Bu konuda öğreneceklerin', k: 'bilgi', t: '<ul><li>Güneş, Dünya ve Ay\'ın özelliklerini karşılaştıracaksın.</li><li>Işık kaynağı ile ışığı yansıtan cismi ayırt edeceksin.</li><li>Boyut ve uzaklık ilişkisini yorumlayacaksın.</li></ul>' },
                { b: '☀️ Güneş', t: '<p>Güneş bir <b>yıldızdır</b>; kendi ışığını ve ısısını üretir (ışık kaynağıdır). Güneş sistemindeki tek yıldız Güneş\'tir ve sistemin kütlesinin büyük bölümü ondadır. Çapı Dünya\'nın yaklaşık <b>109 katıdır</b>. Yüzeyi çok sıcak, gazlardan oluşan bir küredir; Dünya\'daki yaşam için ışık ve ısı sağlar.</p>' },
                { b: '🌍 Dünya', t: '<p>Dünya, üzerinde sıvı su ve yaşam bulunan bilinen tek gezegendir. Kendi ışığı yoktur; Güneş\'ten gelen ışığı yansıtır. Güneş\'e yaklaşık <b>150 milyon km</b> uzaktadır. Kendi ekseni etrafında dönmesiyle <b>gece-gündüz</b>, Güneş etrafında dolanmasıyla (eksen eğikliğiyle birlikte) <b>mevsimler</b> oluşur.</p>' },
                { b: '🌙 Ay', t: '<p>Ay, Dünya\'nın <b>tek doğal uydusudur</b>. Kendi ışığı yoktur, Güneş ışığını yansıttığı için parlak görünür. Çapı Dünya\'nın yaklaşık dörtte biridir; Dünya\'ya yaklaşık <b>384.000 km</b> uzaktadır. Yüzeyi kraterlerle kaplıdır ve atmosferi yoktur; bu yüzden Ay\'da ses yayılmaz, gökyüzü gündüz bile siyah görünür.</p>' },
                { b: '📊 Karşılaştırma tablosu', t: '<table><tr><th>Özellik</th><th>Güneş</th><th>Dünya</th><th>Ay</th></tr><tr><td>Tür</td><td>Yıldız</td><td>Gezegen</td><td>Uydu</td></tr><tr><td>Kendi ışığı</td><td>Var</td><td>Yok</td><td>Yok</td></tr><tr><td>Atmosfer</td><td>Gaz küre</td><td>Var</td><td>Yok</td></tr><tr><td>Boyut sırası</td><td>1. (en büyük)</td><td>2.</td><td>3. (en küçük)</td></tr></table>' },
                { b: '💡 Sınav ipucu', k: 'ipucu', t: '<p>"Hangisi ışık kaynağıdır?" sorusunda cevap hep <b>yıldızdır</b>. Ay parlak görünür ama ışığı yansıtır, ışık kaynağı değildir.</p>' }
            ], kavrama: [
                { soru: 'Aşağıdakilerden hangisi kendi ışığını üretir?', secenekler: ['Ay', 'Dünya', 'Güneş', 'Mars'], cevap: 2, aciklama: 'Güneş bir yıldızdır; ışık kaynağı yalnızca yıldızlardır.' },
                { soru: 'Ay\'da ses yayılmamasının nedeni nedir?', secenekler: ['Çok soğuk olması', 'Atmosferinin olmaması', 'Çok küçük olması', 'Işık almaması'], cevap: 1, aciklama: 'Ses, yayılmak için madde (hava gibi) ister; Ay\'da atmosfer yoktur.' }
            ] },
            { baslik: 'Ay\'ın Evreleri', sure: '10 dk', bolumler: [
                { b: '🎯 Bu konuda öğreneceklerin', k: 'bilgi', t: '<ul><li>Ay\'ın evrelerini sırasıyla sayacaksın.</li><li>Evrelerin neden oluştuğunu açıklayacaksın.</li></ul>' },
                { b: '🔄 Evreler neden oluşur?', t: '<p>Ay\'ın Güneş\'e bakan yarısı <b>her zaman aydınlıktır</b>. Ay, Dünya etrafında dolandıkça biz bu aydınlık yüzün farklı miktarlarını görürüz. Yani evreler Dünya\'nın gölgesiyle <b>oluşmaz</b>; yalnızca bizim bakış açımızın değişmesidir. Bir evre döngüsü yaklaşık <b>29,5 gün</b> sürer.</p>' },
                { b: '🌘 Evre sırası', t: '<ol><li><b>Yeni Ay:</b> Ay, Dünya ile Güneş arasındadır; aydınlık yüz bize dönük değildir, Ay görünmez.</li><li><b>Hilal</b> (büyüyen)</li><li><b>İlk Dördün:</b> Ay\'ın yarısı görünür.</li><li><b>Şişkin Ay</b></li><li><b>Dolunay:</b> Dünya, Ay ile Güneş arasındadır; aydınlık yüz tamamen görünür.</li><li><b>Şişkin Ay</b> (küçülen)</li><li><b>Son Dördün</b></li><li><b>Hilal</b> (küçülen) → tekrar Yeni Ay</li></ol>' },
                { b: '🔎 Bilmeye değer', k: 'bilgi', t: '<p>Ay, kendi etrafında dönme süresi ile Dünya etrafında dolanma süresi yaklaşık eşit olduğu için Dünya\'dan hep <b>aynı yüzünü</b> görürüz.</p>' },
                { b: '💡 Sınav ipucu', k: 'ipucu', t: '<p>Yeni Ay ve Dolunay uç noktalardır: <b>Yeni Ay = Güneş-Ay-Dünya</b> dizilimi, <b>Dolunay = Güneş-Dünya-Ay</b> dizilimi.</p>' }
            ], kavrama: [
                { soru: 'Ay\'ın tamamen görünür olduğu evre hangisidir?', secenekler: ['Yeni Ay', 'Dolunay', 'İlk Dördün', 'Hilal'], cevap: 1, aciklama: 'Dolunayda aydınlık yüz tamamen bize dönüktür.' },
                { soru: 'Ay evrelerinin oluşma nedeni nedir?', secenekler: ['Dünya\'nın gölgesi', 'Bulutlar', 'Ay\'ın aydınlık yarısını farklı açılardan görmemiz', 'Ay\'ın şeklinin değişmesi'], cevap: 2, aciklama: 'Ay hep yarım küre aydınlıktır; biz farklı oranda görürüz.' }
            ] },
            { baslik: 'Güneş ve Ay Tutulması', sure: '12 dk', bolumler: [
                { b: '🎯 Bu konuda öğreneceklerin', k: 'bilgi', t: '<ul><li>Güneş ve Ay tutulmasının oluşumunu açıklayacaksın.</li><li>Tutulmaların hangi evrede olduğunu bileceksin.</li></ul>' },
                { b: '🌑 Güneş tutulması', t: '<p><b>Yeni Ay</b> evresinde <b>Ay, Güneş ile Dünya arasına</b> girer. Ay\'ın gölgesi Dünya\'nın bir bölgesine düşer. Gölgenin tam düştüğü yerde <b>tam Güneş tutulması</b>, yarı gölgede <b>kısmi tutulma</b> görülür. Güneş tutulması gündüz olur ve Dünya\'nın yalnızca belirli bölgelerinden görülür.</p>' },
                { b: '🌕 Ay tutulması', t: '<p><b>Dolunay</b> evresinde <b>Dünya, Güneş ile Ay arasına</b> girer. Dünya\'nın gölgesi Ay\'a düşer. Gece olan Dünya\'nın her yerinden görülebilir ve Güneş tutulmasından daha uzun sürer.</p>' },
                { b: '❓ Her ay neden tutulma olmaz?', t: '<p>Ay\'ın yörüngesi, Dünya\'nın Güneş etrafındaki yörünge düzlemine yaklaşık <b>5° eğiktir</b>. Bu yüzden Yeni Ay ve Dolunayda üç gök cismi çoğu zaman tam doğrultuda olmaz.</p>' },
                { b: '📊 Karşılaştırma tablosu', t: '<table><tr><th></th><th>Güneş Tutulması</th><th>Ay Tutulması</th></tr><tr><td>Evre</td><td>Yeni Ay</td><td>Dolunay</td></tr><tr><td>Ortadaki cisim</td><td>Ay</td><td>Dünya</td></tr><tr><td>Gölge düşen cisim</td><td>Dünya</td><td>Ay</td></tr></table>' },
                { b: '⚠️ Güvenlik', k: 'ipucu', t: '<p>Güneş tutulmasına çıplak gözle bakılmaz; gözde kalıcı hasar yapar. Uygun tutulma gözlüğü kullanılmalıdır.</p>' }
            ], kavrama: [
                { soru: 'Güneş tutulmasında ortadaki gök cismi hangisidir?', secenekler: ['Dünya', 'Ay', 'Mars', 'Güneş'], cevap: 1, aciklama: 'Ay, Güneş ile Dünya arasına girer.' },
                { soru: 'Ay tutulması hangi evrede gerçekleşir?', secenekler: ['Yeni Ay', 'İlk Dördün', 'Dolunay', 'Son Dördün'], cevap: 2, aciklama: 'Dünya\'nın gölgesi ancak Dolunayda Ay\'a düşebilir.' }
            ] },
            { baslik: 'Gezegenler', sure: '12 dk', bolumler: [
                { b: '🎯 Bu konuda öğreneceklerin', k: 'bilgi', t: '<ul><li>Gezegenleri Güneş\'e yakınlığa göre sıralayacaksın.</li><li>Kayalık ve gaz gezegenleri ayıracaksın.</li></ul>' },
                { b: '🪐 Güneş\'ten uzaklığa göre sıra', t: '<p><b>Merkür, Venüs, Dünya, Mars</b> (kayalık, iç gezegenler) — <b>Jüpiter, Satürn, Uranüs, Neptün</b> (gaz/buz devleri, dış gezegenler). Ezber için: <i>"Mert Vedat Dünya\'ya Maça Jüpiter Sahasında Ugramadan Nasıl gitti?"</i> gibi kendi cümleni kurabilirsin.</p>' },
                { b: '⭐ Gezegenlerin kimlik kartı', t: '<table><tr><th>Gezegen</th><th>Akılda kalacak özellik</th></tr><tr><td>Merkür</td><td>Güneş\'e en yakın, en küçük gezegen</td></tr><tr><td>Venüs</td><td>En sıcak gezegen (yoğun atmosfer, sera etkisi)</td></tr><tr><td>Dünya</td><td>Sıvı su ve yaşam var</td></tr><tr><td>Mars</td><td>Kızıl Gezegen (yüzeyi demir oksitli)</td></tr><tr><td>Jüpiter</td><td>En büyük gezegen</td></tr><tr><td>Satürn</td><td>Belirgin halkalarıyla ünlü</td></tr><tr><td>Uranüs</td><td>Eksenine göre yan yatık döner</td></tr><tr><td>Neptün</td><td>Güneş\'e en uzak gezegen</td></tr></table>' },
                { b: '💡 Sınav ipucu', k: 'ipucu', t: '<p>Güneş\'e en yakın gezegen en sıcağı <b>değildir</b>: en yakın Merkür, en sıcak Venüs\'tür.</p>' }
            ], kavrama: [
                { soru: 'Güneş sisteminin en büyük gezegeni hangisidir?', secenekler: ['Satürn', 'Jüpiter', 'Neptün', 'Dünya'], cevap: 1, aciklama: 'Jüpiter en büyük gezegendir.' },
                { soru: 'En sıcak gezegen hangisidir?', secenekler: ['Merkür', 'Venüs', 'Mars', 'Jüpiter'], cevap: 1, aciklama: 'Venüs\'ün yoğun atmosferi sera etkisi yaratır.' }
            ] }
        ]
    },
    madde: {
        ad: 'Madde ve Isı (Örnek Ünite)', ikon: '🔥', renk: '#ff4757',
        konular: [
            { baslik: 'Isı ve Sıcaklık', sure: '8 dk', bolumler: [
                { b: '🌡️ Isı ve sıcaklık farkı', t: '<p><b>Sıcaklık</b> maddeyi oluşturan taneciklerin ortalama hareket enerjisinin göstergesidir (°C ile ölçülür, termometre kullanılır). <b>Isı</b> ise sıcaklık farkından dolayı aktarılan enerjidir (joule/kalori). Isı her zaman <b>sıcaktan soğuğa</b> akar.</p>' },
                { b: '💡 Sınav ipucu', k: 'ipucu', t: '<p>Sıcaklık maddenin miktarına bağlı değildir; ısı ise madde miktarına bağlıdır.</p>' }
            ], kavrama: [
                { soru: 'Isı kendiliğinden nasıl akar?', secenekler: ['Soğuktan sıcağa', 'Sıcaktan soğuğa', 'Her yöne eşit', 'Akmaz'], cevap: 1, aciklama: 'Isı, sıcaklığı yüksek cisimden düşük cisme akar.' }
            ] }
        ]
    }
};
// Yeni ünite eklemek için: UNITELER.yeniid = { ad, ikon, renk, konular:[{baslik, sure, bolumler:[{b,t,k}], kavrama:[{soru,secenekler,cevap,aciklama}]}] }

function uniteSoruHavuzu(id) {
    if (id === 'gunes') return FEN_SORULARI.concat(...UNITELER.gunes.konular.map(k => k.kavrama));
    if (UNITELER[id]) return [].concat(...UNITELER[id].konular.map(k => k.kavrama));
    return null;
}
function soruSec(id) {
    let havuz = uniteSoruHavuzu(id);
    if (!havuz || havuz.length === 0) {
        havuz = [];
        Object.keys(UNITELER).forEach(u => { havuz = havuz.concat(uniteSoruHavuzu(u)); });
    }
    return havuz[Math.floor(Math.random() * havuz.length)];
}

const SAYFA_CSS = `body{margin:0;background:#0a0a0a;color:#eee;font-family:'Segoe UI',sans-serif}a{color:#FFD700;text-decoration:none}
.top{display:flex;align-items:center;gap:14px;padding:12px 22px;background:#111;border-bottom:2px solid #FFD700;position:sticky;top:0;z-index:5}
.btn{background:#FFD700;color:#000;border:none;padding:10px 18px;border-radius:10px;font-weight:bold;cursor:pointer;font-size:14px;display:inline-block}.btn.alt{background:#333;color:#FFD700;border:1px solid #FFD700}`;

app.get('/unite-sec', (req, res) => {
    const liste = Object.keys(UNITELER).map(id => ({ id, ad: UNITELER[id].ad, ikon: UNITELER[id].ikon, renk: UNITELER[id].renk, soru: uniteSoruHavuzu(id).length }));
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ünite Seç</title><style>${SAYFA_CSS}
    .wrap{max-width:900px;margin:30px auto;padding:0 18px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
    .kart{background:linear-gradient(145deg,#1e1e1e,#000);border:2px solid var(--c);border-radius:16px;padding:20px}.kart h3{margin:6px 0;color:var(--c)}.kart .btn{width:100%;box-sizing:border-box;margin-top:8px;text-align:center}</style></head><body>
    <div class="wrap"><h1 style="color:#FFD700">⚔️ Hangi üniteden soru istiyorsun?</h1><p style="color:#aaa">Sandıklardan çıkacak sorular seçtiğin üniteden gelecek. Hazır değilsen önce konuyu çalışabilirsin.</p><div class="grid" id="g"></div>
    <p><a href="/karakter-sec">← Karakter ekranına dön</a></p></div>
    <script>var L=${JSON.stringify(liste)};var g=document.getElementById('g');
    function kart(id,ad,ikon,renk,soru,calis){var d=document.createElement('div');d.className='kart';d.style.setProperty('--c',renk);
      d.innerHTML='<div style="font-size:34px">'+ikon+'</div><h3>'+ad+'</h3><div style="color:#aaa;font-size:12px">'+soru+' soru havuzu</div>'+
      '<button class="btn" onclick="sec(\\''+id+'\\')">⚔️ Bu Üniteyle Savaşa Gir</button>'+(calis?'<a class="btn alt" href="/konu-anlatimi?u='+id+'">📖 Önce Konuyu Çalış</a>':'');g.appendChild(d);}
    L.forEach(function(u){kart(u.id,u.ad,u.ikon,u.renk,u.soru,true);});
    var t=0;L.forEach(function(u){t+=u.soru;});kart('karisik','Karışık (Tüm Üniteler)','🎲','#00ffcc',t,false);
    function sec(id){sessionStorage.setItem('secilenUnite',id);location.href='/oyun-alani';}</script></body></html>`);
});

app.get('/konu-anlatimi', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Konu Anlatımı</title><style>${SAYFA_CSS}
    .ana{display:flex;min-height:calc(100vh - 62px)}.yan{width:290px;background:#111;border-right:1px solid #333;padding:16px;box-sizing:border-box;flex-shrink:0}
    .yan .it{padding:12px;border-radius:10px;margin-bottom:8px;background:#1b1b1b;cursor:pointer;border:1px solid #333;font-size:14px}.yan .it.aktif{border-color:#FFD700;background:#2a2410}.yan .it.bitti:before{content:'✅ '}
    .icerik{flex:1;padding:24px 34px;max-width:860px}.cubuk{height:10px;background:#333;border-radius:6px;overflow:hidden;width:220px}.cubuk div{height:100%;background:linear-gradient(90deg,#00ff64,#FFD700);width:0;transition:.4s}
    .blok{background:#161616;border:1px solid #333;border-left:5px solid #FFD700;border-radius:12px;padding:14px 20px;margin:14px 0;line-height:1.7}.blok h3{margin:0 0 6px;color:#FFD700}
    .blok.bilgi{border-left-color:#0096ff}.blok.ipucu{border-left-color:#00ff64;background:#10200f}table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:8px;text-align:left}th{background:#2a2410;color:#FFD700}
    .opt{display:block;width:100%;text-align:left;margin:8px 0;padding:11px;background:#222;color:#fff;border:1px solid #555;border-radius:8px;cursor:pointer;font-size:14px}.opt:hover{border-color:#FFD700}.opt.d{background:#0f3d1c;border-color:#00ff64}.opt.y{background:#4a1414;border-color:#ff4757}
    .fb{margin-top:8px;padding:10px;border-radius:8px;background:#1b1b1b;font-size:14px}@media(max-width:760px){.ana{flex-direction:column}.yan{width:100%}.icerik{padding:16px}}</style></head><body>
    <div class="top"><a href="/">🏠</a><b id="ub" style="color:#FFD700"></b><div class="cubuk"><div id="pb"></div></div><span id="pt" style="font-size:13px"></span><span style="margin-left:auto">⭐ XP: <b id="xp">0</b></span>
    <a class="btn alt" href="/unite-sec">⚔️ Savaşa</a></div>
    <div class="ana"><div class="yan" id="yan"></div><div class="icerik" id="ic"></div></div>
    <script>var U=${JSON.stringify(UNITELER)};
    var P=JSON.parse(localStorage.getItem('bu_ilerleme')||'{}');
    var uid=new URLSearchParams(location.search).get('u');if(!U[uid])uid=Object.keys(U)[0];
    var un=U[uid],st=P[uid]=P[uid]||{done:[],best:0,xp:0},cur=0;
    function kaydet(){localStorage.setItem('bu_ilerleme',JSON.stringify(P));}
    function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
    function ust(){document.getElementById('ub').innerText=un.ikon+' '+un.ad;var y=Math.round(st.done.length/un.konular.length*100);
      document.getElementById('pb').style.width=y+'%';document.getElementById('pt').innerText='%'+y+' tamamlandı';document.getElementById('xp').innerText=st.xp;
      var yan=document.getElementById('yan');yan.innerHTML='<div style="color:#aaa;font-size:12px;margin-bottom:8px">KONULAR</div>';
      un.konular.forEach(function(k,i){var d=el('div','it'+(i===cur?' aktif':'')+(st.done.indexOf(i)>-1?' bitti':''),(i+1)+'. '+k.baslik+'<div style="font-size:11px;color:#888">⏱ '+k.sure+'</div>');d.onclick=function(){cur=i;ders();};yan.appendChild(d);});
      var t=el('div','it'+(cur===-1?' aktif':''),'📝 Ünite Testi'+(st.best?'<div style="font-size:11px;color:#888">En iyi: '+st.best+'%</div>':''));t.onclick=function(){cur=-1;test();};yan.appendChild(t);}
    function quiz(list,box,bitir){var i=0,dogru=0;function goster(){box.innerHTML='';var q=list[i],kilit=false;
      box.appendChild(el('div','',"<b>"+(i+1)+'/'+list.length+' — '+q.soru+'</b>'));var fb=el('div','fb');fb.style.display='none';var bt=[];
      q.secenekler.forEach(function(s,k){var b=el('button','opt',s);bt.push(b);b.onclick=function(){if(kilit)return;kilit=true;
        if(k===q.cevap){b.className='opt d';dogru++;fb.innerHTML='✅ Doğru! '+(q.aciklama||'');}else{b.className='opt y';bt[q.cevap].className='opt d';fb.innerHTML='❌ Doğru cevap: <b>'+q.secenekler[q.cevap]+'</b>. '+(q.aciklama||'');}
        fb.style.display='block';var n=el('button','btn',i+1<list.length?'Sonraki →':'Bitir');n.style.marginTop='10px';n.onclick=function(){i++;if(i<list.length)goster();else bitir(dogru,list.length);};fb.appendChild(el('br'));fb.appendChild(n);};box.appendChild(b);});box.appendChild(fb);}goster();}
    function ders(){ust();var k=un.konular[cur],ic=document.getElementById('ic');ic.innerHTML='<h1 style="color:#FFD700;margin-top:0">'+(cur+1)+'. '+k.baslik+'</h1>';
      k.bolumler.forEach(function(b){ic.appendChild(el('div','blok '+(b.k||''),'<h3>'+b.b+'</h3>'+b.t));});
      var kb=el('div','blok','<h3>🧠 Kavrama Soruları</h3>');var qb=el('div');kb.appendChild(qb);ic.appendChild(kb);
      quiz(k.kavrama,qb,function(d,n){qb.innerHTML='<b>Sonuç: '+d+'/'+n+'</b>';if(st.done.indexOf(cur)<0){st.done.push(cur);st.xp+=10*d+20;kaydet();}
        var son=cur+1<un.konular.length;var b=el('button','btn',son?'Sonraki Konu →':'📝 Ünite Testine Geç');b.style.marginTop='10px';b.onclick=function(){if(son){cur++;ders();}else{cur=-1;test();}window.scrollTo(0,0);};qb.appendChild(el('br'));qb.appendChild(b);ust();});}
    function test(){ust();var ic=document.getElementById('ic');ic.innerHTML='<h1 style="color:#FFD700;margin-top:0">📝 Ünite Testi</h1>';var havuz=[];un.konular.forEach(function(k){havuz=havuz.concat(k.kavrama);});
      var kb=el('div','blok');ic.appendChild(kb);quiz(havuz,kb,function(d,n){var y=Math.round(d/n*100);if(y>st.best)st.best=y;st.xp+=d*15;kaydet();
        kb.innerHTML='<h2>Sonuç: %'+y+' ('+d+'/'+n+')</h2><p>'+(y>=80?'🏆 Harika! Savaşa hazırsın.':'Eksik konulara tekrar göz at.')+'</p><button class="btn" onclick="sessionStorage.setItem(\\'secilenUnite\\',uid);location.href=\\'/oyun-alani\\'">⚔️ Bu Üniteyle Savaşa Gir</button>';ust();});}
    ders();</script></body></html>`);
});


const db = mysql.createConnection({ 
    host: process.env.DB_HOST || '127.0.0.1', 
    port: process.env.DB_PORT || 8889, 
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'root', 
    database: process.env.DB_NAME || 'bilgi_ussu_proje' 
});

db.connect((err) => {
    if (err) {
        console.log("⚠️ Veritabanı bağlantısı sağlanamadı, bellek içi modda devam ediliyor.");
    } else {
        console.log("✅ Veritabanı bağlantısı başarılı.");
    }
});

const layout = (content, title = "BİLGİ ÜSSÜ - BRAWL ARENA") => `
    <!DOCTYPE html><html><head><title>${title}</title><style>
        body { background:#0a0a0a; color:#FFD700; font-family: 'Segoe UI', sans-serif; margin:0; min-height:100vh; display:flex; justify-content:center; align-items:center; }
        .box { background:linear-gradient(145deg, #1e1e1e, #000); padding:40px; border-radius:20px; border:2px solid #FFD700; width:500px; text-align:center; box-shadow:0 0 40px rgba(255,215,0,0.2); }
        .btn { display:block; padding:15px; margin:10px 0; border-radius:10px; background:#FFD700; color:#000; font-weight:bold; text-decoration:none; cursor:pointer; border:none; transition:0.3s; font-size:16px; width:100%; box-sizing:border-box; }
        .btn:hover { background:#ffc107; transform:scale(1.02); }
    </style></head><body>
        <div class="box">${content}</div>
    </body></html>`;

app.get('/', (req, res) => res.send(layout(`
    <h1>BİLGİ ÜSSÜ</h1>
    <p>Fen Bilimleri Kaliteli Chest Soruları & Arena</p><br>
    <a href="/konu-anlatimi" class="btn" style="background:#0096ff; color:#fff;">📚 Konu Çalış</a>
    <a href="/karakter-sec" class="btn" style="background:#ff4757; color:#fff;">🎨 Karakterini Tasarla ve Başla</a>
`)));

app.get('/karakter-sec', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Karakter Tasarımı</title><style>
            body { background:#0a0a0a; color:#FFD700; font-family:'Segoe UI', sans-serif; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; }
            .box { background:linear-gradient(145deg, #1e1e1e, #000); padding:25px; border-radius:20px; border:2px solid #FFD700; width:420px; text-align:center; box-shadow:0 0 30px rgba(255,215,0,0.2); }
            input[type="text"], input[type="file"], input[type="color"] { width: 100%; padding: 8px; margin: 6px 0; border-radius: 8px; border: 1px solid #444; background: #111; color: #fff; box-sizing: border-box; text-align: center; font-size: 14px; }
            input[type="file"] { cursor: pointer; padding: 6px; }
            .btn { display:block; padding:12px; margin-top:10px; border-radius:10px; background:#FFD700; color:#000; font-weight:bold; text-decoration:none; cursor:pointer; border:none; width:100%; font-size:15px; transition:0.3s; }
            .btn:hover { background:#ffc107; transform:scale(1.02); }
            canvas { background:#222; border:3px solid #FFD700; border-radius:50%; cursor:crosshair; box-shadow:0 0 15px rgba(255,215,0,0.3); margin: 8px auto; display:block; }
        </style></head><body>
            <div class="box">
                <h2>ÖZEL KARAKTER TASARIMI</h2>
                <p style="font-size:12px; color:#aaa;">Fen Bilgisi Chest Arenası</p>
                
                <input type="text" id="oyuncuAdi" placeholder="Oyuncu Adın" maxlength="12" value="Savaşçı">
                
                <div style="text-align:left; font-size:12px; color:#FFD700; margin-top:4px;">Karakter Görseli Seç:</div>
                <input type="file" id="dosyaSecici" accept="image/*" onchange="resimYukle(event)">

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <span style="font-size:12px; color:#FFD700;">Fırça Rengi:</span>
                    <input type="color" id="fircaRengi" value="#FF4757" style="width:70%; height:35px; padding:2px; cursor:pointer;">
                </div>

                <canvas id="tasarimCanvas" width="130" height="130"></canvas>
                
                <div style="display:flex; gap:10px;">
                    <button type="button" class="btn" style="background:#333; color:#FFD700; padding:8px; font-size:12px;" onclick="temizleCanvas()">Temizle</button>
                    <button type="button" class="btn" style="padding:8px; font-size:12px;" onclick="oyunaBasla()">Savaş Alanına Gir!</button>
                </div>
                
                <br><a href="/" style="color:#888; font-size:12px; text-decoration:none;">Ana Sayfaya Dön</a>
            </div>
            <script>
                const canvas = document.getElementById('tasarimCanvas');
                const ctx = canvas.getContext('2d');
                let ciziyor = false;

                ctx.fillStyle = "#111";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                canvas.addEventListener('mousedown', (e) => { ciziyor = true; ciz(e); });
                window.addEventListener('mouseup', () => ciziyor = false);
                canvas.addEventListener('mousemove', ciz);

                function ciz(e) {
                    if (!ciziyor) return;
                    const rect = canvas.getBoundingClientRect();
                    let x = e.clientX - rect.left;
                    let y = e.clientY - rect.top;

                    ctx.fillStyle = document.getElementById('fircaRengi').value;
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }

                function resimYukle(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = function(f) {
                        const img = new Image();
                        img.onload = function() {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            let sourceWidth = img.width;
                            let sourceHeight = img.height;
                            let size = Math.min(sourceWidth, sourceHeight);
                            let sourceX = (sourceWidth - size) / 2;
                            let sourceY = (sourceHeight - size) / 2;

                            ctx.fillStyle = "#111";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, canvas.width, canvas.height);
                        }
                        img.src = f.target.result;
                    }
                    reader.readAsDataURL(file);
                }

                function temizleCanvas() {
                    ctx.fillStyle = "#111";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                function oyunaBasla() {
                    let isim = document.getElementById('oyuncuAdi').value || 'Savaşçı';
                    let avatarData = canvas.toDataURL();
                    
                    sessionStorage.setItem('oyuncuIsim', isim);
                    sessionStorage.setItem('oyuncuAvatar', avatarData);
                    
                    window.location.href = '/unite-sec';
                }
            </script>
        </body></html>
    `);
});

const FEN_SORULARI = [
    { soru: "Güneş'e en yakın olan gezegen hangisidir?", secenekler: ["Merkür", "Venüs", "Dünya", "Mars"], cevap: 0 },
    { soru: "Halkalarıyla ünlü gaz devi gezegen hangisidir?", secenekler: ["Jüpiter", "Satürn", "Uranüs", "Neptün"], cevap: 1 },
    { soru: "Güneş sisteminin en sıcak gezegeni hangisidir?", secenekler: ["Merkür", "Venüs", "Mars", "Jüpiter"], cevap: 1 },
    { soru: "Üzerinde sıvı su bulunduran ve yaşam olan tek gezegen hangisidir?", secenekler: ["Mars", "Venüs", "Dünya", "Neptün"], cevap: 2 },
    { soru: "Kızıl Gezegen olarak bilinen gezegen hangisidir?", secenekler: ["Jüpiter", "Mars", "Satürn", "Merkür"], cevap: 1 },
    { soru: "Güneş sisteminin en büyük gezegeni hangisidir?", secenekler: ["Satürn", "Jüpiter", "Uranüs", "Neptün"], cevap: 1 },
    { soru: "Güneş'e en uzak olan gezegen hangisidir?", secenekler: ["Uranüs", "Neptün", "Satürn", "Jüpiter"], cevap: 1 },
    { soru: "Güneş tutulmasında hangi gök cismi ortadadır?", secenekler: ["Dünya", "Güneş", "Ay", "Mars"], cevap: 2 },
    { soru: "Ay tutulmasında hangi gök cismi ortadadır?", secenekler: ["Ay", "Dünya", "Güneş", "Venüs"], cevap: 1 },
    { soru: "Güneş tutulması olayı ayın hangi evresinde gerçekleşir?", secenekler: ["Yeni Ay", "Dolunay", "İlk Dördün", "Son Dördün"], cevap: 0 }
];

const HARITA_GENISLIK = 2000;
const HARITA_YUKSEKLIK = 1500;

const BOLGELER = [
    { isim: "TURUNCU BÖLGE", x: 0, y: 0, w: 1000, h: 750, renk: "rgba(255, 140, 0, 0.08)", yaziRengi: "#ff8c00" },
    { isim: "SİYAH BÖLGE", x: 1000, y: 0, w: 1000, h: 750, renk: "rgba(30, 30, 30, 0.15)", yaziRengi: "#aaaaaa" },
    { isim: "MAVİ BÖLGE", x: 0, y: 750, w: 1000, h: 750, renk: "rgba(0, 150, 255, 0.08)", yaziRengi: "#0096ff" },
    { isim: "YEŞİL BÖLGE", x: 1000, y: 750, w: 1000, h: 750, renk: "rgba(0, 255, 100, 0.08)", yaziRengi: "#00ff64" }
];

const DUVARLAR = [
    { x: 0, y: 0, w: 2000, h: 40 },
    { x: 0, y: 1460, w: 2000, h: 40 },
    { x: 0, y: 0, w: 40, h: 1500 },
    { x: 1960, y: 0, w: 40, h: 1500 },
    { x: 300, y: 300, w: 150, h: 150 },
    { x: 1550, y: 300, w: 150, h: 150 },
    { x: 300, y: 1050, w: 150, h: 150 },
    { x: 1550, y: 1050, w: 150, h: 150 },
    { x: 600, y: 650, w: 80, h: 200 },
    { x: 1320, y: 650, w: 80, h: 200 }
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
let kalanMacSuresi = 300; 

setInterval(() => {
    if (kalanMacSuresi > 0) {
        kalanMacSuresi--;
    } else {
        kalanMacSuresi = 300;
        for(let id in aktifOyuncular) {
            aktifOyuncular[id].skor = 0;
            aktifOyuncular[id].can = 100;
            let sp = rastgeleSpawnBul();
            aktifOyuncular[id].x = sp.x;
            aktifOyuncular[id].y = sp.y;
        }
        io.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '🏁 Maç süresi bitti! Skorlar sıfırlandı, yeni maç başladı!' });
    }
}, 1000);

function carpismaVarMi(x, y, yaricap) {
    for (let d of DUVARLAR) {
        let closestX = Math.max(d.x, Math.min(x, d.x + d.w));
        let closestY = Math.max(d.y, Math.min(y, d.y + d.h));
        let distX = x - closestX;
        let distY = y - closestY;
        if (Math.sqrt((distX * distX) + (distY * distY)) < yaricap) {
            return true;
        }
    }
    return false;
}

function rastgeleSpawnBul() {
    for (let i = 0; i < 50; i++) {
        let rx = Math.floor(Math.random() * (HARITA_GENISLIK - 200)) + 100;
        let ry = Math.floor(Math.random() * (HARITA_YUKSEKLIK - 200)) + 100;
        if (!carpismaVarMi(rx, ry, 30)) {
            return { x: rx, y: ry };
        }
    }
    return { x: 1000, y: 750 };
}

const NEON_RENKLER = ['#00ffcc', '#ff00ff', '#00ffff', '#ff5050', '#ffff00', '#ff9900', '#9900ff', '#00ff66'];

app.get('/oyun-alani', (req, res) => {
    res.send(`
        <!DOCTYPE html><html><head><title>Fen Bilimleri Chest Arena</title><style>
            body { background:#0f0f0f; color:#fff; margin:0; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; }
            canvas { background:#181818; border:4px solid #FFD700; box-shadow:0 0 30px rgba(255,215,0,0.4); cursor: crosshair; }
            .ui { margin-bottom:4px; font-size:16px; color:#FFD700; font-weight:bold; }
            .bilgi { font-size:12px; color:#aaa; margin-bottom:4px; }
            
            #muzikPaneli { position: fixed; top: 15px; right: 20px; background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; z-index: 1000; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 15px rgba(255,215,0,0.3); }
            #muzikPaneli button { background: #333; color: #FFD700; border: 1px solid #FFD700; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.2s; }
            #muzikPaneli button:hover { background: #FFD700; color: #000; }

            #ustPanel { position: fixed; top: 15px; left: 20px; display: flex; gap: 15px; z-index: 1000; font-family: monospace; }
            .panelKutusu { background: rgba(20, 20, 20, 0.9); border: 2px solid #FFD700; padding: 8px 12px; border-radius: 10px; box-shadow: 0 0 15px rgba(255,215,0,0.3); color: #FFD700; font-size: 13px; }
            #skorTablosuListesi { margin: 4px 0 0 0; padding-left: 15px; font-size: 11px; color: #fff; text-align: left; max-height: 80px; overflow-y: auto; }

            #soruModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(20, 20, 20, 0.95); border: 3px solid #FFD700; padding: 25px; border-radius: 15px; z-index: 10000; width: 450px; text-align: center; box-shadow: 0 0 50px rgba(255,215,0,0.5); }
            #soruBaslik { font-size: 16px; color: #FFD700; margin-bottom: 15px; font-weight: bold; }
            .secenekBtn { display: block; width: 100%; padding: 10px; margin: 8px 0; background: #333; color: #fff; border: 1px solid #FFD700; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .secenekBtn:hover { background: #FFD700; color: #000; font-weight: bold; }

            #adminSifreModal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(15, 15, 15, 0.98); border: 3px solid #ff8c00; padding: 25px; border-radius: 15px; z-index: 30000; width: 350px; text-align: center; box-shadow: 0 0 50px rgba(255,140,0,0.5); font-family: monospace; }
            #adminSifreModal h3 { color: #ff8c00; margin-top: 0; }
            #sifreInput { width: 100%; background: #000; border: 2px solid #ff8c00; color: #fff; padding: 10px; font-size: 16px; outline: none; border-radius: 6px; box-sizing: border-box; text-align: center; margin-bottom: 10px; }

            #adminKonsol { display: none; position: fixed; top: 0; left: 0; width: 100%; background: rgba(15, 15, 15, 0.95); border-bottom: 3px solid #ff8c00; padding: 15px 30px; box-sizing: border-box; z-index: 20000; box-shadow: 0 10px 30px rgba(255,140,0,0.3); font-family: monospace; }
            #adminKonsol h3 { margin: 0 0 8px 0; color: #ff8c00; font-size: 15px; letter-spacing: 1px; }
            #adminKonsol p { margin: 0 0 10px 0; color: #aaa; font-size: 12px; }
            #adminInput { width: 100%; background: #000; border: 2px solid #ff8c00; color: #00ffcc; padding: 10px; font-size: 15px; outline: none; border-radius: 6px; box-sizing: border-box; font-family: monospace; }

            #chatContainer { position: fixed; bottom: 20px; left: 20px; width: 350px; z-index: 999; display: flex; flex-direction: column; pointer-events: none; }
            #chatGecmisi { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow: hidden; margin-bottom: 6px; }
            .chat-satir { background: rgba(0, 0, 0, 0.45); color: #fff; padding: 4px 8px; font-size: 13px; border-radius: 3px; width: fit-content; text-shadow: 1px 1px 1px #000; font-family: monospace; }
            #chatInput { display: none; width: 100%; background: rgba(0, 0, 0, 0.85); border: 2px solid #FFD700; color: #fff; padding: 8px; font-size: 14px; outline: none; border-radius: 4px; pointer-events: auto; font-family: monospace; box-sizing: border-box; }

            #killFeed { position: fixed; top: 70px; right: 20px; display: flex; flex-direction: column; gap: 5px; z-index: 999; pointer-events: none; align-items: flex-end; }
            .kill-msg { background: rgba(0, 0, 0, 0.65); border-left: 4px solid #ff4757; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); }
        </style></head><body>
            <div class="ui">⭐ BİLGİ ÜSSÜ FEN BİLİMLERİ ARENA ⭐</div>
            <div class="bilgi">Hareket: <b>W,A,S,D</b> | Ateş Et: <b>Sol Tık</b> | <a href="/karakter-sec" style="color:#ff4757; text-decoration:none;">Karakter Değiştir</a> | <a href="/unite-sec" style="color:#0096ff; text-decoration:none;">Ünite Değiştir</a> | <a href="/konu-anlatimi" target="_blank" style="color:#00ff64; text-decoration:none;">Konu Çalış</a></div>
            
            <div id="ustPanel">
                <div class="panelKutusu">
                    ⏱️ Maç Süresi: <b id="sayacGosterge" style="color:#fff;">05:00</b>
                </div>
                <div class="panelKutusu" style="min-width: 160px;">
                    🏆 <b>Skor Tablosu</b>
                    <ul id="skorTablosuListesi"></ul>
                </div>
            </div>

            <div id="muzikPaneli">
                <span id="sesIkona" style="cursor:pointer; font-size:18px;" onclick="toggleMuzik()" title="Sesi Aç/Kapat">🔊</span>
                <button onclick="oynat('pixel-drift.mp3')">Pixel Drift</button>
                <button onclick="oynat('asphalt-menace.mp3')">Asphalt Menace</button>
                <button onclick="oynat('cybernetic-assault.mp3')">Cybernetic Assault</button>
            </div>

            <div id="adminSifreModal">
                <h3>🔒 YÖNETİCİ ŞİFRESİ GEREKLİ</h3>
                <p style="font-size:12px; color:#aaa;">Hile konsolunu açmak için şifreyi gir:</p>
                <input type="password" id="sifreInput" placeholder="Şifre" autocomplete="off">
                <button class="secenekBtn" onclick="sifreyiKontrolEt()" style="background:#ff8c00; color:#000; font-weight:bold;">Giriş Yap</button>
            </div>

            <div id="adminKonsol">
                <h3>⚡ YÖNETİCİ GİZLİ KOMUT KONSOLU</h3>
                <p>Komutlar: <b>god [saniye]</b> | <b>speed [hız]</b> | <b>invisibility [saniye]</b></p>
                <input type="text" id="adminInput" placeholder="Komut yaz ve Enter'a bas" autocomplete="off">
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

            <canvas id="arena" width="900" height="550"></canvas>
            
            <script src="/socket.io/socket.io.js"></script>
            <script>
                let muzik = window.muzik || new Audio(sessionStorage.getItem('muzikSrc') || '/muzik/pixel-drift.mp3');
                window.muzik = muzik;
                muzik.loop = true;
                muzik.volume = 0.4;
                
                window.onload = () => {
                    muzik.currentTime = parseFloat(sessionStorage.getItem('muzikTime')) || 0;
                    if(sessionStorage.getItem('muzikPlaying') === 'true') {
                        muzik.play().catch(e => console.log("Oto-oynatma engellendi"));
                    }
                };
                setInterval(() => sessionStorage.setItem('muzikTime', muzik.currentTime), 500);

                muzik.onerror = function() { console.log('Müzik yüklenemedi: ' + muzik.src + ' (bulunan dosyalar için /muzik-liste adresine bak)'); };
                function oynat(dosyaAdi) { 
                    muzik.src = '/muzik/' + dosyaAdi; 
                    muzik.load();
                    sessionStorage.setItem('muzikSrc', '/muzik/' + dosyaAdi); 
                    let sozVerildi = muzik.play();
                    if (sozVerildi && sozVerildi.catch) sozVerildi.catch(function(e) { console.log('Müzik oynatılamadı:', e); });
                    sessionStorage.setItem('muzikPlaying', 'true'); 
                    document.getElementById('sesIkona').innerText = '🔊';
                }

                function toggleMuzik() {
                    if(muzik.paused) { 
                        muzik.play(); 
                        sessionStorage.setItem('muzikPlaying', 'true'); 
                        document.getElementById('sesIkona').innerText = '🔊'; 
                    } else { 
                        muzik.pause(); 
                        sessionStorage.setItem('muzikPlaying', 'false'); 
                        document.getElementById('sesIkona').innerText = '🔇'; 
                    }
                }

                const isim = sessionStorage.getItem('oyuncuIsim') || 'Savaşçı';
                const benimAvatarim = sessionStorage.getItem('oyuncuAvatar') || '';

                const secilenUnite = sessionStorage.getItem('secilenUnite');
                if (!secilenUnite) { window.location.href = '/unite-sec'; }
                const socket = io({ query: { isim: isim, unite: secilenUnite || 'karisik' }, forceNew: true, transports: ['websocket', 'polling'] });
                socket.on('connect', () => { socket.emit('avatarGuncelle', benimAvatarim); });

                const canvas = document.getElementById('arena');
                const ctx = canvas.getContext('2d');

                let oyunVerisi = { players: {}, bullets: [], walls: ${JSON.stringify(DUVARLAR)}, chests: ${JSON.stringify(chestler)}, bolgeler: ${JSON.stringify(BOLGELER)}, kalanSure: 300 };
                let loadedImages = {};
                let chestImg = new Image();
                chestImg.src = '/karakterler/Chest.webp';

                let tuslar = {};
                let chatAcik = false;
                let soruAcik = false;
                let adminKonsolAcik = false;
                let sifreModalAcik = false;

                window.addEventListener('keydown', (e) => {
                    if (soruAcik) return;

                    if (e.shiftKey && e.key === 'Escape') {
                        e.preventDefault();
                        adminKonsolAcik = false;
                        document.getElementById('adminKonsol').style.display = 'none';

                        sifreModalAcik = true;
                        let modal = document.getElementById('adminSifreModal');
                        modal.style.display = 'block';
                        
                        let sifreInput = document.getElementById('sifreInput');
                        sifreInput.value = '';
                        sifreInput.blur();
                        setTimeout(() => sifreInput.focus(), 50);
                        return;
                    }

                    if (e.key.toLowerCase() === 't' && !chatAcik && !adminKonsolAcik && !sifreModalAcik) {
                        e.preventDefault();
                        chatAcik = true;
                        let input = document.getElementById('chatInput');
                        input.style.display = 'block';
                        input.focus();
                    } else if (e.key === 'Escape' && chatAcik) {
                        chatAcik = false;
                        document.getElementById('chatInput').style.display = 'none';
                    }
                    if (!chatAcik && !adminKonsolAcik && !sifreModalAcik) tuslar[e.key.toLowerCase()] = true;
                });

                window.addEventListener('keyup', (e) => { if (!chatAcik && !adminKonsolAcik && !sifreModalAcik) tuslar[e.key.toLowerCase()] = false; });

                function sifreyiKontrolEt() {
                    let girilenSifre = document.getElementById('sifreInput').value;
                    if (girilenSifre === '0707') {
                        sifreModalAcik = false;
                        document.getElementById('adminSifreModal').style.display = 'none';
                        
                        adminKonsolAcik = true;
                        let konsol = document.getElementById('adminKonsol');
                        konsol.style.display = 'block';
                        
                        let adminInput = document.getElementById('adminInput');
                        adminInput.value = '';
                        adminInput.blur();
                        setTimeout(() => adminInput.focus(), 50);
                    } else {
                        alert('Hatalı Yönetici Şifresi!');
                        document.getElementById('sifreInput').value = '';
                    }
                }

                document.getElementById('sifreInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') sifreyiKontrolEt();
                    else if (e.key === 'Escape') { sifreModalAcik = false; document.getElementById('adminSifreModal').style.display = 'none'; }
                });

                document.getElementById('adminInput').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        let komutMetni = e.target.value.trim();
                        if (komutMetni.length > 0) socket.emit('adminKomut', komutMetni);
                        e.target.value = '';
                        document.getElementById('adminKonsol').style.display = 'none';
                        adminKonsolAcik = false;
                    } else if (e.key === 'Escape') {
                        document.getElementById('adminKonsol').style.display = 'none';
                        adminKonsolAcik = false;
                    }
                });

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
                    if (chatAcik || soruAcik || adminKonsolAcik || sifreModalAcik || e.button !== 0) return; 
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
                    if (chatAcik || soruAcik || adminKonsolAcik || sifreModalAcik) return;
                    let hareket = {x: 0, y: 0};
                    let benimId = socket.id;
                    let ben = oyunVerisi.players[benimId];
                    let hiz = (ben && ben.ozelHiz) ? ben.ozelHiz : 6;

                    if(tuslar['w'] || tuslar['arrowup']) hareket.y = -hiz;
                    if(tuslar['s'] || tuslar['arrowdown']) hareket.y = hiz;
                    if(tuslar['a'] || tuslar['arrowleft']) hareket.x = -hiz;
                    if(tuslar['d'] || tuslar['arrowright']) hareket.x = hiz;

                    if(hareket.x !== 0 || hareket.y !== 0) socket.emit('hareketEt', hareket);
                }, 1000 / 60);

                socket.on('arenaGuncelle', (data) => { 
                    oyunVerisi = data; 
                    
                    let dk = Math.floor(data.kalanSure / 60);
                    let sn = data.kalanSure % 60;
                    let sayacEl = document.getElementById('sayacGosterge');
                    if (sayacEl) {
                        sayacEl.innerText = (dk < 10 ? '0' + dk : dk) + ':' + (sn < 10 ? '0' + sn : sn);
                    }
                    
                    let liste = document.getElementById('skorTablosuListesi');
                    if (liste) {
                        liste.innerHTML = '';
                        let oyuncuDizi = Object.values(data.players).sort((a, b) => b.skor - a.skor);
                        
                        // Hata alan döngü düzeltildi: Fonksiyon parametresi (p, index) olarak tamamen güvenli hale getirildi.
                        oyuncuDizi.slice(0, 5).forEach(function(p, index) {
                            let li = document.createElement('li');
                            li.innerHTML = (index + 1) + '. ' + p.isim + ': <b style="color:#FFD700;">' + p.skor + '⭐</b>';
                            liste.appendChild(li);
                        });
                    }

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
                    div.innerHTML = '<b style="color: #FFD700;">' + data.isim + ':</b> ' + data.mesaj;
                    chatGecmisi.appendChild(div);
                    if (chatGecmisi.children.length > 6) chatGecmisi.children[0].remove();
                    chatGecmisi.scrollTop = chatGecmisi.scrollHeight;
                });

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

                    ctx.fillStyle = '#1e1e1e';
                    ctx.fillRect(0, 0, ${HARITA_GENISLIK}, ${HARITA_YUKSEKLIK});

                    for (let b of oyunVerisi.bolgeler) {
                        ctx.fillStyle = b.renk;
                        ctx.fillRect(b.x, b.y, b.w, b.h);
                        
                        ctx.strokeStyle = b.yaziRengi;
                        ctx.lineWidth = 1;
                        ctx.strokeRect(b.x, b.y, b.w, b.h);

                        ctx.fillStyle = b.yaziRengi;
                        ctx.font = 'bold 24px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText("📍 " + b.isim, b.x + b.w / 2, b.y + 50);
                    }

                    for (let d of oyunVerisi.walls) {
                        ctx.fillStyle = '#2c3e50';
                        ctx.fillRect(d.x, d.y, d.w, d.h);
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(d.x, d.y, d.w, d.h);
                    }

                    for (let c of oyunVerisi.chests) {
                        if (!c.aktif) continue;
                        if (chestImg.complete && chestImg.naturalWidth !== 0) {
                            ctx.drawImage(chestImg, c.x - 20, c.y - 20, 40, 40);
                        } else {
                            ctx.fillStyle = '#FFD700';
                            ctx.fillRect(c.x - 15, c.y - 15, 30, 30);
                        }
                    }

                    for (let m of oyunVerisi.bullets) {
                        ctx.fillStyle = '#ff4757';
                        ctx.beginPath();
                        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#fff';
                        ctx.stroke();
                    }

                    for (let id in oyunVerisi.players) {
                        let p = oyunVerisi.players[id];
                        if (p.gizli && id !== benimId) continue;

                        ctx.save();
                        ctx.translate(p.x, p.y);

                        if (p.avatar) {
                            if (!loadedImages[id]) {
                                loadedImages[id] = new Image();
                                loadedImages[id].src = p.avatar;
                            }
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(0, 0, 20, 0, Math.PI * 2);
                            ctx.clip();
                            ctx.drawImage(loadedImages[id], -20, -20, 40, 40);
                            ctx.restore();
                        } else {
                            ctx.fillStyle = p.renk || '#00ffcc';
                            ctx.beginPath();
                            ctx.arc(0, 0, 20, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        ctx.strokeStyle = p.godMode ? '#00ffff' : '#FFD700';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                        ctx.fillRect(-20, -32, 40, 5);
                        ctx.fillStyle = '#00ff64';
                        ctx.fillRect(-20, -32, (Math.max(0, p.can) / 100) * 40, 5);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(p.isim, 0, -38);

                        ctx.restore();
                    }

                    ctx.restore();
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
        renk: NEON_RENKLER[Math.floor(Math.random() * NEON_RENKLER.length)],
        avatar: null,
        ozelHiz: 6,
        godMode: false,
        gizli: false,
        unite: socket.handshake.query.unite || 'karisik'
    };

    socket.on('avatarGuncelle', (avatarData) => {
        if (aktifOyuncular[socket.id]) {
            aktifOyuncular[socket.id].avatar = avatarData;
        }
    });

    socket.on('hareketEt', (data) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        let yeniX = p.x + data.x;
        let yeniY = p.y + data.y;

        if (yeniX >= 20 && yeniX <= HARITA_GENISLIK - 20 && !carpismaVarMi(yeniX, p.y, 20)) {
            p.x = yeniX;
        }
        if (yeniY >= 20 && yeniY <= HARITA_YUKSEKLIK - 20 && !carpismaVarMi(p.x, yeniY, 20)) {
            p.y = yeniY;
        }

        for (let c of chestler) {
            if (c.aktif) {
                let dist = Math.hypot(p.x - c.x, p.y - c.y);
                if (dist < 35) {
                    c.aktif = false;
                    let rastgeleSoru = soruSec(p.unite);
                    socket.emit('soruGoster', { chestId: c.id, soruData: rastgeleSoru });

                    setTimeout(() => { c.aktif = true; }, 15000);
                    break;
                }
            }
        }
    });

    socket.on('cevapVer', (data) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        if (data.secilenIndex === data.dogruCevap) {
            p.skor += 15;
            p.can = Math.min(100, p.can + 25);
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '🎉 Doğru Cevap! +15 Puan ve Can Kazandın.' });
        } else {
            socket.emit('chatMesajiGelsin', { isim: 'SİSTEM', mesaj: '❌ Yanlış Cevap!' });
        }
    });

    socket.on('atesEt', (data) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;

        let aci = Math.atan2(data.y - p.y, data.x - p.x);
        mermiler.push({
            id: Math.random().toString(),
            sahipId: socket.id,
            sahipIsim: p.isim,
            x: p.x,
            y: p.y,
            vx: Math.cos(aci) * 14,
            vy: Math.sin(aci) * 14,
            menzil: 50
        });
    });

    socket.on('chatMesaji', (msg) => {
        let p = aktifOyuncular[socket.id];
        if (p) {
            io.emit('chatMesajiGelsin', { isim: p.isim, mesaj: msg });
        }
    });

    socket.on('adminKomut', (komut) => {
        let p = aktifOyuncular[socket.id];
        if (!p) return;
        let parcalar = komut.split(' ');
        let cmd = parcalar[0].toLowerCase();
        let val = parseInt(parcalar[1]) || 10;

        if (cmd === 'god') {
            p.godMode = true;
            setTimeout(() => { p.godMode = false; }, val * 1000);
        } else if (cmd === 'speed') {
            p.ozelHiz = val;
            setTimeout(() => { p.ozelHiz = 6; }, 10000);
        } else if (cmd === 'invisibility') {
            p.gizli = true;
            setTimeout(() => { p.gizli = false; }, val * 1000);
        }
    });

    socket.on('disconnect', () => {
        delete aktifOyuncular[socket.id];
    });
});

setInterval(() => {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        let m = mermiler[i];
        m.x += m.vx;
        m.y += m.vy;
        m.menzil--;

        if (m.menzil <= 0 || carpismaVarMi(m.x, m.y, 5) || m.x < 0 || m.x > HARITA_GENISLIK || m.y < 0 || m.y > HARITA_YUKSEKLIK) {
            mermiler.splice(i, 1);
            continue;
        }

        for (let pid in aktifOyuncular) {
            let hedef = aktifOyuncular[pid];
            if (pid !== m.sahipId) {
                let mes = Math.hypot(hedef.x - m.x, hedef.y - m.y);
                if (mes < 20) {
                    if (!hedef.godMode) {
                        hedef.can -= 15;
                        if (hedef.can <= 0) {
                            io.emit('olumBildirimi', `💀 ${hedef.isim}, ${m.sahipIsim} tarafından avlandı!`);
                            if (aktifOyuncular[m.sahipId]) {
                                aktifOyuncular[m.sahipId].skor += 25;
                            }
                            let sp = rastgeleSpawnBul();
                            hedef.x = sp.x;
                            hedef.y = sp.y;
                            hedef.can = 100;
                        }
                    }
                    mermiler.splice(i, 1);
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
        kalanSure: kalanMacSuresi
    });
}, 1000 / 30);

server.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda başarıyla başlatıldı!`);
});
