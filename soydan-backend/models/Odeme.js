import mongoose from 'mongoose';

const odemeSchema = new mongoose.Schema({
  rezervasyon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rezervasyon',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,  // Kuruş cinsinden (100 = 1 TL)
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  currency: {
    type: String,
    default: 'try'
  },
  paymentMethod: String,
  receiptUrl: String
}, {
  timestamps: true
});

export default mongoose.model('Odeme', odemeSchema);