// routes/motorlar.js
import express from 'express';
import Motor from '../models/Motor.js';
import { protect, admin } from '../middleware/auth.js'; // Bu doğru

const router = express.Router();

// Tüm motorları getir (herkese açık)
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /api/motorlar isteği alındı');
    const motorlar = await Motor.find();
    console.log(`✅ ${motorlar.length} motor bulundu`);
    res.json(motorlar);
  } catch (error) {
    console.log('❌ Motorlar getirme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Yeni motor ekle (SADECE ADMIN)
router.post('/', protect, admin, async (req, res) => {
  try {
    console.log('📦 POST /api/motorlar isteği:', req.body);
    console.log('👤 İstek yapan:', req.user.email, `(${req.user.role})`);
    
    const motor = new Motor(req.body);
    const savedMotor = await motor.save();
    
    console.log('✅ Motor eklendi:', savedMotor);
    res.status(201).json(savedMotor);
  } catch (error) {
    console.log('❌ Motor ekleme hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

// Motor sil (SADECE ADMIN)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/motorlar isteği:', req.params.id);
    console.log('👤 İstek yapan:', req.user.email, `(${req.user.role})`);
    
    await Motor.findByIdAndDelete(req.params.id);
    console.log('✅ Motor silindi');
    res.json({ message: 'Motor silindi' });
  } catch (error) {
    console.log('❌ Motor silme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Motor güncelle (SADECE ADMIN)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    console.log('✏️ PUT /api/motorlar isteği:', req.params.id, req.body);
    console.log('👤 İstek yapan:', req.user.email, `(${req.user.role})`);
    
    const motor = await Motor.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    console.log('✅ Motor güncellendi:', motor);
    res.json(motor);
  } catch (error) {
    console.log('❌ Motor güncelleme hatası:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;