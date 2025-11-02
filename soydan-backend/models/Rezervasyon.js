import mongoose from 'mongoose';

const rezervasyonSchema = new mongoose.Schema({
  motor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Motor', 
    required: [true, 'Motor seçimi zorunludur'] 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Kullanıcı bilgisi zorunludur'] 
  },
  musteriAd: {
    type: String,
    required: [true, 'Müşteri adı zorunludur']
  },
  musteriEmail: {
    type: String,
    required: [true, 'Müşteri email zorunludur']
  },
  musteriTelefon: {
    type: String,
    required: [true, 'Müşteri telefon zorunludur']
  },
  baslangicTarihi: { 
    type: Date, 
    required: [true, 'Başlangıç tarihi zorunludur'] 
  },
  bitisTarihi: { 
    type: Date, 
    required: [true, 'Bitiş tarihi zorunludur'] 
  },
  toplamGun: {
    type: Number,
    required: true
  },
  toplamUcret: { 
    type: Number, 
    required: [true, 'Toplam ücret zorunludur'] 
  },
  durum: {
    type: String,
    enum: ['beklemede', 'onaylandi', 'reddedildi', 'iptal', 'tamamlandi'],
    default: 'beklemede'
  },
  odemeDurumu: {
    type: String,
    enum: ['bekliyor', 'tamamlandi', 'iptal', 'iade'],
    default: 'bekliyor'
  },
  aciklama: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Tarih çakışması kontrolü için index
rezervasyonSchema.index({ motor: 1, baslangicTarihi: 1, bitisTarihi: 1 });

export default mongoose.model('Rezervasyon', rezervasyonSchema);