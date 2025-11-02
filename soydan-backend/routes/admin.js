import express from 'express';
import Motor from '../models/Motor.js';

const router = express.Router();

// Tüm motorları getir (admin için)
router.get('/motorlar', async (req, res) => {
  try {
    const motorlar = await Motor.find();
    res.json(motorlar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Motor sil
router.delete('/motorlar/:id', async (req, res) => {
  try {
    await Motor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Motor başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Motor durumu güncelle
router.put('/motorlar/:id', async (req, res) => {
  try {
    const motor = await Motor.findByIdAndUpdate(
      req.params.id,
      { durum: req.body.durum },
      { new: true }
    );
    res.json(motor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;