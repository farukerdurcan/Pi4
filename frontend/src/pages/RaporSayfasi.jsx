import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { katilimciDetay } from '../api/katilimci'
import { bireyselRapor, butunlesikRapor } from '../api/rapor'

const ENV_RENK = {
  liderlik_stili:   { bg: 'bg-blue-100',   text: 'text-blue-700',   bar: 'bg-blue-500',   kisalt: 'LS'  },
  motivasyon:       { bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500',  kisalt: 'Mot' },
  kisisel_etkilesim:{ bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500', kisalt: 'KE'  },
  problem_cozme:    { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500', kisalt: 'PC'  },
}

// Envanter görüntülenme sırası
const ENVANTER_SIRASI = { liderlik_stili: 1, kisisel_etkilesim: 2, problem_cozme: 3, motivasyon: 4 }

// ── Problem Çözme içerik kitaplığı ──────────────────────────────────────────
const PC_ICERIK = [
  {
    key: 'realist', ad: 'Realist',
    renk: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', acik: '#dbeafe',
    alinti: 'Süreçlerin hata payını azaltan, detayları yakalayan ve sürdürülebilir sonuçlar üreten güvenilir profesyoneldir.',
    arti: ['Etkili soru sorar', 'Detaylara hakimdir', 'Sebep-sonuç, maliyet-fayda analizinde başarılıdır'],
    eksi: ['Aşırı inatçı', 'Geçmişe takılı kalırlar', 'Gereksiz detayda fazla zaman kaybederler'],
    ozet: '"Doğru işi, doğru şekilde yapmayı sağlar."',
  },
  {
    key: 'aktivist', ad: 'Aktivist',
    renk: '#ea580c', bg: '#fff7ed', border: '#fed7aa', acik: '#ffedd5',
    alinti: 'Organizasyonun motor gücüdür; yüksek enerjisi, sonuç odaklı yaklaşımı ve hızlı aksiyon alma becerisiyle işleri harekete geçirir.',
    arti: ['Sonuç odaklı, iş bitirici', 'Pozitif ve iyimser, çözüm odaklı', 'Gerekli durumlarda risk alırlar'],
    eksi: ['Aşırı aceleci ve sabırsız', 'Pire için yorgan yakar', 'Delege etmektense kendi yapmayı tercih eder'],
    ozet: '"İşlerin ilerlemesini ve sonuç alınmasını sağlar."',
  },
  {
    key: 'idealist', ad: 'İdealist',
    renk: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', acik: '#dcfce7',
    alinti: 'Yüksek standartları ve öğrenme tutkusu sayesinde yeniliklerin ve stratejik dönüşümün öncüsü olur.',
    arti: ['Temiz, kaliteli, mükemmeliyetçi', 'Geleceği okur, pro-aktif ve stratejik', 'Öğrenmeye, gelişime ve araştırmayı sever'],
    eksi: ['Tatmin olmaz, yüksek standartlar belirler', 'Teoride çok iyi, uygulamada ise ortalama', 'Aniden demotive olur, iletişimi keser'],
    ozet: '"Bugünü geliştirirken geleceği inşa eder." 🚀',
  },
]

// ── Liderlik Stili içerik kitaplığı ─────────────────────────────────────────
const LS_DAVRANIS = {
  cesur: {
    ad: 'Cesur Lider', harf: 'C', renk: '#ef4444', bg: '#fef2f2',
    kadran: 'sol-ust',
    ilkEtki: 'Açık ve güvenilir',
    anaGizgi: 'Gücü Sever',
    disAlgi: 'Sert, Süratli, Tezcanlı, Aşırı Reaksiyon',
    liderlikArti: 'Çabuk, Hızlı, Kararlı',
    liderlikEksi: 'Risk Sever, Aklına Geleni Söyler',
    liderlikUnlem: 'Stresi yansıtır, Önemli İşleri Delege Etmez',
    uretkenlik: [
      'Ben odağından «biz» odağına geçiş yapması sağlanmalı',
      'Bireysel hedefler yerine grup hedefleri verilmeli',
      'Stres, öfke ve çatışma yönetimi eğitimleri ile destek almalı',
      'İddialı programları gözden geçirilmeli',
      'İş ve insan seçerken tek başına karar vermemeli',
      'Önemli ve kritik işleri delege etmesi istenmeli',
      'Şoför mahali yerine yolcu koltuğunun faydasını ve etkisini deneyimlemeli',
      'Hedef vererek süreç ve kalite hassasiyetini arttırın',
      'Önemli karar ve değişimlerden önce bilgilendirin',
      'Yüksek yetki ve geniş alan tanıyın ancak yakın gözetim altında tutun',
    ],
    yonetmekIcin: [
      'Pratik ve konuyla ilgili olun',
      'Yetkili bir pozisyon temin edin',
      'Meydan okuyan, kısa dönemli projeler verin',
      'Yenilikçi fikirlerini tasdikleyin',
      'Adalet ve inisiyatifin önemli olduğunu bilin',
    ],
  },
  etkileyici: {
    ad: 'Etkileyici Lider', harf: 'E', renk: '#16a34a', bg: '#f0fdf4',
    kadran: 'sag-ust',
    ilkEtki: 'Arkadaş ve Dost',
    anaGizgi: 'Mizah sever, sözcüklerin gücünü kullanır',
    disAlgi: 'Gülümseme eksik olmaz',
    liderlikArti: 'İkna Eder, İnsan Odaklıdır',
    liderlikEksi: 'Duygusal, Objektif Olamayabilir',
    liderlikUnlem: 'Duyguları ile yönetir, sistem tarafı zayıf, fazla bağımsız',
    uretkenlik: [
      'Zaman ve öncelikleri yönetirken destek verilmeli, sözünü tutar ama zamanı yönetemeyebilir',
      'Finansal okuryazarlık ve Proje yönetimi eğitimi ile desteklenmeli',
      'Kısa cümleler kurarak zengin anlamlar çıkarması sağlanmalı',
      'SMART hedefler ile ekibini yönetmesi sağlanmalı',
      'Gereğinden fazla söz ve vaat verme eğilimi engellenmeli',
      'Yenilikçi ve yaratıcı fikirleri yapılandırarak iş planı halinde sunması sağlanmalı',
      'Düzenli rapor vermesi sağlanmalı, fazla bağımsız harekete eğimli olduğu unutulmamalı',
      'Rutin, monoton, yeknesak işler verilerek sabır ve özeni arttırılmalı',
      'Bazı çalışanlarına daha yakın görünebilir, ilişki dengesini tabana yayması sağlanmalı',
      'Yetenek ve başarılarını yönetim katına taşımasına destek verilmeli',
    ],
    yonetmekIcin: [
      'Arkadaşlık ve sosyalleşmesi için zaman verin',
      'Gruba dahil olması için bir şans sağlayın',
      'Mutlu ve arkadaşça bir ortam yaratın',
      'Konuşması ve sunum yapması için bir şans verin',
      'Yeniliklere heveslidir, odaklanmasını isteyin',
    ],
  },
  teknik: {
    ad: 'Teknik Lider', harf: 'T', renk: '#ea580c', bg: '#fff7ed',
    kadran: 'sol-alt',
    ilkEtki: 'Organize',
    anaGizgi: 'Düzenli, Tertipli',
    disAlgi: 'Mesafeli, iyi giyimli, seçici sosyal',
    liderlikArti: 'Detaya hakim, doğruluk, dürüstlük',
    liderlikEksi: 'Kuralları aşırı bağlılık, karar verme zorluğu',
    liderlikUnlem: 'Aşırı iş odaklı, diğerlerine karşı kayıtsız',
    uretkenlik: [
      'Ticari zekası ve bakış açısı geliştirilmeli, ticari rollerde çapraz görevlendirmeler alabilir, daha fazla finans sürecine dahil olabilir',
      'Belirsizliğe itip, risk alması sağlanmalı',
      'Daha renkli, görsel olarak güçlü ve mizahi sunumlar yapması istenmeli, sunumları kendisine izletilmeli',
      'Üst yönetimde kritik karar vericiler ile daha fazla sosyalleşmeli',
      'Doğrudan işi olmayan kişilerle ilişki başlatması sağlanmalı',
      'Karmaşık değil, basit/sade yapılar kurmaya teşvik edilmeli',
      'Ekibine ilham verme, motive etme, daha ödüllendirici bir ortam sağlaması sağlanmalı ve takip edilmeli',
      'Ekibinin işini değil, ekibin kendisini geliştirmesi istenmeli',
      'Söylediğini yapması, yaptığını söylemesi talep edilmeli',
    ],
    yonetmekIcin: [
      'Yapı ve organizasyonu verin',
      'Mantıksal analiz kullanması için yollar sağlayın',
      'Görev atamasını adım adım yapın',
      'Sık sık içini rahatlatın',
    ],
  },
  sempatik: {
    ad: 'Sempatik Lider', harf: 'S', renk: '#2563eb', bg: '#eff6ff',
    kadran: 'sag-alt',
    ilkEtki: 'Soğukkanlıdır',
    anaGizgi: 'Uyumlu, takım üyesi',
    disAlgi: 'Yumuşak bakışlı, anaç',
    liderlikArti: 'Bağlılık ve Yardımseverlik',
    liderlikEksi: 'Değişime uyum sağlar ancak öncü olmaz',
    liderlikUnlem: 'Acelesi yoktur, agresif insanlardan haz etmez',
    uretkenlik: [
      'Yaratıcılık ve yenilikçilik gerektiren görev ve hedefler verilmeli',
      'Sürat, ataklık ve girişimcilik isteyen işler verilmeli',
      'Rekabete doğru itilmeli, çatışmaktan kaçınır',
      'Diğerlerine olumsuz geri bildirim verirken devreye girilmemeli',
      'Konfor alanı yaratılmamalı',
      'Karar verme / Yetki matrisini dokümante edilmeli',
      'Acil ve önemli işler birlikte planlanmalı',
      '«Hayır» demeyi öğrenmeli',
      'Ekibini süreçler ile değil hedef ve sonuçlar ile yönetmeli, sıkıştırıcı, geliştirici olmalı',
      'Çalışkanlıkları, dürüstlükleri, sadakatleri ve güvenilirlikleri ödüllendirilmeli',
    ],
    yonetmekIcin: [
      'Rutin görevler verin',
      'Fazla çalışma ve bağlılık için memnuniyetinizi gösterin',
      'Programı yavaşça değiştirin',
      'Sakin bir ortam sağlayın',
    ],
  },
}

// ── Motivasyon içerik kitaplığı ──────────────────────────────────────────────
const MOT_ICERIK = {
  Başarı: {
    aciklama: 'Başarı motivasyonu ön plandadır. Gerçekçi hedefler koymak, ilerlemeyi ölçmek ve sonuçların görünür olması bu kişinin performansını doğrudan etkiler. Neye ulaşacağını bildiğinde ve katkısı fark edildiğinde motivasyonu belirgin biçimde yükselir.',
    oneri: 'Başarı boyutunda güçlendirme yapılması önerilir.',
    yapin: ['SMART hedefler koyun ve mutabık kalın', 'Düzenli performans değerlendirmesi yapın', 'Sonuçlar ve sağladığı katkıya odaklanın', 'Plan ve projelerde sistematik yaklaşım sergileyin'],
    yapmayin: ['Hedef ve sonuçlar konusunda muğlak durum yaratmayın', 'Hazırlıksız bir müzakereye girmeyin', 'Mikro yönetimle yakın gözetimi aşırıya taşımayın', 'Hareket alanını daraltmayın'],
  },
  İlişki: {
    aciklama: 'İnsan ilişkileri ve sosyal bağlar ön plandadır. Sıcak, güven dolu bir ortam bu kişinin performansını doğrudan etkiler. Ekip içinde değer gördüğünü ve ait olduğunu hissettiğinde motivasyonu yükselir.',
    oneri: 'İlişki boyutunda güçlendirme yapılması önerilir.',
    yapin: ['Kişisel durumlarına yakın ilgi gösterin', '«Biz» duygusunu öne çıkarın', 'Grup tartışmalarına dahil edin', 'Sosyal olarak kontakta olun'],
    yapmayin: ['Soğuk, mesafeli durmayın', 'Düzensiz temasta bulunmayın', 'İletişimi sınırlamayın', 'Diğerlerini gereğinden fazla eleştirmeyin'],
  },
  Etkileme: {
    aciklama: 'Etki alanı, statü ve tanınma ön plandadır. Kararların içinde yer aldığı, sesinin duyulduğu ortamlarda motivasyonu artar. Vizyon sahibi, bağımsız çalışmayı seven bir profil.',
    oneri: 'Etkileme boyutunda güçlendirme yapılması önerilir.',
    yapin: ['Fikir ve tavsiyesine başvurun', 'Kendilerini ifade etmelerini sağlayın', 'Başarısını öne çıkarın', 'Olay ve değişimlerden haberdar edin'],
    yapmayin: ['Karar mekanizması dışında tutmayın', 'Yönetim kadrosuna giden yolları kapatmayın', 'Yetki paylaşın, işi delege edin', 'Sert yönetimi benimsemeyin'],
  },
  Güvenlik: {
    aciklama: 'Güven, istikrar ve tanınma ön plandadır. Geleceğinin güvende olduğunu hissettiği, yeteneklerinin görüldüğü ortamlarda motivasyonu yükselir. Belirsizlik bu kişi için performansı düşüren en önemli etkendir.',
    oneri: 'Güvenlik boyutunda güçlendirme yapılması önerilir.',
    yapin: ['Güven inşa edin', 'Güçlü yönlerine odaklanın', 'Gelecek projeksiyonu çizin, fikrini alın', 'Cömertçe övün'],
    yapmayin: ['Belirsizlik yaratmayın', 'Destek vermeden riske girmesine izin vermeyin', 'Yeteneklerini görmezden gelmeyin', 'Övgüyü esirgemeyin'],
  },
}

const MOT_4BOYUT = {
  İlişki:   ['Yönetim iş odaklı, kaliteli zaman ayıramıyor', 'Yöneticim bilgili, koçluğundan istifade edemiyorum', 'Yöneticim mesafeli'],
  Başarı:   ['Bana verilen hedefler doğru değil', 'Performans sistemi adaletsiz', 'Mikro yönetim uygulanıyor'],
  Etkileme: ['Üst yönetime giden yolda önümün açılması lazım', 'Başkalarının tanıyacağı roller istiyorum', 'Tatlı dilden anlarım, sert yönetime gerek yok'],
  Güvenlik: ['Yönetim potansiyelimden yeterince yararlanmıyor', 'Övgü ve takdir konusunda yeterince cömert değil', 'Geleceğe dair endişelerim var'],
}

// ── Kişilerarası Etkileşim içerik kitaplığı ──────────────────────────────────
const KE_TARZLAR = [
  {
    kod: 'G', ad: 'Girişken (Assertive)',
    guc: 'Fikirlerini net ifade eder, inisiyatif alır, sağlıklı sınırlar koyar. Liderlik ve ekip çalışmasında yüksek etki yaratır.',
    risk: 'Dozu kaçarsa baskın veya sabırsız algılanabilir.',
    ozet: '"Hem kendime hem sana saygı duyuyorum."',
    renk: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', badge: '#dcfce7', badgeText: '#15803d' },
  },
  {
    kod: 'P', ad: 'Pasif (Passive)',
    guc: 'Uyumlu, çatışmayı azaltan, ekip içinde huzuru koruyan bir profil olabilir.',
    risk: 'Fikirlerini söylemez, haklarını savunamaz, "sessiz onay" verir ve potansiyelini gösteremez.',
    ozet: '"Senin ihtiyaçların benimkilerden daha önemli."',
    renk: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', badge: '#f1f5f9', badgeText: '#64748b' },
  },
  {
    kod: 'A', ad: 'Açık Agresif (Aggressive)',
    guc: 'Hızlı karar alma ve kriz anlarında sonuç odaklı hareket etme eğilimindedir.',
    risk: 'İlişkileri yıpratır, güveni azaltır, ekip motivasyonunu ve psikolojik güvenliği zedeler.',
    ozet: '"Ben kazanmalıyım, gerekirse sen kaybedersin."',
    renk: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', badge: '#ffedd5', badgeText: '#c2410c' },
  },
  {
    kod: 'S', ad: 'Saklı Agresif (Passive-Aggressive)',
    guc: 'Açık çatışmadan kaçındığı için kısa vadede uyumlu görünebilir.',
    risk: 'Küskünlük, direnç, dedikodu, işi yavaşlatma ve gizli sabotaj gibi davranışlarla ekip verimliliğini düşürebilir.',
    ozet: '"Açıkça söylemem ama memnuniyetsizliğimi dolaylı yollarla gösteririm."',
    renk: { bg: '#fdf4ff', border: '#d8b4fe', text: '#7e22ce', badge: '#f3e8ff', badgeText: '#7e22ce' },
  },
]

// Kişilerarası Etkileşim profil yorumları — profil kodunun ilk harfine göre
const KE_PROFIL_YORUMLARI = {
  GASP: { mesaj: 'Girişken iletişim tarzı ön planda. Baskı arttıkça agresifleşip sonunda teslim olan bu profil, en beklenen ve arzulanan davranış biçimidir.', olumlu: true },
  GAPS: { mesaj: 'Girişken iletişim tarzı ön planda. Baskı arttıkça agresifleşip içine çekilen bu profil, en beklenen ve arzulanan davranış biçimidir.', olumlu: true },
}

function ke_profil_yorum(kod) {
  if (!kod) return null
  // Önce tam eşleşme
  if (KE_PROFIL_YORUMLARI[kod]) return KE_PROFIL_YORUMLARI[kod]
  // İlk harfe göre genel yorum
  const ilk = kod[0]
  if (ilk === 'G') return { mesaj: 'Girişken iletişim ağırlıklı bir profil. İletişimde doğrudan ve açık bir yaklaşım sergilenir.', olumlu: true }
  if (ilk === 'A') return { mesaj: 'Açık agresif iletişim tarzı ön planda. Girişkenliğin dozunu kaçırabilen, sözünü kesen bir iletişim profili.', olumlu: false }
  if (ilk === 'S') return { mesaj: 'Saklı agresif iletişim tarzı ön planda. Duygularını içe atan, dolaylı yollarla tepki veren bir profil. Eleştiriye sert reaksiyon gösterebilir.', olumlu: false }
  if (ilk === 'P') return { mesaj: 'Pasif iletişim tarzı ön planda. Mücadeleden erken vazgeçen, durumu kabullenen bir profil.', olumlu: false }
  // Eşitlik durumu
  if (kod.includes('=')) return { mesaj: 'İletişim stilinde belirgin bir belirsizlik var. Hangi reaksiyonu göstereceği öngörülemeyen, zaman zaman dengesiz algılanabilecek bir profil.', olumlu: false }
  return null
}

function CubukGrafik({ etiket, puan, maks, renk }) {
  const sayi = Number(puan) || 0
  const yuzde = maks > 0 ? Math.min(100, Math.round((sayi / maks) * 100)) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{etiket}</span>
        <span className="text-sm font-medium text-gray-900">{sayi}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${renk}`} style={{ width: `${yuzde}%` }} />
      </div>
    </div>
  )
}

function RaporIcerigi({ rapor }) {
  if (!rapor || rapor.puan_yok) {
    return <div className="text-sm text-gray-400 py-8 text-center">Bu envanter için henüz puan hesaplanmadı.</div>
  }

  const tip = rapor.envanter_tipi
  // Üst seviye meta bilgiler (birincil_stil, profil_kodu vb.)
  const meta = rapor.puanlar || {}
  // Gerçek sayısal puanlar iç içe objede
  const p = meta.puanlar || {}

  // İkincil stil (liderlik için)
  const stilSirali = tip === 'liderlik_stili'
    ? Object.entries(p).sort((a, b) => b[1] - a[1])
    : []
  const ikincilStil = stilSirali[1]
    ? { 'cesur': 'Cesur', 'etkileyici': 'Etkileyici', 'sempatik': 'Sempatik', 'teknik': 'Teknik' }[stilSirali[1][0]]
    : null

  return (
    <div className="space-y-4">

      {/* Üst kartlar */}
      <div className="grid grid-cols-2 gap-3">
        {tip === 'liderlik_stili' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Birincil stil</div>
              <div className="text-lg font-medium text-gray-900">{meta.birincil_stil}</div>
              <div className="text-xs text-gray-400 mt-1">
                {meta.baskin_var ? '🔵 Baskın (≥15 puan)' : 'Belirgin'}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">İkincil stil</div>
              <div className="text-lg font-medium text-gray-900">{ikincilStil || '—'}</div>
              <div className="text-xs text-gray-400 mt-1">
                {stilSirali[1] ? `${stilSirali[1][1]} puan` : ''}
              </div>
            </div>
          </>
        )}
        {tip === 'motivasyon' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Temel motivasyon ihtiyacı</div>
              <div className="text-lg font-medium text-gray-900">{meta.temel_ihtiyac}</div>
              <div className="text-xs text-gray-400 mt-1">En düşük puan: {meta.temel_ihtiyac_puan}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Motivasyon seviyesi</div>
              <div className={`text-lg font-medium ${
                meta.motivasyon_seviyesi === 'Yüksek' ? 'text-green-600'
                : meta.motivasyon_seviyesi === 'Orta' ? 'text-yellow-600'
                : 'text-red-500'
              }`}>{meta.motivasyon_seviyesi}</div>
              <div className="text-xs text-gray-400 mt-1">Toplam: {meta.genel_toplam}</div>
            </div>
          </>
        )}
        {tip === 'kisisel_etkilesim' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Profil kodu</div>
              <div className="text-2xl font-medium text-gray-900 tracking-widest">{meta.profil_kodu}</div>
              <div className="text-xs text-gray-400 mt-1">Birincil: {meta.birincil_stil}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">İletişim seviyesi</div>
              <div className={`text-lg font-medium ${
                meta.iletisim_seviyesi === 'Dengeli' ? 'text-green-600'
                : meta.iletisim_seviyesi === 'Zayıf' ? 'text-red-500'
                : 'text-yellow-600'
              }`}>{meta.iletisim_seviyesi}</div>
              <div className="text-xs text-gray-400 mt-1">Toplam: {meta.genel_toplam}</div>
            </div>
          </>
        )}
        {tip === 'problem_cozme' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Baskın tarz</div>
              <div className="text-lg font-medium text-gray-900">{meta.birincil_tarz}</div>
              <div className="text-xs text-gray-400 mt-1">Puan: {meta.birincil_puan}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">Seviye</div>
              <div className="text-sm font-medium text-gray-900">
                {meta.seviyeler?.[meta.birincil_tarz?.toLowerCase()] || '—'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Puan çubukları */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-sm font-medium text-gray-700 mb-4">Puan dağılımı</div>
        {tip === 'liderlik_stili' && (
          <>
            <CubukGrafik etiket="Cesur (C)"       puan={p.cesur}      maks={32} renk="bg-red-400" />
            <CubukGrafik etiket="Etkileyici (E)"  puan={p.etkileyici} maks={32} renk="bg-yellow-400" />
            <CubukGrafik etiket="Sempatik (S)"    puan={p.sempatik}   maks={32} renk="bg-green-400" />
            <CubukGrafik etiket="Teknik (T)"      puan={p.teknik}     maks={32} renk="bg-blue-400" />
          </>
        )}
        {tip === 'motivasyon' && (
          <>
            <CubukGrafik etiket="Başarı"   puan={p.basari}   maks={40} renk="bg-blue-400" />
            <CubukGrafik etiket="Etkileme" puan={p.etkileme} maks={40} renk="bg-orange-400" />
            <CubukGrafik etiket="İlişki"   puan={p.iliski}   maks={40} renk="bg-green-400" />
            <CubukGrafik etiket="Güvenlik" puan={p.guvenlik} maks={40} renk="bg-purple-400" />
          </>
        )}
        {tip === 'kisisel_etkilesim' && (
          (meta.sirali_stiller || []).map((s, i) => {
            const renkler = ['bg-blue-500', 'bg-orange-400', 'bg-purple-400', 'bg-green-400']
            return <CubukGrafik key={s.ad} etiket={s.ad} puan={s.puan} maks={50} renk={renkler[i] || 'bg-gray-400'} />
          })
        )}
        {tip === 'problem_cozme' && (
          <>
            <CubukGrafik etiket="İdealist" puan={p.idealist} maks={100} renk="bg-blue-400" />
            <CubukGrafik etiket="Aktivist" puan={p.aktivist} maks={100} renk="bg-orange-400" />
            <CubukGrafik etiket="Realist"  puan={p.realist}  maks={100} renk="bg-green-400" />
          </>
        )}
      </div>

      {/* Güçlü yönler & Gelişim */}
      {(rapor.guclu_yonler?.length > 0 || rapor.gelisim_alanlari?.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {rapor.guclu_yonler?.length > 0 && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="text-xs font-medium text-green-800 mb-2">💪 Güçlü yönler</div>
              <div className="flex flex-wrap gap-1.5">
                {rapor.guclu_yonler.map(g => (
                  <span key={g} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{g}</span>
                ))}
              </div>
            </div>
          )}
          {rapor.gelisim_alanlari?.length > 0 && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <div className="text-xs font-medium text-yellow-800 mb-2">🎯 Gelişim alanları</div>
              <div className="flex flex-wrap gap-1.5">
                {rapor.gelisim_alanlari.map(g => (
                  <span key={g} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yönetim önerileri */}
      {rapor.yonetim_onerileri?.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-xs font-medium text-blue-800 mb-2">💡 Yönetim önerileri</div>
          <ul className="space-y-1.5">
            {rapor.yonetim_onerileri.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                <span className="flex-shrink-0 mt-0.5">→</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liderlik stili — 4-kadran + davranış kalıpları + listeler */}
      {tip === 'liderlik_stili' && (() => {
        const puanlar = { cesur: p.cesur || 0, etkileyici: p.etkileyici || 0, sempatik: p.sempatik || 0, teknik: p.teknik || 0 }
        const maksPuan = Math.max(...Object.values(puanlar))
        const birinciller = Object.entries(puanlar).filter(([, v]) => v === maksPuan).map(([k]) => k)

        const kadranlar = [
          { key: 'cesur',     pos: 'sol-ust',  label: 'Cesur Lider'     },
          { key: 'etkileyici',pos: 'sag-ust',  label: 'Etkileyici Lider'},
          { key: 'teknik',    pos: 'sol-alt',  label: 'Teknik Lider'    },
          { key: 'sempatik',  pos: 'sag-alt',  label: 'Sempatik Lider'  },
        ]

        return (
          <div className="space-y-4">
            {/* 4-Kadran görsel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Liderlik Stilleri Modeli</div>
              <div className="flex justify-center">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  {/* Eksen etiketleri */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 text-xs font-medium text-gray-500">Dışa Dönük</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 text-xs font-medium text-gray-500">İçe Dönük</div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 text-xs font-medium text-gray-500" style={{ writingMode: 'horizontal-tb', transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left center', whiteSpace: 'nowrap', left: -56, top: '50%' }}>Görev Odaklı</div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500" style={{ writingMode: 'horizontal-tb', transform: 'rotate(90deg) translateX(50%)', transformOrigin: 'right center', whiteSpace: 'nowrap', right: -56, top: '50%' }}>İnsan Odaklı</div>

                  {/* 2×2 grid */}
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden border border-gray-200">
                    {kadranlar.map(kd => {
                      const stil = LS_DAVRANIS[kd.key]
                      const birincil = birinciller.includes(kd.key)
                      return (
                        <div key={kd.key}
                          className="flex items-center justify-center p-2 transition-all"
                          style={{
                            background: birincil ? stil.renk : stil.bg,
                            opacity: birincil ? 1 : 0.45,
                            outline: birincil ? `3px solid ${stil.renk}` : 'none',
                            outlineOffset: '-3px',
                          }}
                        >
                          <div className="text-center">
                            <div className="text-base font-black" style={{ color: birincil ? '#fff' : stil.renk }}>{stil.harf}</div>
                            <div className="text-xs font-semibold leading-tight" style={{ color: birincil ? '#fff' : stil.renk }}>
                              {kd.label.split(' ')[0]}
                            </div>
                            <div className="text-xs font-semibold leading-tight" style={{ color: birincil ? 'rgba(255,255,255,0.9)' : stil.renk }}>
                              {kd.label.split(' ')[1]}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Birincil stil(ler) için detay — eşitlik varsa hepsini göster */}
            {birinciller.map(stilKey => {
              const stil = LS_DAVRANIS[stilKey]
              return (
                <div key={stilKey} className="space-y-4">
                  {/* Başlık */}
                  <div className="rounded-xl p-4 flex gap-3 items-center" style={{ background: stil.bg, border: `1px solid ${stil.renk}30` }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: stil.renk, color: '#fff' }}>{stil.harf}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{stil.ad}</div>
                      <div className="text-xs text-gray-500">Birincil liderlik stili{birinciller.length > 1 ? ' (eşit puan)' : ''}</div>
                    </div>
                  </div>

                  {/* Davranış Kalıpları tablosu */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Davranış Kalıpları</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: stil.bg }}>
                            {['İlk Etki', 'Ana Çizgi', 'Dış Algı', 'Liderlik ( + )', 'Liderlik ( − )', 'Liderlik ( ! )'].map(h => (
                              <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: stil.renk }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-gray-700 leading-relaxed">{stil.ilkEtki}</td>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-gray-700 leading-relaxed">{stil.anaGizgi}</td>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-gray-700 leading-relaxed">{stil.disAlgi}</td>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-green-700 leading-relaxed">{stil.liderlikArti}</td>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-orange-600 leading-relaxed">{stil.liderlikEksi}</td>
                            <td className="px-3 py-3 align-top border-t border-gray-100 text-red-600 leading-relaxed">{stil.liderlikUnlem}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Üretkenlik + Yönetmek için */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {stil.harf} Puanı {'>'} 9 — Öneriler
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs font-bold mb-3 px-3 py-1.5 rounded uppercase tracking-wide"
                          style={{ background: stil.bg, color: stil.renk }}>Üretkenlik Önerileri</div>
                        <ul className="space-y-2">
                          {stil.uretkenlik.map((m, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                              <span className="flex-shrink-0 mt-0.5" style={{ color: stil.renk }}>•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold mb-3 px-3 py-1.5 rounded uppercase tracking-wide"
                          style={{ background: stil.bg, color: stil.renk }}>Profili Yönetmek İçin</div>
                        <ul className="space-y-2">
                          {stil.yonetmekIcin.map((m, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                              <span className="flex-shrink-0 mt-0.5" style={{ color: stil.renk }}>•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* KE profil yorumu + Davranış tarzları tablosu */}
      {tip === 'kisisel_etkilesim' && meta.profil_kodu && (() => {
        const yorum = ke_profil_yorum(meta.profil_kodu)
        const birincilKod = meta.profil_kodu[0]
        return (
          <div className="space-y-4">
            {yorum && (
              <div className={`rounded-xl border p-4 ${yorum.olumlu ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                <div className="text-xs font-medium text-gray-700 mb-1">
                  {yorum.olumlu ? '✅ Profil yorumu' : '📌 Profil yorumu'}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{yorum.mesaj}</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">Davranış Tarzları</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 w-40">Davranış Tarzı</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">İş Dünyasındaki Gücü</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Olası Riski</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KE_TARZLAR.map(t => {
                      const birincil = t.kod === birincilKod
                      return (
                        <tr key={t.kod} className="border-b border-gray-50 last:border-0"
                          style={birincil ? { background: t.renk.bg, borderLeft: `3px solid ${t.renk.border}` } : {}}>
                          <td className="px-4 py-3 font-medium align-top" style={{ color: birincil ? t.renk.text : '#374151' }}>
                            <div className="flex flex-col gap-1">
                              <span>{t.ad}</span>
                              {birincil && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold w-fit"
                                  style={{ background: t.renk.badge, color: t.renk.badgeText }}>Birincil</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 leading-relaxed align-top">{t.guc}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 leading-relaxed align-top">{t.risk}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">İş Dünyası Açısından Kısa Özet</div>
              <div className="p-4 grid grid-cols-2 gap-3">
                {KE_TARZLAR.map(t => {
                  const birincil = t.kod === birincilKod
                  return (
                    <div key={t.kod} className="rounded-lg p-3 border"
                      style={{ background: birincil ? t.renk.bg : '#f8fafc', borderColor: birincil ? t.renk.border : '#e2e8f0' }}>
                      <div className="text-xs font-semibold mb-1.5" style={{ color: birincil ? t.renk.text : '#6b7280' }}>
                        {t.ad}{birincil && <span className="ml-1">✦</span>}
                      </div>
                      <div className="text-xs italic leading-relaxed" style={{ color: birincil ? t.renk.text : '#9ca3af' }}>{t.ozet}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <div className="text-xs font-semibold text-green-800 mb-2">🎯 Davranış Bilimlerinin Önerdiği İdeal Nokta</div>
              <p className="text-sm text-green-900 leading-relaxed">
                <strong>Girişken (Assertive)</strong> iletişim tarzı, iş dünyasında en etkili ve sürdürülebilir davranış biçimi olarak kabul görmektedir.
                Girişkenlik; kendi haklarını, duygularını ve görüşlerini net biçimde ifade ederken karşı tarafın haklarına da saygı duymayı içerir.
                Bu tarz, hem bireysel etkinliği hem de ekip dinamiklerini güçlendirir.
              </p>
            </div>
          </div>
        )
      })()}

      {/* Motivasyon değerlendirme ve tablolar */}
      {tip === 'motivasyon' && (() => {
        const icerik = MOT_ICERIK[meta.temel_ihtiyac]
        if (!icerik) return null
        const boyutlar = ['İlişki', 'Başarı', 'Etkileme', 'Güvenlik']
        const thRenkler = {
          'İlişki':   { bg: '#e0f2fe', text: '#0369a1' },
          'Başarı':   { bg: '#dcfce7', text: '#166534' },
          'Etkileme': { bg: '#f3e8ff', text: '#7e22ce' },
          'Güvenlik': { bg: '#fef3c7', text: '#92400e' },
        }
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="rounded-xl p-4 flex gap-3 items-start bg-blue-50 border border-blue-200">
                <span className="text-lg flex-shrink-0">🎯</span>
                <p className="text-sm text-blue-900 leading-relaxed">
                  <strong>{meta.temel_ihtiyac} motivasyonu</strong> ön plandadır. {icerik.aciklama}
                </p>
              </div>
              <div className="rounded-xl p-4 flex gap-3 items-start bg-green-50 border border-green-200">
                <span className="text-lg flex-shrink-0">📊</span>
                <p className="text-sm text-green-900 leading-relaxed">
                  Motivasyon {meta.motivasyon_seviyesi?.toLowerCase()} bir seviyede; <strong>{meta.temel_ihtiyac}</strong> boyutunda güçlendirme yapılması önerilir.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {meta.temel_ihtiyac} motivasyonu için — Yapın / Yapmayın
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-green-700 bg-green-100 rounded px-3 py-1.5 mb-3 uppercase tracking-wide">Yapın</div>
                  <ul className="space-y-2">
                    {icerik.yapin.map((m, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                        <span className="text-green-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-bold text-red-700 bg-red-100 rounded px-3 py-1.5 mb-3 uppercase tracking-wide">Yapmayın</div>
                  <ul className="space-y-2">
                    {icerik.yapmayin.map((m, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                        <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">✕</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">4 Boyuta İlişkin İhtiyaçlar</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {boyutlar.map(b => {
                        const birincil = b === meta.temel_ihtiyac
                        const r = thRenkler[b] || { bg: '#f1f5f9', text: '#475569' }
                        return (
                          <th key={b} className="px-3 py-2.5 text-left font-bold" style={{ background: r.bg, color: r.text }}>
                            <div className="flex flex-col gap-1">
                              <span>{b}</span>
                              {birincil && (
                                <span style={{ fontSize: '9px', background: '#16a34a', color: '#fff', padding: '1px 7px', borderRadius: '99px', display: 'inline-block', fontWeight: 700 }}>
                                  Birincil ihtiyaç
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {boyutlar.map(b => {
                        const birincil = b === meta.temel_ihtiyac
                        return (
                          <td key={b} className="px-3 py-3 align-top border-t border-gray-100"
                            style={{ background: birincil ? '#f0fdf4' : 'white' }}>
                            <ul className="space-y-1.5">
                              {(MOT_4BOYUT[b] || []).map((m, i) => (
                                <li key={i} className="flex gap-1.5 text-gray-600 leading-relaxed">
                                  <span className="text-gray-300 flex-shrink-0">·</span>
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">Vurgulanan sütun kişinin birincil motivasyon ihtiyacını gösterir.</div>
            </div>
          </div>
        )
      })()}

      {/* Problem Çözme — 3 stil kartı */}
      {tip === 'problem_cozme' && (() => {
        const puanlar = { realist: p.realist || 0, aktivist: p.aktivist || 0, idealist: p.idealist || 0 }
        const maksPuan = Math.max(...Object.values(puanlar))
        const baskinlar = new Set(Object.entries(puanlar).filter(([, v]) => v === maksPuan).map(([k]) => k))

        return (
          <div className="space-y-4">
            {/* 3 kart yan yana */}
            <div className="grid grid-cols-3 gap-3">
              {PC_ICERIK.map(stil => {
                const baskin = baskinlar.has(stil.key)
                return (
                  <div key={stil.key} className="rounded-xl border overflow-hidden flex flex-col"
                    style={{
                      borderColor: baskin ? stil.renk : '#e2e8f0',
                      boxShadow: baskin ? `0 0 0 2px ${stil.renk}30` : 'none',
                      background: baskin ? stil.bg : '#fafafa',
                    }}>
                    {/* Başlık */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="text-sm font-bold" style={{ color: stil.renk }}>{stil.ad}</div>
                        {baskin && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: stil.acik, color: stil.renk }}>Baskın</span>
                        )}
                      </div>
                    </div>

                    {/* Alıntı */}
                    <div className="px-4 pb-3 border-b" style={{ borderColor: baskin ? stil.border : '#f1f5f9' }}>
                      <p className="text-xs italic leading-relaxed" style={{ color: baskin ? stil.renk : '#9ca3af' }}>
                        "{stil.alinti}"
                      </p>
                    </div>

                    {/* Artılar */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: baskin ? stil.border : '#f1f5f9' }}>
                      <ul className="space-y-1.5">
                        {stil.arti.map((m, i) => (
                          <li key={i} className="flex gap-2 text-xs leading-relaxed"
                            style={{ color: baskin ? '#374151' : '#9ca3af' }}>
                            <span className="font-bold flex-shrink-0" style={{ color: stil.renk }}>+</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Eksiler */}
                    <div className="px-4 py-3 flex-1">
                      <ul className="space-y-1.5">
                        {stil.eksi.map((m, i) => (
                          <li key={i} className="flex gap-2 text-xs leading-relaxed"
                            style={{ color: baskin ? '#374151' : '#9ca3af' }}>
                            <span className="font-bold flex-shrink-0 text-red-400">−</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Alt özet bar */}
            <div className="grid grid-cols-3 gap-3">
              {PC_ICERIK.map(stil => {
                const baskin = baskinlar.has(stil.key)
                return (
                  <div key={stil.key} className="rounded-xl p-3 border flex gap-2.5 items-start"
                    style={{ background: baskin ? stil.bg : '#f8fafc', borderColor: baskin ? stil.border : '#e2e8f0' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: baskin ? stil.renk : '#e2e8f0', color: baskin ? '#fff' : '#9ca3af' }}>
                      {stil.ad[0]}
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-0.5" style={{ color: baskin ? stil.renk : '#9ca3af' }}>
                        {stil.ad}:
                      </div>
                      <div className="text-xs italic leading-relaxed" style={{ color: baskin ? '#374151' : '#d1d5db' }}>
                        {stil.ozet}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Kompakt print bileşenleri (sadece yazdırmada görünür) ──────────────────

const PRINT_RENKLER = {
  liderlik_stili:    '#3b82f6',
  motivasyon:        '#22c55e',
  kisisel_etkilesim: '#f97316',
  problem_cozme:     '#a855f7',
}
const PRINT_KISALT = { liderlik_stili:'LS', motivasyon:'M', kisisel_etkilesim:'KE', problem_cozme:'PC' }

function PrintBar({ label, puan, maks, renk }) {
  const yuzde = maks > 0 ? Math.min(100, Math.round((Number(puan) / maks) * 100)) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
      <span style={{ fontSize:8.5, color:'#555', width:62, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:5, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${yuzde}%`, height:'100%', background:renk, borderRadius:3 }} />
      </div>
      <span style={{ fontSize:8.5, color:'#111', width:14, textAlign:'right', flexShrink:0 }}>{Number(puan)||0}</span>
    </div>
  )
}

function PrintEnvanterKart({ rapor }) {
  if (!rapor || rapor.puan_yok) return null
  const tip = rapor.envanter_tipi
  const meta = rapor.puanlar || {}
  const p = meta.puanlar || {}
  const renk = PRINT_RENKLER[tip] || '#6b7280'

  const anaBilgi = {
    liderlik_stili:    { birincil: meta.birincil_stil,  ikincil: meta.baskin_var ? 'Baskın' : meta.ikincil_stil || '' },
    motivasyon:        { birincil: meta.temel_ihtiyac,  ikincil: `${meta.motivasyon_seviyesi || ''} motivasyon` },
    kisisel_etkilesim: { birincil: meta.profil_kodu,    ikincil: meta.birincil_stil },
    problem_cozme:     { birincil: meta.birincil_tarz,  ikincil: meta.seviyeler?.[meta.birincil_tarz?.toLowerCase()] || '' },
  }[tip] || {}

  const barlar = {
    liderlik_stili:    [['Cesur', p.cesur, 32], ['Etkileyici', p.etkileyici, 32], ['Sempatik', p.sempatik, 32], ['Teknik', p.teknik, 32]],
    motivasyon:        [['Başarı', p.basari, 40], ['Etkileme', p.etkileme, 40], ['İlişki', p.iliski, 40], ['Güvenlik', p.guvenlik, 40]],
    kisisel_etkilesim: (meta.sirali_stiller || []).map(s => [s.ad, s.puan, 50]),
    problem_cozme:     [['İdealist', p.idealist, 100], ['Aktivist', p.aktivist, 100], ['Realist', p.realist, 100]],
  }[tip] || []

  const cols = barlar.length === 3 ? 3 : 2

  const keYorum = tip === 'kisisel_etkilesim' && meta.profil_kodu ? ke_profil_yorum(meta.profil_kodu) : null

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${renk}`,
      borderRadius: 8,
      overflow: 'hidden',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      background: '#fff',
    }}>
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: renk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: 'white', fontSize: 8, fontWeight: 700 }}>{PRINT_KISALT[tip] || '?'}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#111', flex: 1 }}>{rapor.envanter_adi}</span>
        {rapor.tamamlanma_tarihi && (
          <span style={{ fontSize: 8, color: '#aaa' }}>
            {new Date(rapor.tamamlanma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <div style={{ padding: 10 }}>
        {/* Ana metrik */}
        <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: renk }}>{anaBilgi.birincil}</span>
          {anaBilgi.ikincil && <span style={{ fontSize: 9, color: '#888', marginLeft: 6 }}>{anaBilgi.ikincil}</span>}
        </div>

        {/* Barlar */}
        {barlar.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 12px', marginBottom: 8 }}>
            {barlar.map(([lbl, puan, maks]) => (
              <PrintBar key={lbl} label={lbl} puan={puan} maks={maks} renk={renk} />
            ))}
          </div>
        )}

        {/* Güçlü + Gelişim */}
        {(rapor.guclu_yonler?.length > 0 || rapor.gelisim_alanlari?.length > 0) && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 7, borderTop: '1px solid #f3f4f6', marginTop: 2 }}>
            {rapor.guclu_yonler?.length > 0 && (
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: 3 }}>Güçlü yönler</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {rapor.guclu_yonler.map(g => (
                    <span key={g} style={{ fontSize: 7.5, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 10 }}>{g}</span>
                  ))}
                </div>
              </div>
            )}
            {rapor.gelisim_alanlari?.length > 0 && (
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#ca8a04', display: 'block', marginBottom: 3 }}>Gelişim alanları</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {rapor.gelisim_alanlari.map(g => (
                    <span key={g} style={{ fontSize: 7.5, background: '#fef9c3', color: '#854d0e', padding: '2px 6px', borderRadius: 10 }}>{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liderlik — yönetim önerileri (ilk 3) */}
        {tip === 'liderlik_stili' && rapor.yonetim_onerileri?.length > 0 && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#1d4ed8', display: 'block', marginBottom: 3 }}>Yönetim önerileri</span>
            {rapor.yonetim_onerileri.slice(0, 3).map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 7.5, color: '#3b82f6', flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 7.5, color: '#1e3a8a', lineHeight: 1.4 }}>{o}</span>
              </div>
            ))}
          </div>
        )}

        {/* Motivasyon açıklama */}
        {tip === 'motivasyon' && meta.motivasyon_aciklama && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#15803d', display: 'block', marginBottom: 2 }}>Değerlendirme</span>
            <p style={{ fontSize: 7.5, color: '#374151', lineHeight: 1.5, margin: 0 }}>{meta.motivasyon_aciklama}</p>
          </div>
        )}

        {/* KE profil yorumu */}
        {keYorum && (
          <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: keYorum.olumlu ? '#15803d' : '#6b7280', display: 'block', marginBottom: 2 }}>
              {keYorum.olumlu ? '✅' : '📌'} Profil yorumu
            </span>
            <p style={{ fontSize: 7.5, color: '#374151', lineHeight: 1.5, margin: 0 }}>{keYorum.mesaj}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ButunlesikPrint({ veri, katilimci }) {
  const { tamamlanan_sayi, toplam_atama } = veri
  const raporlar = [...(veri.raporlar || [])].sort(
    (a, b) => (ENVANTER_SIRASI[a.envanter_tipi] || 99) - (ENVANTER_SIRASI[b.envanter_tipi] || 99)
  )
  const yuzde = toplam_atama > 0 ? Math.round(tamamlanan_sayi / toplam_atama * 100) : 0
  const tarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="print-only" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Kapak başlığı */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #1d4ed8' }}>
        <div>
          <div style={{ fontSize: 8.5, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>PI Envanter — Bütünleşik Rapor</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>
            {katilimci?.ad} {katilimci?.soyad}
          </div>
          {(katilimci?.pozisyon || katilimci?.departman) && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
              {katilimci.pozisyon || katilimci.departman}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8.5, color: '#9ca3af', marginBottom: 6 }}>{tarih}</div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {raporlar.filter(r => !r.puan_yok).map(r => (
              <span key={r.envanter_tipi} style={{
                fontSize: 8,
                fontWeight: 700,
                color: PRINT_RENKLER[r.envanter_tipi] || '#6b7280',
                background: `${PRINT_RENKLER[r.envanter_tipi]}18`,
                padding: '2px 8px',
                borderRadius: 10,
                border: `1px solid ${PRINT_RENKLER[r.envanter_tipi]}35`,
              }}>{PRINT_KISALT[r.envanter_tipi]}</span>
            ))}
          </div>
        </div>
      </div>

      {/* İlerleme özeti */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '7px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>
          <strong style={{ color: '#111', fontSize: 14 }}>{tamamlanan_sayi}</strong>
          <span style={{ color: '#9ca3af', fontSize: 10 }}>/{toplam_atama}</span>
          <span style={{ marginLeft: 5 }}>envanter tamamlandı</span>
        </span>
        <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${yuzde}%`, height: '100%', background: '#1d4ed8', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>%{yuzde}</span>
      </div>

      {/* Envanter kartları — 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: raporlar.length === 1 ? '1fr' : '1fr 1fr', gap: 10 }}>
        {raporlar.map(r => <PrintEnvanterKart key={r.envanter_tipi} rapor={r} />)}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: '#9ca3af' }}>PI Envanter Sistemi · TATKO</span>
        <span style={{ fontSize: 8, color: '#d1d5db' }}>{katilimci?.ad} {katilimci?.soyad} · {tarih}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ButunlesikIcerik({ veri }) {
  const { tamamlanan_sayi, toplam_atama } = veri
  const raporlar = [...(veri.raporlar || [])].sort(
    (a, b) => (ENVANTER_SIRASI[a.envanter_tipi] || 99) - (ENVANTER_SIRASI[b.envanter_tipi] || 99)
  )
  const yuzde = toplam_atama > 0 ? Math.round(tamamlanan_sayi / toplam_atama * 100) : 0

  // Her envanter için tek satır özet
  const profilKartlari = raporlar.map(rapor => {
    const tip = rapor.envanter_tipi
    const meta = rapor.puanlar || {}
    const printRenk = PRINT_RENKLER[tip] || '#6b7280'
    const envRenk = ENV_RENK[tip] || {}
    let anahtar = '—'
    let alt = ''
    if (!rapor.puan_yok) {
      switch (tip) {
        case 'liderlik_stili':    anahtar = meta.birincil_stil || '—';  alt = meta.baskin_var ? 'Baskın' : ''; break
        case 'motivasyon':        anahtar = meta.temel_ihtiyac || '—';  alt = meta.motivasyon_seviyesi || ''; break
        case 'kisisel_etkilesim': anahtar = meta.profil_kodu || '—';    alt = meta.birincil_stil || ''; break
        case 'problem_cozme':     anahtar = meta.birincil_tarz || '—';  alt = ''; break
        default: break
      }
    }
    return { tip, ad: rapor.envanter_adi, anahtar, alt, printRenk, envRenk, tamamlandi: !rapor.puan_yok }
  })

  return (
    <div className="space-y-6">

      {/* Profil özeti — 4 mini kart */}
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profil Özeti</div>
        <div className="grid grid-cols-2 gap-3">
          {profilKartlari.map(k => (
            <div key={k.tip}
              className={`bg-white rounded-xl border overflow-hidden flex transition-opacity ${!k.tamamlandi ? 'opacity-50' : ''}`}
              style={{ borderColor: k.tamamlandi ? `${k.printRenk}35` : '#e5e7eb' }}
            >
              <div className="w-1 flex-shrink-0" style={{ background: k.tamamlandi ? k.printRenk : '#e5e7eb' }} />
              <div className="p-4 flex-1 min-w-0">
                <div className="text-xs font-medium mb-1.5" style={{ color: k.tamamlandi ? k.printRenk : '#9ca3af' }}>
                  {k.ad}
                </div>
                {k.tamamlandi ? (
                  <div className="flex items-baseline gap-2 min-w-0">
                    <div className="text-base font-bold text-gray-900 truncate">{k.anahtar}</div>
                    {k.alt && <div className="text-xs text-gray-400 flex-shrink-0">{k.alt}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">Bekleniyor</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* İlerleme */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">Tamamlanma durumu</div>
          <div className="text-xs text-gray-400">{tamamlanan_sayi}/{toplam_atama} envanter</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-tatko rounded-full transition-all duration-700" style={{ width: `${yuzde}%` }} />
          </div>
          <div className="text-sm font-bold text-tatko w-10 text-right">%{yuzde}</div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-tatko" />
            <span className="text-xs text-gray-500">{tamamlanan_sayi} tamamlandı</span>
          </div>
          {toplam_atama - tamamlanan_sayi > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <span className="text-xs text-gray-400">{toplam_atama - tamamlanan_sayi} bekliyor</span>
            </div>
          )}
        </div>
      </div>

      {/* Envanter detayları */}
      {raporlar.map(rapor => {
        const r = ENV_RENK[rapor.envanter_tipi] || { bg: 'bg-gray-100', text: 'text-gray-700', kisalt: '?' }
        const printRenk = PRINT_RENKLER[rapor.envanter_tipi] || '#e5e7eb'
        return (
          <div key={rapor.envanter_tipi} className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            style={{ borderLeft: `4px solid ${printRenk}` }}>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${r.bg} ${r.text}`}>
                {r.kisalt}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{rapor.envanter_adi}</div>
                {rapor.tamamlanma_tarihi && (
                  <div className="text-xs text-gray-400">
                    {new Date(rapor.tamamlanma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5">
              <RaporIcerigi rapor={rapor} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RaporSayfasi() {
  const { katilimciId } = useParams()
  const navigate = useNavigate()
  const [katilimci, setKatilimci] = useState(null)
  const [aktifAtamaId, setAktifAtamaId] = useState(null)
  const [rapor, setRapor] = useState(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [raporYukleniyor, setRaporYukleniyor] = useState(false)
  const [goruntule, setGoruntule] = useState('bireysel') // 'bireysel' | 'butunlesik'
  const [butunlesikVeri, setButunlesikVeri] = useState(null)
  const [butunlesikYukleniyor, setButunlesikYukleniyor] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      try {
        const data = await katilimciDetay(katilimciId)
        setKatilimci(data)
        const ilk = data.atamalar.find(a => a.durum === 'tamamlandi' || a.durum === 'raporlandi')
        if (ilk) setAktifAtamaId(ilk.id)
      } catch (e) { console.error(e) }
      finally { setYukleniyor(false) }
    }
    yukle()
  }, [katilimciId])

  useEffect(() => {
    if (!aktifAtamaId || !katilimciId) return
    const yukle = async () => {
      setRaporYukleniyor(true)
      try {
        const data = await bireyselRapor(katilimciId, aktifAtamaId)
        setRapor(data.rapor)
      } catch (e) { setRapor(null) }
      finally { setRaporYukleniyor(false) }
    }
    yukle()
  }, [aktifAtamaId, katilimciId])

  const handleButunlesikGoster = async () => {
    setGoruntule('butunlesik')
    if (butunlesikVeri) return
    setButunlesikYukleniyor(true)
    try {
      const data = await butunlesikRapor(katilimciId)
      setButunlesikVeri(data)
    } catch (e) { setButunlesikVeri(null) }
    finally { setButunlesikYukleniyor(false) }
  }

  if (yukleniyor) return <Layout><div className="flex-1 flex items-center justify-center text-sm text-gray-400">Yükleniyor...</div></Layout>
  if (!katilimci) return <Layout><div className="flex-1 flex items-center justify-center text-sm text-red-400">Katılımcı bulunamadı</div></Layout>

  const tamamlananAtamalar = katilimci.atamalar
    .filter(a => a.durum === 'tamamlandi' || a.durum === 'raporlandi')
    .sort((a, b) => (ENVANTER_SIRASI[a.envanter_tipi] || 99) - (ENVANTER_SIRASI[b.envanter_tipi] || 99))
  const basHarfler = `${katilimci.ad?.[0]}${katilimci.soyad?.[0]}`.toUpperCase()
  const aktifAtama = katilimci.atamalar.find(a => a.id === aktifAtamaId)

  return (
    <Layout>
      <div className="no-print h-13 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => navigate('/katilimcilar')} className="text-gray-400 hover:text-gray-600">Katılımcılar</button>
          <span className="text-gray-300">/</span>
          <button onClick={() => navigate(`/katilimcilar/${katilimciId}`)} className="text-gray-400 hover:text-gray-600">{katilimci.ad} {katilimci.soyad}</button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">Rapor</span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          📄 PDF indir
        </button>
      </div>

      <div className="flex-1 overflow-auto flex bg-gray-50">
        <div className="no-print w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-5 text-center border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base font-medium mx-auto mb-2">{basHarfler}</div>
            <div className="text-sm font-medium text-gray-900">{katilimci.ad} {katilimci.soyad}</div>
            <div className="text-xs text-gray-500 mt-0.5">{katilimci.pozisyon || katilimci.departman || '—'}</div>
          </div>
          <div className="flex-1 p-3">
            {/* Bütünleşik rapor butonu */}
            <button
              onClick={handleButunlesikGoster}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left mb-3 transition-all ${
                goruntule === 'butunlesik'
                  ? 'bg-tatko text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                goruntule === 'butunlesik' ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
              }`}>
                📋
              </div>
              <span className="text-xs font-medium">Bütünleşik Rapor</span>
            </button>

            <div className="text-xs text-gray-400 px-2 mb-2">Tamamlanan envanterler</div>
            {tamamlananAtamalar.length === 0
              ? <div className="text-xs text-gray-400 px-2">Henüz tamamlanan envanter yok</div>
              : <div className="space-y-1">
                  {tamamlananAtamalar.map(a => {
                    const r = ENV_RENK[a.envanter_tipi] || {}
                    const aktif = a.id === aktifAtamaId
                    return (
                      <button key={a.id} onClick={() => { setAktifAtamaId(a.id); setGoruntule('bireysel') }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${aktif ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${r.bg} ${r.text}`}>{r.kisalt}</div>
                        <span className={`text-xs ${aktif ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{a.envanter_adi}</span>
                      </button>
                    )
                  })}
                </div>
            }
            {tamamlananAtamalar.length < katilimci.atamalar.length && (
              <div className="mt-3 px-2">
                <div className="text-xs text-gray-300 mb-1">Bekleyen</div>
                {katilimci.atamalar.filter(a => a.durum !== 'tamamlandi' && a.durum !== 'raporlandi').map(a => {
                  const r = ENV_RENK[a.envanter_tipi] || {}
                  return (
                    <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 opacity-40">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${r.bg} ${r.text}`}>{r.kisalt}</div>
                      <span className="text-xs text-gray-500">{a.envanter_adi}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 print-area">

          {/* Yazdırma başlığı — sadece bireysel modda gösterilir */}
          {goruntule === 'bireysel' && (
            <div className="print-only mb-6 pb-4 border-b border-gray-300">
              <div className="text-xs text-gray-500 mb-1">PI Envanter — Bireysel Rapor</div>
              <div className="text-lg font-medium text-gray-900">{katilimci.ad} {katilimci.soyad}</div>
              {(katilimci.pozisyon || katilimci.departman) && (
                <div className="text-sm text-gray-500">{katilimci.pozisyon || katilimci.departman}</div>
              )}
              <div className="text-sm text-gray-400 mt-1">
                {aktifAtama?.envanter_adi ? `${aktifAtama.envanter_adi}` : ''}
              </div>
            </div>
          )}

          {/* Bütünleşik görünüm */}
          {goruntule === 'butunlesik' && (
            butunlesikYukleniyor ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">Bütünleşik rapor yükleniyor...</div>
            ) : !butunlesikVeri ? (
              <div className="flex items-center justify-center h-full text-sm text-red-400">Rapor yüklenemedi</div>
            ) : butunlesikVeri.tamamlanan_sayi === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-3xl mb-3">📭</div>
                  <div className="text-sm text-gray-500">Henüz tamamlanmış envanter yok</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="no-print flex items-center justify-between mb-5">
                  <h2 className="text-base font-medium text-gray-900">Bütünleşik Rapor</h2>
                </div>
                <div className="no-print">
                  <ButunlesikIcerik veri={butunlesikVeri} />
                </div>
                <ButunlesikPrint veri={butunlesikVeri} katilimci={katilimci} />
              </div>
            )
          )}

          {/* Bireysel envanter görünümü */}
          {goruntule === 'bireysel' && (
            !aktifAtamaId ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">Soldaki listeden bir envanter seçin</div>
            ) : raporYukleniyor ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">Rapor yükleniyor...</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">{aktifAtama?.envanter_adi} — Rapor</h2>
                    {aktifAtama?.tamamlanma_tarihi && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(aktifAtama.tamamlanma_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
                <RaporIcerigi rapor={rapor} />
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  )
}
