// middleware/auth.js - JWT_SECRET kontrolü ekleyin
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT_SECRET kontrolü - BU SATIRI EKLEYİN
const JWT_SECRET = process.env.JWT_SECRET || 'gecici_jwt_secret_key_development';

export const protect = async (req, res, next) => {
  try {
    let token;

    console.log('🔐 Protect Middleware - Headers:', req.headers);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'YOK');

    if (!token) {
      return res.status(401).json({
        message: 'Token bulunamadı, lütfen giriş yapın'
      });
    }

    try {
      // Token'ı doğrula - JWT_SECRET değişkenini kullan
      const decoded = jwt.verify(token, JWT_SECRET); // BU SATIRI DÜZELTTİK
      console.log('✅ Token decoded:', decoded);

      // Kullanıcıyı bul
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.log('❌ Kullanıcı bulunamadı, decoded:', decoded);
        return res.status(401).json({
          message: 'Token geçerli değil, kullanıcı bulunamadı'
        });
      }

      req.user = user;
      console.log('👤 User found:', { 
        id: user._id, 
        name: user.ad, 
        email: user.email, 
        role: user.role 
      });
      next();
    } catch (jwtError) {
      console.log('❌ JWT Error:', jwtError.message);
      return res.status(401).json({
        message: 'Token geçersiz'
      });
    }

  } catch (error) {
    console.log('❌ Protect middleware error:', error);
    res.status(401).json({
      message: 'Yetkilendirme hatası'
    });
  }
};

// ... diğer middleware fonksiyonları aynı kalacak

// Authorize middleware (roles)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Bu işlem için giriş yapmanız gerekiyor'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bu işlem için ${req.user.role} rolü yetkili değil. Gerekli roller: ${roles.join(', ')}`
      });
    }
    
    console.log(`✅ Authorization successful for role: ${req.user.role}`);
    next();
  };
};

// Admin middleware - DÜZELTİLDİ
export const admin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Önce giriş yapmalısınız' });
    }

    if (req.user.role !== 'admin') {
      console.log('❌ Admin erişim reddedildi:', {
        user: req.user.email,
        role: req.user.role
      });
      return res.status(403).json({ 
        message: 'Bu işlem için admin yetkisi gerekiyor' 
      });
    }

    console.log('✅ Admin erişim onaylandı:', req.user.email);
    next();
  } catch (error) {
    console.error('Admin middleware hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// DEFAULT EXPORT'U SİLİN - SADECE NAMED EXPORT KULLANIN
// export default { protect, authorize, admin }; // BU SATIRI SİLİN VEYE YORUM YAPIN