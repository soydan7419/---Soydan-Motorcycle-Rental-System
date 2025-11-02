import express from 'express';
import Rezervasyon from '../models/Rezervasyon.js';
import Motor from '../models/Motor.js';
import { protect, authorize } from '../middleware/auth.js';
import { 
  sendRezervasyonOnayEmail, 
  sendYeniRezervasyonBildirimi,
  sendRezervasyonOlusturulduEmail 
} from '../utils/emailService.js';

const router = express.Router();

// Tüm rezervasyonları getir (admin için)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const rezervasyonlar = await Rezervasyon.find()
      .populate('motor', 'marka model plaka gunlukFiyat')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(rezervasyonlar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kullanıcının kendi rezervasyonlarını getir
router.get('/benim-rezervasyonlarim', protect, async (req, res) => {
  try {
    const rezervasyonlar = await Rezervasyon.find({ user: req.user._id })
      .populate('motor', 'marka model plaka gunlukFiyat')
      .sort({ createdAt: -1 });
    
    res.json(rezervasyonlar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni rezervasyon oluştur
router.post('/', protect, async (req, res) => {
  try {
    const { 
      motorId, 
      musteriAd, 
      musteriEmail, 
      musteriTelefon, 
      baslangicTarihi, 
      bitisTarihi 
    } = req.body;

    // Motoru kontrol et
    const motor = await Motor.findById(motorId);
    if (!motor) {
      return res.status(404).json({ message: 'Motor bulunamadı' });
    }

    // Motor müsait mi kontrol et
    if (motor.durum !== 'musait') {
      return res.status(400).json({ message: 'Bu motor şu anda müsait değil' });
    }

    // Tarih kontrolü
    const baslangic = new Date(baslangicTarihi);
    const bitis = new Date(bitisTarihi);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

if (baslangic < today) {
  return res.status(400).json({ message: 'Geçmiş tarih için rezervasyon yapılamaz' });
}

    if (bitis <= baslangic) {
      return res.status(400).json({ message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır' });
    }

    // Tarih çakışması kontrolü
    const cakisanRezervasyon = await Rezervasyon.findOne({
      motor: motorId,
      durum: { $in: ['beklemede', 'onaylandi'] },
      $or: [
        {
          baslangicTarihi: { $lte: bitis },
          bitisTarihi: { $gte: baslangic }
        }
      ]
    });

    if (cakisanRezervasyon) {
      return res.status(400).json({ message: 'Seçilen tarihlerde motor müsait değil' });
    }

    // Toplam gün ve ücret hesapla
    const gunFarki = Math.ceil((bitis - baslangic) / (1000 * 60 * 60 * 24));
    const toplamUcret = gunFarki * motor.gunlukFiyat;

    // Rezervasyon oluştur
    const rezervasyon = await Rezervasyon.create({
      motor: motorId,
      user: req.user._id,
      musteriAd,
      musteriEmail,
      musteriTelefon,
      baslangicTarihi: baslangic,
      bitisTarihi: bitis,
      toplamGun: gunFarki,
      toplamUcret
    });

    // Motoru rezerve edildi olarak işaretle
    motor.durum = 'kiralandi';
    await motor.save();

    const yeniRezervasyon = await Rezervasyon.findById(rezervasyon._id)
      .populate('motor', 'marka model plaka gunlukFiyat');

    // 📧 EMAIL GÖNDER - YENİ EKLENDİ
    try {
      await sendRezervasyonOlusturulduEmail(yeniRezervasyon);
      await sendYeniRezervasyonBildirimi(yeniRezervasyon);
    } catch (emailError) {
      console.log('⚠️  Email gönderilemedi ama rezervasyon oluşturuldu:', emailError.message);
    }

    res.status(201).json(yeniRezervasyon);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rezervasyon durumunu güncelle (admin)
router.put('/:id/durum', protect, authorize('admin'), async (req, res) => {
  try {
    const { durum } = req.body;
    const rezervasyon = await Rezervasyon.findById(req.params.id)
      .populate('motor')
      .populate('user', 'name email');

    if (!rezervasyon) {
      return res.status(404).json({ message: 'Rezervasyon bulunamadı' });
    }

    rezervasyon.durum = durum;

    // Eğer reddedilirse motoru tekrar müsait yap
    if (durum === 'reddedildi' || durum === 'iptal') {
      rezervasyon.motor.durum = 'musait';
      await rezervasyon.motor.save();
    }

    await rezervasyon.save();

    // 📧 EMAIL GÖNDER - YENİ EKLENDİ
    try {
      if (durum === 'onaylandi') {
        await sendRezervasyonOnayEmail(rezervasyon);
      }
    } catch (emailError) {
      console.log('⚠️  Onay emaili gönderilemedi:', emailError.message);
    }

    res.json(rezervasyon);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rezervasyon email gönderme
router.post('/:id/email', protect, authorize('admin'), async (req, res) => {
  try {
    const rezervasyon = await Rezervasyon.findById(req.params.id)
      .populate('motor')
      .populate('user', 'name email');

    if (!rezervasyon) {
      return res.status(404).json({ message: 'Rezervasyon bulunamadı' });
    }

    // Onay email'i gönder
    await sendRezervasyonOnayEmail(rezervasyon);
    
    res.json({ message: 'Onay e-postası gönderildi' });
  } catch (error) {
    console.error('Email gönderme hatası:', error);
    res.status(500).json({ message: 'Email gönderilemedi' });
  }
});

// Rezervasyon sil
router.delete('/:id', protect, async (req, res) => {
  try {
    const rezervasyon = await Rezervasyon.findById(req.params.id);

    if (!rezervasyon) {
      return res.status(404).json({ message: 'Rezervasyon bulunamadı' });
    }

    // Sadece kendi rezervasyonunu veya admin silebilir
    if (rezervasyon.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu rezervasyonu silme yetkiniz yok' });
    }

    // Motoru tekrar müsait yap
    await Motor.findByIdAndUpdate(rezervasyon.motor, { durum: 'musait' });
    
    await Rezervasyon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rezervasyon silindi' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;