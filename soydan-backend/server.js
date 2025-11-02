// server.js - CORS ayarını güncelleyin
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import motorRoutes from './routes/motorlar.js';
import rezervasyonRoutes from './routes/rezervasyonlar.js';
import odemeRoutes from './routes/odemeler.js';
import User from './models/User.js'; // EKLENDİ
import bcrypt from 'bcryptjs'; // EKLENDİ

// Environment variables
dotenv.config();

// JWT_SECRET kontrolü
if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET bulunamadı, geçici bir secret kullanılıyor...');
  process.env.JWT_SECRET = 'gecici_jwt_secret_key_development_mode_12345';
} else {
  console.log('✅ JWT_SECRET ayarlı');
}

const app = express();

// CORS Middleware - GÜNCELLENDİ (Tüm portlara izin ver)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// VEYA daha basit çözüm - tüm origin'lere izin ver (development için)
// app.use(cors());

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('📨 Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB Atlas bağlantısı başarılı!');
    } else {
      console.log('ℹ️  MongoDB URI bulunamadı, bellek modunda çalışılıyor...');
    }
  } catch (error) {
    console.log('❌ MongoDB bağlantı hatası:', error.message);
    console.log('ℹ️  Bellek database ile devam ediliyor...');
  }
};

// server.js - Admin kullanıcısı oluşturma kısmını düzeltin
const createAdminUser = async () => {
  try {
    console.log('🔧 Admin kullanıcısı kontrol ediliyor...');
    const existingAdmin = await User.findOne({ email: 'admin@soydan.com' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const adminUser = await User.create({
        ad: 'Sistem Admini',           // BU SATIR EKLENDİ
        email: 'admin@soydan.com',
        password: hashedPassword,
        telefon: '05551112233',        // BU SATIR EKLENDİ
        role: 'admin'
      });
      console.log('✅ Admin kullanıcısı oluşturuldu:', adminUser.email);
    } else {
      // Mevcut admin'i güncelle - EKSİK ALANLARI EKLE
      if (!existingAdmin.ad) existingAdmin.ad = 'Sistem Admini';
      if (!existingAdmin.telefon) existingAdmin.telefon = '05551112233';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✅ Mevcut kullanıcı admin yapıldı:', existingAdmin.email);
    }
    
    // Ayrıca test kullanıcısı da oluşturalım - EKSİK ALANLARI EKLE
    const existingTestUser = await User.findOne({ email: 'test@soydan.com' });
    if (!existingTestUser) {
      const hashedTestPassword = await bcrypt.hash('test123', 12);
      await User.create({
        ad: 'Test Kullanıcı',          // BU SATIR EKLENDİ
        email: 'test@soydan.com',
        password: hashedTestPassword,
        telefon: '05551112234',        // BU SATIR EKLENDİ
        role: 'user'
      });
      console.log('✅ Test kullanıcısı oluşturuldu: test@soydan.com');
    }
    
  } catch (error) {
    console.error('❌ Admin kullanıcısı oluşturma hatası:', error);
  }
};

// Database bağlantısını ve admin kullanıcısını oluştur
const initializeApp = async () => {
  await connectDB();
  await createAdminUser(); // EKLENDİ
};

initializeApp();

// ROUTES
app.use('/api/motorlar', motorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rezervasyonlar', rezervasyonRoutes);
app.use('/api/odemeler', odemeRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Test route çalışıyor!',
    timestamp: new Date().toISOString(),
    jwtSecret: process.env.JWT_SECRET ? 'Ayarlı' : 'Ayarlı değil',
    cors: 'CORS çalışıyor!'
  });
});

// Protected test route
app.get('/api/test-protected', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Test Protected - Auth Header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token gerekiyor' });
  }
  
  res.json({ 
    message: '✅ Protected test route çalışıyor!',
    timestamp: new Date().toISOString(),
    hasToken: true
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Soydan Motor Kiralama API çalışıyor!',
    database: mongoose.connection.readyState === 1 ? 'MongoDB' : 'Bellek',
    cors: 'CORS aktif - localhost:3000, localhost:5173, localhost:5174',
    adminUser: 'admin@soydan.com / admin123',
    testUser: 'test@soydan.com / test123',
    endpoints: {
      test: 'GET /api/test',
      testProtected: 'GET /api/test-protected',
      motorListesi: 'GET /api/motorlar',
      motorEkle: 'POST /api/motorlar',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      rezervasyonlar: 'GET /api/rezervasyonlar',
      rezervasyonOlustur: 'POST /api/rezervasyonlar',
      benimRezervasyonlarim: 'GET /api/rezervasyonlar/benim-rezervasyonlarim',
      odemeBaslat: 'POST /api/odemeler/create-payment-intent',
      odemeGecmisi: 'GET /api/odemeler/gecmis'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎯 Server http://localhost:${PORT} portunda çalışıyor...`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'MongoDB' : 'Bellek'}`);
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? 'Ayarlı (' + process.env.JWT_SECRET.substring(0, 10) + '...)' : 'AYARLI DEĞİL!'}`);
  console.log(`🌐 CORS: localhost:3000, localhost:5173, localhost:5174 için aktif`);
  console.log(`🔐 Authentication: /api/auth/register & /api/auth/login`);
  console.log(`📅 Rezervasyon: /api/rezervasyonlar`);
  console.log(`💳 Ödeme: /api/odemeler`);
  console.log(`🧪 Test: /api/test & /api/test-protected`);
  console.log(`👤 Admin Kullanıcı: admin@soydan.com / admin123`);
  console.log(`👤 Test Kullanıcı: test@soydan.com / test123`);
});