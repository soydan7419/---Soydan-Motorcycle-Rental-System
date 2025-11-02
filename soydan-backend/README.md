# 🏍️ Soydan Motor Kiralama Sistemi

Modern full-stack motor kiralama uygulaması.

## 🚀 Özellikler
- ✅ Motor ekleme/silme/düzenleme
- ✅ Arama ve filtreleme
- ✅ Responsive tasarım
- ✅ MongoDB veritabanı
- ✅ Docker support
- ✅ Admin authentication

## 🛠️ Teknolojiler
- **Frontend:** React, Vite, CSS-in-JS
- **Backend:** Node.js, Express, MongoDB
- **Deployment:** Docker, Docker Compose

## 📦 Kurulum

### Geliştirme Modu:
```bash
# Backend'i başlat
npm install
npm run dev

# MongoDB'yi başlat (yeni terminal)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Frontend'i başlat
cd soydan-frontend
npm install
npm run dev