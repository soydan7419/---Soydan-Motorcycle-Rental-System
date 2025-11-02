import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [aramaKelimesi, setAramaKelimesi] = useState('');
  const [minFiyat, setMinFiyat] = useState('');
  const [maxFiyat, setMaxFiyat] = useState('');
  const [siralama, setSiralama] = useState('fiyat-asc');
  const [aktifSayfa, setAktifSayfa] = useState('anasayfa');
  const [motorlar, setMotorlar] = useState([]);
  const [yeniMotor, setYeniMotor] = useState({
    marka: '', model: '', yil: '', plaka: '', gunlukFiyat: '', aciklama: ''
  });

  // Kullanıcı authentication state'leri
  const [kullanici, setKullanici] = useState(null);
  const [token, setToken] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Login/Register form state'leri
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    ad: '', email: '', password: '', telefon: '' 
  });

  // Rezervasyon state'leri
  const [seciliMotor, setSeciliMotor] = useState(null);
  const [rezervasyonFormu, setRezervasyonFormu] = useState({
    musteriAd: '', musteriEmail: '', musteriTelefon: '', baslangicTarihi: '', bitisTarihi: ''
  });
  const [rezervasyonYukleniyor, setRezervasyonYukleniyor] = useState(false);

  // Ödeme state'leri
  const [odemeModal, setOdemeModal] = useState(false);
  const [odemeData, setOdemeData] = useState(null);
  const [odemeYukleniyor, setOdemeYukleniyor] = useState(false);

  // Yeni admin state'leri
  const [rezervasyonlar, setRezervasyonlar] = useState([]);
  const [showRezervasyonModal, setShowRezervasyonModal] = useState(false);
  const [seciliRezervasyon, setSeciliRezervasyon] = useState(null);
  const [duzenlenenMotor, setDuzenlenenMotor] = useState(null);
  const [showMotorDuzenleModal, setShowMotorDuzenleModal] = useState(false);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Token geçerlilik kontrolü
  const getValidToken = () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      console.log('🔐 Token bulunamadı');
      return null;
    }

    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp < now) {
        console.log('❌ Token süresi dolmuş');
        localStorage.removeItem('token');
        localStorage.removeItem('kullanici');
        return null;
      }
      
      console.log('✅ Token geçerli, kalan süre:', (payload.exp - now).toFixed(0), 'saniye');
      return savedToken;
    } catch (error) {
      console.error('❌ Token decode hatası:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('kullanici');
      return null;
    }
  };

  // API çağrısı için yardımcı fonksiyon
  const apiCall = async (endpoint, options = {}) => {
    const currentToken = getValidToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const requiresAuth = !endpoint.includes('/auth/') && endpoint !== '/motorlar';
    
    if (requiresAuth && currentToken) {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
      console.log(`🔐 Auth Header eklendi: Bearer ${currentToken.substring(0, 20)}...`);
    }

    console.log(`🌐 API Call: ${endpoint}`, { 
      requiresAuth,
      hasToken: !!currentToken,
      method: config.method || 'GET'
    });

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      console.log(`📡 Response: ${response.status} ${response.statusText} - ${endpoint}`);

      const responseText = await response.text();
      console.log('📨 Response Body:', responseText);

      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token geçersiz');
        localStorage.removeItem('token');
        localStorage.removeItem('kullanici');
        setToken(null);
        setKullanici(null);
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = responseText ? JSON.parse(responseText) : {};
      console.log('✅ API Success:', data);
      return data;

    } catch (error) {
      console.error('💥 API çağrısı hatası:', error);
      throw error;
    }
  };

  // Test fonksiyonları
  const testBackendConnection = async () => {
    try {
      console.log('🧪 Backend bağlantı testi başlatılıyor...');
      
      const testResult = await fetch('http://localhost:5000/api/test');
      const testData = await testResult.json();
      console.log('✅ Normal test:', testData);
      
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const protectedResult = await fetch('http://localhost:5000/api/test-protected', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (protectedResult.ok) {
            const protectedData = await protectedResult.json();
            console.log('✅ Protected test:', protectedData);
          } else {
            console.log('❌ Protected test failed:', protectedResult.status);
          }
        } catch (error) {
          console.log('❌ Protected test error:', error);
        }
      } else {
        console.log('🔐 Token yok, protected test atlandı');
      }
    } catch (error) {
      console.log('❌ Backend test hatası:', error);
    }
  };

  // Motor testi
  const testMotorListesi = async () => {
    try {
      console.log('🏍️ Motor listesi testi...');
      const motorlar = await apiCall('/motorlar');
      console.log(`✅ ${motorlar.length} motor bulundu`);
      return motorlar;
    } catch (error) {
      console.log('❌ Motor listesi testi hatası:', error);
    }
  };

  // Kullanıcı Kayıt Fonksiyonu
  const kayitOl = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    
    const kayitData = {
      ad: registerForm.ad,
      email: registerForm.email,
      password: registerForm.password,
      telefon: registerForm.telefon
    };
    
    console.log('📝 Kayıt verisi:', kayitData);
    
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(kayitData)
      });

      console.log('✅ Kayıt başarılı:', data);
      setKullanici(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('kullanici', JSON.stringify(data.user));
      setShowRegisterModal(false);
      setRegisterForm({ ad: '', email: '', password: '', telefon: '' });
      alert('✅ Kayıt başarılı! Hoş geldiniz!');
    } catch (error) {
      console.log('❌ Kayıt hatası:', error);
      alert('❌ Kayıt hatası: ' + error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Kullanıcı Giriş Fonksiyonu
  const girisYap = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      
      setKullanici(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('kullanici', JSON.stringify(data.user));
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
      alert('✅ Giriş başarılı!');
    } catch (error) {
      console.error('Giriş hatası:', error);
      alert('❌ Giriş hatası: ' + error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin login fonksiyonu
  const adminLoginYap = async () => {
    setLoginLoading(true);
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@soydan.com', password: 'admin123' })
      });
      
      setToken(data.token);
      localStorage.setItem('token', data.token);
      console.log('✅ Admin girişi başarılı!');
    } catch (error) {
      console.error('Admin login hatası:', error);
      alert('❌ Admin girişi başarısız: ' + error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Çıkış Yap
  const cikisYap = () => {
    setKullanici(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('kullanici');
    console.log('🚪 Çıkış yapıldı, token temizlendi');
    alert('Çıkış yapıldı!');
  };

  // Ödeme modal'ını açma fonksiyonu
  const odemeModalAc = (paymentData) => {
    console.log('💳 Ödeme modalı açılıyor:', paymentData);
    setOdemeData(paymentData);
    setOdemeModal(true);
  };

  // Ödeme modal'ını kapatma
  const odemeModalKapat = () => {
    setOdemeModal(false);
    setOdemeData(null);
    setOdemeYukleniyor(false);
  };

  // Test ödeme fonksiyonu
  const testOdemeYap = async (e) => {
    e.preventDefault();
    setOdemeYukleniyor(true);
    
    try {
      console.log('🧪 TEST ÖDEME - Başlatılıyor...', odemeData);
      
      const currentToken = getValidToken();
      if (!currentToken) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      }

      const formData = new FormData(e.target);
      const kartBilgileri = {
        kartNo: formData.get('kartNo')?.replace(/\s/g, ''),
        sonKullanma: formData.get('sonKullanma'),
        cvc: formData.get('cvc'),
        zip: formData.get('zip')
      };

      console.log('💳 Kart bilgileri alındı:', {
        ...kartBilgileri,
        kartNo: '***' + kartBilgileri.kartNo.slice(-4)
      });

      const response = await fetch('http://localhost:5000/api/odemeler/test-odeme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          rezervasyonId: odemeData.rezervasyonId,
          kartBilgileri: kartBilgileri
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ TEST ÖDEME BAŞARILI:', result);
        alert(result.message);
        odemeModalKapat();
        motorlariGetir();
        
        setTimeout(() => {
          alert('🎉 Rezervasyonunuz ve ödemeniz başarıyla tamamlandı! Motor artık kiralık olarak işaretlendi.');
        }, 500);
        
      } else {
        throw new Error(result.message || 'Test ödemesi başarısız');
      }
      
    } catch (error) {
      console.error('💥 Test ödeme hatası:', error);
      alert('❌ Ödeme işlemi başarısız: ' + error.message);
    } finally {
      setOdemeYukleniyor(false);
    }
  };

  // Motorları backend'den çek
  const motorlariGetir = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/motorlar');
      setMotorlar(data);
    } catch (error) {
      console.error('Motorlar yüklenirken hata:', error);
      alert('Motorlar yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Rezervasyon oluştur
  const rezervasyonYap = async (e) => {
    e.preventDefault();
    
    const currentToken = getValidToken();
    if (!currentToken || !kullanici) {
      alert('❌ Rezervasyon yapmak için giriş yapmalısınız!');
      setShowLoginModal(true);
      return;
    }
    
    setRezervasyonYukleniyor(true);
    
    try {
      console.log('🔐 Rezervasyon için token kontrolü:', {
        hasToken: !!currentToken,
        tokenLength: currentToken.length,
        user: kullanici.ad
      });
      
      const rezervasyonData = {
        motorId: seciliMotor._id,
        musteriAd: rezervasyonFormu.musteriAd || kullanici.ad,
        musteriEmail: rezervasyonFormu.musteriEmail || kullanici.email,
        musteriTelefon: rezervasyonFormu.musteriTelefon || kullanici.telefon,
        baslangicTarihi: rezervasyonFormu.baslangicTarihi,
        bitisTarihi: rezervasyonFormu.bitisTarihi
      };

      console.log('📦 Rezervasyon verisi:', rezervasyonData);

      const rezervasyon = await apiCall('/rezervasyonlar', {
        method: 'POST',
        body: JSON.stringify(rezervasyonData)
      });

      console.log('✅ Rezervasyon başarılı:', rezervasyon);
      
      const gunFarki = Math.ceil(
        (new Date(rezervasyonFormu.bitisTarihi) - new Date(rezervasyonFormu.baslangicTarihi)) / 
        (1000 * 60 * 60 * 24)
      );

      const odemeIstegi = {
        rezervasyonId: rezervasyon._id,
        amount: gunFarki * seciliMotor.gunlukFiyat,
        motor: `${seciliMotor.marka} ${seciliMotor.model}`,
        clientSecret: null
      };

      console.log('💰 Ödeme intent oluşturuluyor...', odemeIstegi);

      try {
        const paymentResponse = await fetch('http://localhost:5000/api/odemeler/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            rezervasyonId: rezervasyon._id,
            amount: gunFarki * seciliMotor.gunlukFiyat,
            currency: 'try'
          })
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('✅ Ödeme intent alındı:', paymentData);
          
          odemeModalAc({
            ...odemeIstegi,
            clientSecret: paymentData.clientSecret
          });
          
          setRezervasyonFormu({
            musteriAd: '', musteriEmail: '', musteriTelefon: '', baslangicTarihi: '', bitisTarihi: ''
          });
          setSeciliMotor(null);
          
        } else {
          throw new Error('Ödeme sistemi hazırlanamadı');
        }
      } catch (error) {
        console.error('❌ Ödeme intent hatası:', error);
        alert('✅ Rezervasyon oluşturuldu! Ödeme sistemi geçici olarak kullanılamıyor.');
        
        setRezervasyonFormu({
          musteriAd: '', musteriEmail: '', musteriTelefon: '', baslangicTarihi: '', bitisTarihi: ''
        });
        setSeciliMotor(null);
        motorlariGetir();
      }
      
    } catch (error) {
      console.error('💥 Rezervasyon hatası:', error);
      alert('❌ Rezervasyon hatası: ' + error.message);
      
      if (error.message.includes('Oturum') || error.message.includes('Token')) {
        setShowLoginModal(true);
      }
    } finally {
      setRezervasyonYukleniyor(false);
    }
  };

  // Rezervasyon modal'ını kapat
  const rezervasyonModalKapat = () => {
    setSeciliMotor(null);
    setRezervasyonFormu({
      musteriAd: '', musteriEmail: '', musteriTelefon: '', baslangicTarihi: '', bitisTarihi: ''
    });
  };

  // Filtrelenmiş ve sıralanmış motorlar
  const filtrelenmisMotorlar = motorlar
    .filter(motor => {
      const aramaUygun = motor.marka.toLowerCase().includes(aramaKelimesi.toLowerCase()) ||
                        motor.model.toLowerCase().includes(aramaKelimesi.toLowerCase()) ||
                        motor.plaka.toLowerCase().includes(aramaKelimesi.toLowerCase());
      
      const fiyatUygun = (!minFiyat || motor.gunlukFiyat >= parseInt(minFiyat)) &&
                        (!maxFiyat || motor.gunlukFiyat <= parseInt(maxFiyat));
      
      return aramaUygun && fiyatUygun;
    })
    .sort((a, b) => {
      switch(siralama) {
        case 'fiyat-asc': return a.gunlukFiyat - b.gunlukFiyat;
        case 'fiyat-desc': return b.gunlukFiyat - a.gunlukFiyat;
        case 'yil-desc': return b.yil - a.yil;
        case 'yil-asc': return a.yil - b.yil;
        default: return 0;
      }
    });

// Motor ekleme fonksiyonu - YENİ HALİ (DÜZELTİLMİŞ)
const motorEkle = async (e) => {
  e.preventDefault();
  
  const currentToken = getValidToken();
  if (!currentToken) {
    alert('❌ Motor eklemek için admin girişi yapmalısınız!');
    await adminLoginYap();
    return;
  }
  
  const motorData = {
    marka: yeniMotor.marka,
    model: yeniMotor.model, 
    yil: parseInt(yeniMotor.yil),
    plaka: yeniMotor.plaka,
    gunlukFiyat: parseInt(yeniMotor.gunlukFiyat),
    aciklama: yeniMotor.aciklama || "",
    durum: "musait"
  };

  console.log('🎯 Gönderilen veri:', motorData);

  try {
    // ✅ DOĞRUDAN fetch KULLAN - apiCall YERİNE
    const response = await fetch('http://localhost:5000/api/motorlar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`  // ✅ BU SATIRI EKLEYİN
      },
      body: JSON.stringify(motorData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Motor eklenemedi');
    }

    console.log('✅ BAŞARILI! Motor eklendi:', result);
    
    setYeniMotor({
      marka: '', model: '', yil: '', plaka: '', gunlukFiyat: '', aciklama: ''
    });
    
    alert('Motor başarıyla eklendi! (Müsait olarak)');
    motorlariGetir();
  } catch (error) {
    console.error('💥 Motor ekleme hatası:', error);
    alert('Motor ekleme hatası: ' + error.message);
  }
};
  // Motor sil
  const motorSil = async (motorId) => {
    if (window.confirm('Bu motoru silmek istediğinizden emin misiniz?')) {
      try {
        await apiCall(`/motorlar/${motorId}`, {
          method: 'DELETE'
        });

        motorlariGetir();
        alert('Motor başarıyla silindi!');
      } catch (error) {
        console.error('Motor silinirken hata:', error);
        alert('Motor silme hatası: ' + error.message);
      }
    }
  };

  // Motor düzenleme fonksiyonu
  const motorDuzenle = async (e) => {
    e.preventDefault();
    
    const currentToken = getValidToken();
    if (!currentToken) {
      alert('❌ Motor düzenlemek için admin girişi yapmalısınız!');
      return;
    }
    
    const motorData = {
      marka: duzenlenenMotor.marka,
      model: duzenlenenMotor.model, 
      yil: parseInt(duzenlenenMotor.yil),
      plaka: duzenlenenMotor.plaka,
      gunlukFiyat: parseInt(duzenlenenMotor.gunlukFiyat),
      aciklama: duzenlenenMotor.aciklama || "",
      durum: duzenlenenMotor.durum
    };

    try {
      const result = await apiCall(`/motorlar/${duzenlenenMotor._id}`, {
        method: 'PUT',
        body: JSON.stringify(motorData)
      });

      console.log('✅ Motor güncellendi:', result);
      setShowMotorDuzenleModal(false);
      setDuzenlenenMotor(null);
      alert('Motor başarıyla güncellendi!');
      motorlariGetir();
    } catch (error) {
      console.error('💥 Motor güncelleme hatası:', error);
      alert('Motor güncelleme hatası: ' + error.message);
    }
  };

  // Rezervasyonları getir
  const rezervasyonlariGetir = async () => {
    const currentToken = getValidToken();
    if (!currentToken) return;

    try {
      const data = await apiCall('/rezervasyonlar');
      setRezervasyonlar(data);
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error);
    }
  };

  // Rezervasyon durumu güncelle
  const rezervasyonDurumuGuncelle = async (rezervasyonId, yeniDurum) => {
    const currentToken = getValidToken();
    if (!currentToken) return;

    try {
      const result = await apiCall(`/rezervasyonlar/${rezervasyonId}/durum`, {
        method: 'PUT',
        body: JSON.stringify({ durum: yeniDurum })
      });

      console.log('✅ Rezervasyon güncellendi:', result);
      alert(`Rezervasyon ${yeniDurum} olarak güncellendi!`);
      rezervasyonlariGetir();
      motorlariGetir(); // Motor durumlarını da güncelle
      
      // E-posta gönderimi burada tetiklenebilir
      if (yeniDurum === 'onaylandi') {
        await rezervasyonOnayEmailGonder(rezervasyonId);
      }
      
    } catch (error) {
      console.error('💥 Rezervasyon güncelleme hatası:', error);
      alert('Rezervasyon güncelleme hatası: ' + error.message);
    }
  };

  // E-posta gönderme fonksiyonu (Backend'de hazır)
  const rezervasyonOnayEmailGonder = async (rezervasyonId) => {
    try {
      // Backend'deki email servisini tetikle
      const response = await fetch(`${API_BASE_URL}/rezervasyonlar/${rezervasyonId}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getValidToken()}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Onay e-postası gönderildi');
      }
    } catch (error) {
      console.log('⚠️ E-posta gönderilemedi:', error);
    }
  };

  // Motor düzenleme modal'ını aç
  const motorDuzenleModalAc = (motor) => {
    setDuzenlenenMotor({...motor});
    setShowMotorDuzenleModal(true);
  };

  // Rezervasyon detay modal'ını aç
  const rezervasyonDetayAc = (rezervasyon) => {
    setSeciliRezervasyon(rezervasyon);
    setShowRezervasyonModal(true);
  };

  // Sayfa yüklendiğinde kullanıcı bilgisini kontrol et
  useEffect(() => {
    const validToken = getValidToken();
    const savedKullanici = localStorage.getItem('kullanici');
    
    if (validToken && savedKullanici) {
      setToken(validToken);
      setKullanici(JSON.parse(savedKullanici));
      console.log('🔑 Oturum yenilendi:', JSON.parse(savedKullanici).ad);
      
      // Admin ise rezervasyonları da getir
      if (JSON.parse(savedKullanici).role === 'admin') {
        rezervasyonlariGetir();
      }
    } else {
      console.log('🔐 Oturum bulunamadı veya süresi dolmuş');
    }
    
    testBackendConnection();
    motorlariGetir();
  }, []);

  return (
    <div className="modern-container">
      {/* LOADING SPINNER */}
      {loading && (
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--dark)' }}>
              Motorlar yükleniyor...
            </span>
          </div>
        </div>
      )}
      
      {/* MODERN HEADER */}
      <div className="glass-header fade-in">
        <div className="glass-logo">
          🏍️ SOYDAN MOTOR
        </div>
        
        <div className="auth-buttons">
          {kullanici ? (
            <div className="user-info">
              <span style={{ 
                color: '#1e40af', 
                fontSize: '0.9rem',
                fontWeight: '600',
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '20px'
              }}>
                👤 {kullanici.ad}
                {kullanici.role === 'admin' && <span style={{marginLeft: '0.5rem'}}>👑</span>}
              </span>
              <button 
                onClick={cikisYap}
                className="modern-btn btn-outline"
              >
                🚪 Çıkış
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="modern-btn btn-outline"
              >
                🔐 Giriş
              </button>
              <button 
                onClick={() => setShowRegisterModal(true)}
                className="modern-btn btn-primary"
              >
                📝 Kayıt
              </button>
            </div>
          )}
          
          <div className="nav-buttons">
            <button 
              onClick={() => setAktifSayfa('anasayfa')}
              className="modern-btn"
              style={{ 
                backgroundColor: aktifSayfa === 'anasayfa' ? 'var(--primary)' : 'var(--secondary)',
                color: 'white'
              }}
            >
              🏠 Ana Sayfa
            </button>
            
            {/* ADMIN BUTONU - SADECE ADMIN GİRİŞ YAPINCA GÖSTER */}
            {kullanici && kullanici.role === 'admin' && (
              <button 
                onClick={() => setAktifSayfa('admin')}
                className="modern-btn"
                style={{ 
                  backgroundColor: aktifSayfa === 'admin' ? 'var(--warning)' : 'var(--secondary)',
                  color: 'white'
                }}
              >
                ⚙️ Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* İÇERİK ALANI */}
      <div>
        
        {/* ANA SAYFA */}
        {aktifSayfa === 'anasayfa' && (
          <div className="fade-in">
            <h2 style={{ 
              color: 'white', 
              marginBottom: '1.5rem', 
              fontSize: '2rem',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              🏍️ Kiralık Motorlar
            </h2>
            
            {/* ARAMA ve FİLTRELEME - MODERN */}
            <div className="search-section fade-in">
              <div className="filter-grid">
                {/* Arama */}
                <div>
                  <label className="filter-label">🔍 Marka, Model veya Plaka Ara</label>
                  <input
                    type="text"
                    placeholder="Örn: Honda, 34ABC..."
                    value={aramaKelimesi}
                    onChange={(e) => setAramaKelimesi(e.target.value)}
                    className="filter-input"
                  />
                </div>
                
                {/* Min Fiyat */}
                <div>
                  <label className="filter-label">💰 Min Fiyat</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minFiyat}
                    onChange={(e) => setMinFiyat(e.target.value)}
                    className="filter-input"
                  />
                </div>
                
                {/* Max Fiyat */}
                <div>
                  <label className="filter-label">💰 Max Fiyat</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={maxFiyat}
                    onChange={(e) => setMaxFiyat(e.target.value)}
                    className="filter-input"
                  />
                </div>
                
                {/* Sıralama */}
                <div>
                  <label className="filter-label">📊 Sırala</label>
                  <select
                    value={siralama}
                    onChange={(e) => setSiralama(e.target.value)}
                    className="filter-input"
                  >
                    <option value="fiyat-asc">Fiyat (Artan)</option>
                    <option value="fiyat-desc">Fiyat (Azalan)</option>
                    <option value="yil-desc">Yıl (Yeniden Eskiye)</option>
                    <option value="yil-asc">Yıl (Eskiden Yeniye)</option>
                  </select>
                </div>
              </div>
              
              {/* Sonuç sayısı */}
              <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                {filtrelenmisMotorlar.length} motor bulundu
                {(aramaKelimesi || minFiyat || maxFiyat) && (
                  <button
                    onClick={() => { 
                      setAramaKelimesi(''); 
                      setMinFiyat(''); 
                      setMaxFiyat(''); 
                      setSiralama('fiyat-asc'); 
                    }}
                    className="modern-btn"
                    style={{ 
                      marginLeft: '1rem', 
                      backgroundColor: 'transparent', 
                      color: 'var(--primary)', 
                      border: 'none', 
                      fontSize: '0.9rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            </div>
            
            {/* MOTOR LİSTESİ - MODERN */}
            <div className="motor-grid">
              {filtrelenmisMotorlar.map((motor) => (
                <div key={motor._id} className="modern-card fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="motor-image-container">
                      🏍️
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--dark)', fontSize: '1.3rem' }}>
                        {motor.marka} {motor.model}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                        📅 {motor.yil} • 🏷️ {motor.plaka}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div className="price-display">
                      <span className="daily-label">Günlük</span>
                      <span className="price-amount">{motor.gunlukFiyat} TL</span>
                    </div>
                    
                    {motor.aciklama && (
                      <p style={{ 
                        margin: '0.75rem 0 0 0', 
                        color: '#4b5563', 
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px'
                      }}>
                        📝 {motor.aciklama}
                      </p>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <span className={`status-badge ${
                      motor.durum === 'musait' ? 'status-available' : 'status-rented'
                    }`}>
                      {motor.durum === 'musait' ? '✅ Müsait' : '❌ Kiralık'}
                    </span>
                    
                    <button 
                      className={`modern-btn ${
                        motor.durum === 'musait' ? 'btn-success' : 'btn-secondary'
                      }`}
                      onClick={() => motor.durum === 'musait' && setSeciliMotor(motor)}
                      disabled={motor.durum !== 'musait'}
                      style={{ 
                        cursor: motor.durum === 'musait' ? 'pointer' : 'not-allowed',
                        opacity: motor.durum === 'musait' ? 1 : 0.6
                      }}
                    >
                      {motor.durum === 'musait' ? '🚀 Kirala' : '⏳ Kiralanamaz'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Motor bulunamadı mesajı */}
            {filtrelenmisMotorlar.length === 0 && (
              <div className="empty-state">
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏍️</div>
                <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                  {motorlar.length === 0 ? 'Henüz motor eklenmemiş' : 'Arama kriterlerinize uygun motor bulunamadı'}
                </h3>
                <p style={{ color: '#9ca3af' }}>
                  {motorlar.length === 0 ? 'Admin panelinden yeni motor ekleyebilirsiniz' : 'Filtreleri temizleyip tekrar deneyin'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ADMIN PANEL - GELİŞMİŞ VERSİYON */}
        {aktifSayfa === 'admin' && kullanici && kullanici.role === 'admin' && (
          <div className="fade-in">
            <h2 style={{ 
              color: 'white', 
              marginBottom: '1.5rem', 
              fontSize: '2rem',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              ⚙️ Admin Paneli
            </h2>

            {/* ADMIN İSTATİSTİKLERİ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div className="modern-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏍️</div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{motorlar.length}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>Toplam Motor</p>
              </div>
              
              <div className="modern-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>{rezervasyonlar.length}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>Toplam Rezervasyon</p>
              </div>
              
              <div className="modern-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
                  {rezervasyonlar.filter(r => r.durum === 'onaylandi').length}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>Onaylanan</p>
              </div>
              
              <div className="modern-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem 0' }}>
                  {rezervasyonlar.filter(r => r.durum === 'beklemede').length}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>Bekleyen</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* SOL TARAF - MOTOR YÖNETİMİ */}
              <div>
                {/* MOTOR EKLEME FORMU - AYNI KALACAK */}
                <div className="modern-card" style={{ border: '2px solid var(--success)', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--success)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
                    ➕ Yeni Motor Ekle
                  </h3>
                  <form onSubmit={motorEkle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">🏷️ Marka</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Honda"
                          value={yeniMotor.marka}
                          onChange={(e) => setYeniMotor({...yeniMotor, marka: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">🚀 Model</label>
                        <input 
                          type="text" 
                          placeholder="Örn: CBR 650R"
                          value={yeniMotor.model}
                          onChange={(e) => setYeniMotor({...yeniMotor, model: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">📅 Yıl</label>
                        <input 
                          type="number" 
                          placeholder="Örn: 2024"
                          value={yeniMotor.yil}
                          onChange={(e) => setYeniMotor({...yeniMotor, yil: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">🔢 Plaka</label>
                        <input 
                          type="text" 
                          placeholder="Örn: 34ABC123"
                          value={yeniMotor.plaka}
                          onChange={(e) => setYeniMotor({...yeniMotor, plaka: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">💰 Günlük Fiyat (TL)</label>
                      <input 
                        type="number" 
                        placeholder="Örn: 450"
                        value={yeniMotor.gunlukFiyat}
                        onChange={(e) => setYeniMotor({...yeniMotor, gunlukFiyat: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">📝 Açıklama</label>
                      <textarea 
                        placeholder="Motor hakkında açıklama..."
                        value={yeniMotor.aciklama}
                        onChange={(e) => setYeniMotor({...yeniMotor, aciklama: e.target.value})}
                        rows="3"
                        className="form-input"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="modern-btn btn-success"
                    >
                      🏍️ Motor Ekle
                    </button>
                  </form>
                </div>

                {/* MOTOR LİSTESİ - GELİŞMİŞ */}
                <div className="modern-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--dark)', margin: 0, fontSize: '1.3rem' }}>
                      📋 Motor Yönetimi ({motorlar.length})
                    </h3>
                    <button 
                      onClick={motorlariGetir}
                      className="modern-btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      🔄 Yenile
                    </button>
                  </div>
                  
                  {motorlar.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏍️</div>
                      <p style={{ color: 'var(--secondary)' }}>Henüz motor eklenmemiş</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {motorlar.map((motor) => (
                        <div key={motor._id} className="modern-card" style={{ backgroundColor: '#f8fafc', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--dark)', fontSize: '1.1rem' }}>
                                {motor.marka} {motor.model}
                              </h4>
                              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                                🏷️ {motor.plaka} • 📅 {motor.yil} • 💰 {motor.gunlukFiyat} TL/gün
                              </p>
                              {motor.aciklama && (
                                <p style={{ 
                                  margin: '0.5rem 0 0 0', 
                                  color: '#4b5563', 
                                  fontSize: '0.85rem',
                                  padding: '0.5rem',
                                  backgroundColor: 'white',
                                  borderRadius: '4px'
                                }}>
                                  📝 {motor.aciklama}
                                </p>
                              )}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                <span className={`status-badge ${
                                  motor.durum === 'musait' ? 'status-available' : 
                                  motor.durum === 'kiralandi' ? 'status-rented' : 'status-rented'
                                }`}>
                                  {motor.durum === 'musait' ? '✅ Müsait' : 
                                  motor.durum === 'kiralandi' ? '🔴 Kiralandı' : '⚡ Bakımda'}
                                </span>
                                
                                {/* Motor durumu değiştirme butonları */}
                                <select 
                                  value={motor.durum}
                                  onChange={(e) => {
                                    const updatedMotor = {...motor, durum: e.target.value};
                                    setDuzenlenenMotor(updatedMotor);
                                    motorDuzenle({ preventDefault: () => {} });
                                  }}
                                  style={{ 
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    backgroundColor: 'white'
                                  }}
                                >
                                  <option value="musait">Müsait</option>
                                  <option value="kiralandi">Kiralandı</option>
                                  <option value="bakimda">Bakımda</option>
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                              <button 
                                onClick={() => motorDuzenleModalAc(motor)}
                                className="modern-btn"
                                style={{ 
                                  backgroundColor: 'var(--primary)', 
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.8rem'
                                }}
                              >
                                ✏️ Düzenle
                              </button>
                              <button 
                                onClick={() => motorSil(motor._id)}
                                className="modern-btn btn-danger"
                                style={{ 
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.8rem'
                                }}
                              >
                                🗑️ Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SAĞ TARAF - REZERVASYON YÖNETİMİ */}
              <div>
                <div className="modern-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--dark)', margin: 0, fontSize: '1.3rem' }}>
                      📅 Rezervasyon Yönetimi ({rezervasyonlar.length})
                    </h3>
                    <button 
                      onClick={rezervasyonlariGetir}
                      className="modern-btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      🔄 Yenile
                    </button>
                  </div>
                  
                  {rezervasyonlar.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                      <p style={{ color: 'var(--secondary)' }}>Henüz rezervasyon yok</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {rezervasyonlar.map((rezervasyon) => (
                        <div key={rezervasyon._id} className="modern-card" style={{ 
                          backgroundColor: '#f8fafc',
                          borderLeft: `4px solid ${
                            rezervasyon.durum === 'onaylandi' ? '#10b981' :
                            rezervasyon.durum === 'reddedildi' ? '#ef4444' :
                            rezervasyon.durum === 'iptal' ? '#6b7280' : '#f59e0b'
                          }`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--dark)', fontSize: '1rem' }}>
                                {rezervasyon.musteriAd}
                              </h4>
                              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.8rem' }}>
                                📧 {rezervasyon.musteriEmail} • 📞 {rezervasyon.musteriTelefon}
                              </p>
                              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.8rem' }}>
                                🏍️ {rezervasyon.motor?.marka} {rezervasyon.motor?.model} • 
                                📅 {new Date(rezervasyon.baslangicTarihi).toLocaleDateString('tr-TR')} - {new Date(rezervasyon.bitisTarihi).toLocaleDateString('tr-TR')}
                              </p>
                              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.8rem' }}>
                                💰 {rezervasyon.toplamUcret} TL • ⏱️ {rezervasyon.toplamGun} gün
                              </p>
                              
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  backgroundColor: 
                                    rezervasyon.durum === 'onaylandi' ? '#dcfce7' :
                                    rezervasyon.durum === 'reddedildi' ? '#fef2f2' :
                                    rezervasyon.durum === 'iptal' ? '#f3f4f6' : '#fef3c7',
                                  color: 
                                    rezervasyon.durum === 'onaylandi' ? '#166534' :
                                    rezervasyon.durum === 'reddedildi' ? '#dc2626' :
                                    rezervasyon.durum === 'iptal' ? '#374151' : '#92400e'
                                }}>
                                  {rezervasyon.durum === 'onaylandi' ? '✅ Onaylandı' :
                                  rezervasyon.durum === 'reddedildi' ? '❌ Reddedildi' :
                                  rezervasyon.durum === 'iptal' ? '⚫ İptal' : '⏳ Beklemede'}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                              {/* Rezervasyon durumu butonları */}
                              {rezervasyon.durum === 'beklemede' && (
                                <>
                                  <button 
                                    onClick={() => rezervasyonDurumuGuncelle(rezervasyon._id, 'onaylandi')}
                                    className="modern-btn btn-success"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                                  >
                                    ✅ Onayla
                                  </button>
                                  <button 
                                    onClick={() => rezervasyonDurumuGuncelle(rezervasyon._id, 'reddedildi')}
                                    className="modern-btn btn-danger"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                                  >
                                    ❌ Reddet
                                  </button>
                                </>
                              )}
                              
                              <button 
                                onClick={() => rezervasyonDetayAc(rezervasyon)}
                                className="modern-btn btn-outline"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                              >
                                👁️ Detay
                              </button>
                              
                              {(rezervasyon.durum === 'onaylandi' || rezervasyon.durum === 'beklemede') && (
                                <button 
                                  onClick={() => rezervasyonDurumuGuncelle(rezervasyon._id, 'iptal')}
                                  className="modern-btn"
                                  style={{ 
                                    backgroundColor: '#6b7280',
                                    padding: '0.4rem 0.8rem', 
                                    fontSize: '0.7rem' 
                                  }}
                                >
                                  🚫 İptal
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN GİRİŞ YAPMAMIŞSA UYARI */}
        {aktifSayfa === 'admin' && (!kullanici || kullanici.role !== 'admin') && (
          <div className="modern-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              Admin Erişimi Gerekli
            </h3>
            <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
              Bu sayfayı görüntülemek için admin yetkisine sahip olmalısınız.
            </p>
            <button 
              onClick={() => setAktifSayfa('anasayfa')}
              className="modern-btn btn-primary"
            >
              🏠 Ana Sayfaya Dön
            </button>
          </div>
        )}
      </div>

      {/* REZERVASYON MODAL'ı */}
      {seciliMotor && (
        <div className="modern-modal-overlay">
          <div className="modern-modal fade-in">
            <div className="modal-header">
              <h3 className="modal-title">🏍️ Rezervasyon Yap</h3>
              <button 
                onClick={rezervasyonModalKapat}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Seçilen Motor Bilgisi */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--primary)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--dark)' }}>
                {seciliMotor.marka} {seciliMotor.model}
              </h4>
              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                🏷️ {seciliMotor.plaka} • 📅 {seciliMotor.yil} • 💰 {seciliMotor.gunlukFiyat} TL/gün
              </p>
            </div>

            {/* Rezervasyon Formu */}
            <form onSubmit={rezervasyonYap}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">👤 Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Adınız ve soyadınız"
                    value={rezervasyonFormu.musteriAd}
                    onChange={(e) => setRezervasyonFormu({...rezervasyonFormu, musteriAd: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📧 E-posta</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={rezervasyonFormu.musteriEmail}
                    onChange={(e) => setRezervasyonFormu({...rezervasyonFormu, musteriEmail: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📞 Telefon</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={rezervasyonFormu.musteriTelefon}
                    onChange={(e) => setRezervasyonFormu({...rezervasyonFormu, musteriTelefon: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">📅 Başlangıç</label>
                    <input
                      type="date"
                      value={rezervasyonFormu.baslangicTarihi}
                      onChange={(e) => setRezervasyonFormu({...rezervasyonFormu, baslangicTarihi: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">📅 Bitiş</label>
                    <input
                      type="date"
                      value={rezervasyonFormu.bitisTarihi}
                      onChange={(e) => setRezervasyonFormu({...rezervasyonFormu, bitisTarihi: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                {/* Toplam Tutar Hesaplama */}
                {rezervasyonFormu.baslangicTarihi && rezervasyonFormu.bitisTarihi && (
                  <div style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #a7f3d0'
                  }}>
                    <p style={{ margin: 0, color: '#065f46', fontWeight: '600' }}>
                      💰 Toplam Tutar: {
                        (() => {
                          const baslangic = new Date(rezervasyonFormu.baslangicTarihi);
                          const bitis = new Date(rezervasyonFormu.bitisTarihi);
                          const gunFarki = Math.ceil((bitis - baslangic) / (1000 * 60 * 60 * 24));
                          return gunFarki > 0 ? `${gunFarki} gün × ${seciliMotor.gunlukFiyat} TL = ${gunFarki * seciliMotor.gunlukFiyat} TL` : '0 TL';
                        })()
                      }
                    </p>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={rezervasyonModalKapat}
                    className="modern-btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={rezervasyonYukleniyor}
                    className="modern-btn btn-success"
                    style={{ flex: 1 }}
                  >
                    {rezervasyonYukleniyor ? '⏳ İşleniyor...' : '✅ Rezervasyon Yap'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal fade-in">
            <div className="modal-header">
              <h3 className="modal-title">🔐 Giriş Yap</h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={girisYap}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">📧 E-posta</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">🔑 Şifre</label>
                  <input
                    type="password"
                    placeholder="Şifreniz"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="modern-btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {loginLoading ? '⏳ Giriş Yapılıyor...' : '🚀 Giriş Yap'}
                  </button>
                </div>
                
                <p style={{ textAlign: 'center', margin: 0, color: 'var(--secondary)' }}>
                  Hesabınız yok mu?{' '}
                  <button 
                    type="button"
                    onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Kayıt Ol
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {showRegisterModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal fade-in">
            <div className="modal-header">
              <h3 className="modal-title">📝 Kayıt Ol</h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={kayitOl}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">👤 Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Adınız ve soyadınız"
                    value={registerForm.ad}
                    onChange={(e) => setRegisterForm({...registerForm, ad: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">📧 E-posta</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">📞 Telefon</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={registerForm.telefon}
                    onChange={(e) => setRegisterForm({...registerForm, telefon: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">🔑 Şifre</label>
                  <input
                    type="password"
                    placeholder="Şifreniz (min. 6 karakter)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="form-input"
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="submit"
                    disabled={loginLoading}
                    className="modern-btn btn-success"
                    style={{ flex: 1 }}
                  >
                    {loginLoading ? '⏳ Kayıt Yapılıyor...' : '✅ Kayıt Ol'}
                  </button>
                </div>
                
                <p style={{ textAlign: 'center', margin: 0, color: 'var(--secondary)' }}>
                  Zaten hesabınız var mı?{' '}
                  <button 
                    type="button"
                    onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Giriş Yap
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÖDEME MODAL'ı - TEST VERSİYONU */}
      {odemeModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal fade-in">
            <div className="modal-header">
              <h3 className="modal-title">💳 Ödeme Yap - TEST MODU</h3>
              <button 
                onClick={odemeModalKapat}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Ödeme Bilgileri */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--success)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--dark)' }}>
                {odemeData?.motor}
              </h4>
              <p style={{ margin: '0.25rem 0', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                Rezervasyon ID: {odemeData?.rezervasyonId}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#065f46', fontWeight: 'bold', fontSize: '1.2rem' }}>
                💰 {odemeData?.amount} TL
              </p>
            </div>

            {/* Test Kart Bilgileri */}
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid var(--warning)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '1rem' }}>
                🧪 TEST KART BİLGİLERİ
              </h4>
              <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Kart No:</strong> 4242 4242 4242 4242</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Son Kullanma:</strong> 12/34</p>
                <p style={{ margin: '0.25rem 0' }}><strong>CVC:</strong> 123</p>
                <p style={{ margin: '0.25rem 0' }}><strong>ZIP:</strong> 12345</p>
              </div>
            </div>

            {/* Test Ödeme Formu */}
            <form onSubmit={testOdemeYap}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">💳 Kart Numarası</label>
                  <input
                    type="text"
                    name="kartNo"
                    placeholder="4242 4242 4242 4242"
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">📅 Son Kullanma</label>
                    <input
                      type="text"
                      name="sonKullanma"
                      placeholder="12/34"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">🔒 CVC</label>
                    <input
                      type="text"
                      name="cvc"
                      placeholder="123"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📍 ZIP Kodu</label>
                  <input
                    type="text"
                    name="zip"
                    placeholder="12345"
                    className="form-input"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={odemeModalKapat}
                    className="modern-btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={odemeYukleniyor}
                    className="modern-btn btn-success"
                    style={{ flex: 1 }}
                  >
                    {odemeYukleniyor ? '⏳ İşleniyor...' : '✅ Test Ödemesi Yap'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOTOR DÜZENLEME MODAL'ı */}
      {showMotorDuzenleModal && duzenlenenMotor && (
        <div className="modern-modal-overlay">
          <div className="modern-modal fade-in">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Motor Düzenle</h3>
              <button 
                onClick={() => setShowMotorDuzenleModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={motorDuzenle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">🏷️ Marka</label>
                    <input 
                      type="text"
                      value={duzenlenenMotor.marka}
                      onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, marka: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">🚀 Model</label>
                    <input 
                      type="text"
                      value={duzenlenenMotor.model}
                      onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, model: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">📅 Yıl</label>
                    <input 
                      type="number"
                      value={duzenlenenMotor.yil}
                      onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, yil: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">🔢 Plaka</label>
                    <input 
                      type="text"
                      value={duzenlenenMotor.plaka}
                      onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, plaka: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">💰 Günlük Fiyat (TL)</label>
                  <input 
                    type="number"
                    value={duzenlenenMotor.gunlukFiyat}
                    onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, gunlukFiyat: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📝 Açıklama</label>
                  <textarea 
                    value={duzenlenenMotor.aciklama}
                    onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, aciklama: e.target.value})}
                    rows="3"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🔧 Durum</label>
                  <select
                    value={duzenlenenMotor.durum}
                    onChange={(e) => setDuzenlenenMotor({...duzenlenenMotor, durum: e.target.value})}
                    className="form-input"
                  >
                    <option value="musait">Müsait</option>
                    <option value="kiralandi">Kiralandı</option>
                    <option value="bakimda">Bakımda</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={() => setShowMotorDuzenleModal(false)}
                    className="modern-btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="modern-btn btn-success"
                    style={{ flex: 1 }}
                  >
                    💾 Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;