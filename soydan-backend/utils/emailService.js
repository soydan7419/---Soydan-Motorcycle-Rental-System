console.log('🔧 EmailService.js YÜKLENDİ - Servis hazır!');
import nodemailer from 'nodemailer';

// Email transporter oluştur - FONKSİYON İSMİNİ DÜZELT
const createTransporter = () => {
  return nodemailer.createTransport({  // "createTransport" OLACAK
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Rezervasyon onay email'i
export const sendRezervasyonOnayEmail = async (rezervasyon) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: rezervasyon.musteriEmail,
      subject: '🏍️ Soydan Motor - Rezervasyon Onayı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Soydan Motor Kiralama</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px;">
            <h3 style="color: #059669;">Rezervasyonunuz Onaylandı! 🎉</h3>
            <p>Sayın <strong>${rezervasyon.musteriAd}</strong>,</p>
            <p>Rezervasyonunuz başarıyla onaylanmıştır.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>📋 Rezervasyon Detayları:</h4>
              <p><strong>Motor:</strong> ${rezervasyon.motor.marka} ${rezervasyon.motor.model}</p>
              <p><strong>Plaka:</strong> ${rezervasyon.motor.plaka}</p>
              <p><strong>Tarih:</strong> ${new Date(rezervasyon.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(rezervasyon.bitisTarihi).toLocaleDateString('tr-TR')}</p>
              <p><strong>Süre:</strong> ${rezervasyon.toplamGun} gün</p>
              <p><strong>Toplam Ücret:</strong> ${rezervasyon.toplamUcret} TL</p>
            </div>
            
            <p><strong>📍 Adres:</strong> Soydan Motor Kiralama</p>
            <p><strong>📞 Telefon:</strong> 0555 123 4567</p>
            
            <p>Rezervasyonunuzla ilgili herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p>
            <p>Teşekkür ederiz! 🏍️</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Rezervasyon onay email'i gönderildi: ${rezervasyon.musteriEmail}`);
    
  } catch (error) {
    console.error('❌ Email gönderim hatası:', error);
  }
};

// Yeni rezervasyon bildirimi (admin'e)
export const sendYeniRezervasyonBildirimi = async (rezervasyon) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@soydan.com',
      subject: '🆕 Yeni Rezervasyon Bildirimi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Yeni Rezervasyon Bildirimi</h2>
          <div style="background: #fef3c7; padding: 20px; border-radius: 10px;">
            <h3 style="color: #d97706;">Onay Bekleyen Rezervasyon</h3>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>Müşteri Bilgileri:</h4>
              <p><strong>Ad:</strong> ${rezervasyon.musteriAd}</p>
              <p><strong>Email:</strong> ${rezervasyon.musteriEmail}</p>
              <p><strong>Telefon:</strong> ${rezervasyon.musteriTelefon}</p>
              
              <h4>Rezervasyon Detayları:</h4>
              <p><strong>Motor:</strong> ${rezervasyon.motor.marka} ${rezervasyon.motor.model}</p>
              <p><strong>Plaka:</strong> ${rezervasyon.motor.plaka}</p>
              <p><strong>Tarih:</strong> ${new Date(rezervasyon.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(rezervasyon.bitisTarihi).toLocaleDateString('tr-TR')}</p>
              <p><strong>Toplam Ücret:</strong> ${rezervasyon.toplamUcret} TL</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Yeni rezervasyon bildirimi admin\'e gönderildi');
    
  } catch (error) {
    console.error('❌ Admin bildirim hatası:', error);
  }
};

// Rezervasyon oluşturuldu email'i
export const sendRezervasyonOlusturulduEmail = async (rezervasyon) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: rezervasyon.musteriEmail,
      subject: '🏍️ Soydan Motor - Rezervasyonunuz Alındı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Soydan Motor Kiralama</h2>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 10px;">
            <h3 style="color: #0369a1;">Rezervasyonunuz Alındı! ⏳</h3>
            <p>Sayın <strong>${rezervasyon.musteriAd}</strong>,</p>
            <p>Rezervasyonunuz başarıyla alınmıştır. Onaylandıktan sonra size bilgi vereceğiz.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4>📋 Rezervasyon Detayları:</h4>
              <p><strong>Motor:</strong> ${rezervasyon.motor.marka} ${rezervasyon.motor.model}</p>
              <p><strong>Plaka:</strong> ${rezervasyon.motor.plaka}</p>
              <p><strong>Tarih:</strong> ${new Date(rezervasyon.baslangicTarihi).toLocaleDateString('tr-TR')} - ${new Date(rezervasyon.bitisTarihi).toLocaleDateString('tr-TR')}</p>
              <p><strong>Toplam Ücret:</strong> ${rezervasyon.toplamUcret} TL</p>
              <p><strong>Durum:</strong> Onay Bekliyor</p>
            </div>
            
            <p>Rezervasyonunuz en kısa sürede değerlendirilecektir.</p>
            <p>Teşekkür ederiz! 🏍️</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Rezervasyon oluşturuldu email'i gönderildi: ${rezervasyon.musteriEmail}`);
    
  } catch (error) {
    console.error('❌ Rezervasyon email hatası:', error);
  }
};