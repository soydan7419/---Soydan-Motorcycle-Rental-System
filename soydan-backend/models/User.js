// models/User.js - DÜZELTİLMİŞ
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  ad: { 
    type: String, 
    required: [true, 'İsim zorunludur'] 
  },
  email: { 
    type: String, 
    required: [true, 'Email zorunludur'],
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: [true, 'Şifre zorunludur'],
    minlength: 6
  },
  telefon: {
    type: String,
    required: [true, 'Telefon zorunludur']
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'],
    default: 'user'
  }
}, { 
  timestamps: true 
});

// Şifreyi hashleme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Şifre kontrol metodu
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// DÜZELTME: 'User' yerine 'userSchema' kullan
export default mongoose.model('User', userSchema);