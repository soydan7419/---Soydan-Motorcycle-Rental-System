// routes/auth.js - TAM DOSYA (GÜVENLİ VERSİYON)
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// JWT_SECRET kontrolü - KESİN ÇÖZÜM
const JWT_SECRET = process.env.JWT_SECRET || 'gecici_jwt_secret_key_development';
console.log('🔐 JWT_SECRET loaded:', JWT_SECRET ? 'Mevcut' : 'Eksik');

// KAYIT (REGISTER)
router.post('/register', async (req, res) => {
  try {
    const { ad, email, password, telefon } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email zaten kullanılıyor' });
    }

    const user = await User.create({ ad, email, password, telefon });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role }, 
      JWT_SECRET
    );

    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        ad: user.ad,
        email: user.email,
        telefon: user.telefon,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// GİRİŞ (LOGIN) - TYPO DÜZELTİLMİŞ
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email veya şifre hatalı' 
      });
    }

    const isPasswordCorrect = await user.correctPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: 'Email veya şifre hatalı' 
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role }, 
      JWT_SECRET
    );

    console.log('✅ Login successful:', user.email);

    user.password = undefined;

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        ad: user.ad,
        email: user.email,
        telefon: user.telefon,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası: ' + error.message 
    });
  }
});

export default router;