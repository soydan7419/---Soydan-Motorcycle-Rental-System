import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import Odeme from '../models/Odeme.js';
import Rezervasyon from '../models/Rezervasyon.js';
import Motor from '../models/Motor.js'; // EKLEDİK
import { sendRezervasyonOnayEmail } from '../utils/emailService.js';

const router = express.Router();

// GERÇEK STRIPE ENTEGRASYONU - Hardcoded key ile
const stripeKey = 'sk_test_...';
const stripe = new Stripe(stripeKey);

console.log('🔧 Ödeme routes yüklendi - GERÇEK ve TEST MOD');

// TEST ÖDEME ENDPOINT'i - BUNU EKLEYİN
router.post('/test-odeme', protect, async (req, res) => {
  try {
    const { rezervasyonId, kartBilgileri } = req.body;
    
    console.log('🎯 Test ödeme isteği geldi:', { 
      rezervasyonId, 
      kullanici: req.user._id,
      kartNo: kartBilgileri?.kartNo ? '***' + kartBilgileri.kartNo.slice(-4) : 'yok'
    });

    // 1. GEREKLİ ALAN KONTROLÜ
    if (!rezervasyonId || !kartBilgileri) {
      return res.status(400).json({
        success: false,
        message: 'Eksik bilgiler: rezervasyonId ve kartBilgileri gereklidir'
      });
    }

    // 2. TEST KARTLARI LİSTESİ
    const testKartlari = [
      '4242424242424242',
      '4000056655665556', 
      '5555555555554444',
      '2223003122003222',
      '5200828282828210',
      '5105105105105100'
    ];

    const kartNo = kartBilgileri.kartNo.replace(/\s/g, '');
    
    // 3. TEST KARTI KONTROLÜ
    if (!testKartlari.includes(kartNo)) {
      return res.status(400).json({
        success: false,
        message: 'Bu test kartı desteklenmiyor. Lütfen test kartı kullanın: 4242 4242 4242 4242'
      });
    }

    // 4. REZERVASYONU BUL
    const rezervasyon = await Rezervasyon.findById(rezervasyonId);
    if (!rezervasyon) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    // 5. REZERVASYON DURUM KONTROLÜ
    if (rezervasyon.durum === 'onaylandi') {
      return res.status(400).json({
        success: false,
        message: 'Bu rezervasyon zaten onaylanmış'
      });
    }

    // 6. ÖDEME BAŞARILI - GÜNCELLEMELERİ YAP
    console.log('💰 Test ödeme başarılı, güncellemeler yapılıyor...');

    // Rezervasyonu güncelle
    rezervasyon.odemeDurumu = 'tamamlandi';
    rezervasyon.durum = 'onaylandi';
    rezervasyon.odemeTarihi = new Date();
    await rezervasyon.save();

    // Motor durumunu güncelle
    await Motor.findByIdAndUpdate(rezervasyon.motor, {
      durum: 'kiralik'
    });

    // Ödeme kaydı oluştur (test modunda)
    await Odeme.create({
      rezervasyon: rezervasyonId,
      user: req.user._id,
      stripePaymentIntentId: 'test_' + Date.now(),
      amount: rezervasyon.toplamUcret * 100, // Kuruş cinsinden
      status: 'succeeded',
      paymentMethod: 'test_card',
      testMod: true
    });

    console.log('✅ Test ödeme başarılı:', {
      rezervasyonId: rezervasyon._id,
      motorId: rezervasyon.motor,
      tutar: rezervasyon.toplamUcret
    });

    // 7. BAŞARILI YANIT
    res.json({
      success: true,
      message: '✅ Ödeme başarıyla tamamlandı! (Test Modu)',
      odemeBilgisi: {
        odemeId: 'test_' + Date.now(),
        tutar: rezervasyon.toplamUcret,
        tarih: new Date().toLocaleString('tr-TR'),
        kart: '***' + kartNo.slice(-4)
      },
      rezervasyon: {
        id: rezervasyon._id,
        durum: rezervasyon.durum,
        odemeDurumu: rezervasyon.odemeDurumu
      }
    });

  } catch (error) {
    console.error('💥 Test ödeme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası: ' + error.message
    });
  }
});

// Ödeme başlatma (GERÇEK)
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { rezervasyonId } = req.body;

    console.log('💰 GERÇEK ÖDEME - Rezervasyon:', rezervasyonId);

    const rezervasyon = await Rezervasyon.findById(rezervasyonId)
      .populate('motor');
    
    if (!rezervasyon) {
      return res.status(404).json({ message: 'Rezervasyon bulunamadı' });
    }

    // TL'yi kuruşa çevir (Stripe kuruş kullanır)
    const amount = Math.round(rezervasyon.toplamUcret * 100);

    // GERÇEK Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'try',
      metadata: {
        rezervasyonId: rezervasyonId.toString(),
        userId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Ödeme kaydı oluştur
    await Odeme.create({
      rezervasyon: rezervasyonId,
      user: req.user._id,
      stripePaymentIntentId: paymentIntent.id,
      amount: amount,
      status: 'pending'
    });

    console.log('✅ Stripe Payment Intent oluşturuldu:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: rezervasyon.toplamUcret,
      motor: rezervasyon.motor.marka + ' ' + rezervasyon.motor.model
    });

  } catch (error) {
    console.error('❌ Stripe ödeme hatası:', error);
    res.status(400).json({ message: 'Ödeme oluşturulamadı: ' + error.message });
  }
});

// Ödeme onaylama
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    const { paymentIntentId, rezervasyonId } = req.body;

    console.log('✅ Ödeme onaylanıyor:', paymentIntentId);

    // Payment Intent'i getir
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Ödeme kaydını güncelle
      await Odeme.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { 
          status: 'succeeded',
          paymentMethod: paymentIntent.payment_method_types[0],
          receiptUrl: paymentIntent.charges.data[0].receipt_url
        }
      );

      // Rezervasyonu otomatik onayla
      const rezervasyon = await Rezervasyon.findById(rezervasyonId)
        .populate('motor')
        .populate('user', 'name email');
      
      if (rezervasyon) {
        rezervasyon.durum = 'onaylandi';
        rezervasyon.odemeDurumu = 'tamamlandi';
        await rezervasyon.save();

        // Motor durumunu güncelle
        await Motor.findByIdAndUpdate(rezervasyon.motor, {
          durum: 'kiralik'
        });

        // Onay email'i gönder
        await sendRezervasyonOnayEmail(rezervasyon);

        console.log('🎉 Ödeme BAŞARILI - Rezervasyon onaylandı:', rezervasyonId);
      }

      res.json({ 
        success: true, 
        message: 'Ödeme başarıyla tamamlandı!',
        receiptUrl: paymentIntent.charges.data[0].receipt_url
      });

    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Ödeme henüz tamamlanmadı' 
      });
    }

  } catch (error) {
    console.error('❌ Ödeme onaylama hatası:', error);
    res.status(400).json({ message: 'Ödeme onaylanamadı: ' + error.message });
  }
});

// Ödeme geçmişi
router.get('/gecmis', protect, async (req, res) => {
  try {
    const odemeler = await Odeme.find({ user: req.user._id })
      .populate({
        path: 'rezervasyon',
        populate: { path: 'motor' }
      })
      .sort({ createdAt: -1 });

    res.json(odemeler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ödeme iptal
router.post('/cancel-payment', protect, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    await stripe.paymentIntents.cancel(paymentIntentId);
    
    await Odeme.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: 'canceled' }
    );

    res.json({ message: 'Ödeme iptal edildi' });

  } catch (error) {
    console.error('Ödeme iptal hatası:', error);
    res.status(400).json({ message: 'Ödeme iptal edilemedi' });
  }
});

export default router;