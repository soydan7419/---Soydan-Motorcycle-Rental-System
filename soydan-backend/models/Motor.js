import mongoose from 'mongoose';

const motorSchema = new mongoose.Schema({
  marka: { type: String, required: true },
  model: { type: String, required: true },
  yil: { type: Number, required: true },
  plaka: { type: String, required: true, unique: true },
  gunlukFiyat: { type: Number, required: true },
  resim: { type: String, default: '' },
  durum: { 
    type: String, 
    enum: ['musait', 'kiralandi', 'bakimda'], // Türkçe karakterleri kaldırdık
    default: 'musait'
  },
  aciklama: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Motor', motorSchema);