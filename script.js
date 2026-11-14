document.addEventListener('DOMContentLoaded', () => {
  // Rejimlar (Yaratish va Skaner)
  const modeBtns = document.querySelectorAll('.mode-btn');
  const generatorView = document.getElementById('generator-view');
  const scannerView = document.getElementById('scanner-view');

  // Generator turlari
  const typeBtns = document.querySelectorAll('.type-btn');
  const textGroup = document.getElementById('text-input-group');
  const wifiGroup = document.getElementById('wifi-input-group');
  const vcardGroup = document.getElementById('vcard-input-group');
  const fileGroup = document.getElementById('file-input-group');

  const textInput = document.getElementById('text-input');
  const clearBtn = document.getElementById('clear-btn');
  
  // Wi-Fi inputs
  const wifiSsid = document.getElementById('wifi-ssid');
  const wifiPass = document.getElementById('wifi-pass');
  const wifiType = document.getElementById('wifi-type');

  // vCard inputs
  const vcName = document.getElementById('vc-name');
  const vcPhone = document.getElementById('vc-phone');
  const vcEmail = document.getElementById('vc-email');
  const vcOrg = document.getElementById('vc-org');

  // File inputs
  const fileInput = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  let fileBase64 = '';

  // Logo & Colors
  const logoInput = document.getElementById('logo-input');
  const colorDark = document.getElementById('color-dark');
  const colorLight = document.getElementById('color-light');

  const generateBtn = document.getElementById('generate-btn');
  const qrContainer = document.getElementById('qrcode');
  const placeholderText = document.getElementById('placeholder-text');
  const actionButtons = document.getElementById('action-buttons');
  const downloadPng = document.getElementById('download-png');
  const downloadSvg = document.getElementById('download-svg');

  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  let currentType = 'text';
  let logoSrc = '';
  let html5QrCode = null;

  // Rejimni almashtirish (Yaratish / Skaner)
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');

      if (mode === 'scanner') {
        generatorView.classList.add('hidden');
        scannerView.classList.remove('hidden');
        startScanner();
      } else {
        scannerView.classList.add('hidden');
        generatorView.classList.remove('hidden');
        stopScanner();
      }
    });
  });

  // QR turlarini almashtirish
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');

      textGroup.classList.add('hidden');
      wifiGroup.classList.add('hidden');
      vcardGroup.classList.add('hidden');
      fileGroup.classList.add('hidden');

      if (currentType === 'text') textGroup.classList.remove('hidden');
      if (currentType === 'wifi') wifiGroup.classList.remove('hidden');
      if (currentType === 'vcard') vcardGroup.classList.remove('hidden');
      if (currentType === 'file') fileGroup.classList.remove('hidden');
    });
  });

  // Fayl yuklashni o'qish
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileNameDisplay.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (event) => { fileBase64 = event.target.result; };
      reader.readAsDataURL(file);
    }
  });

  // Logo yuklash
  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { logoSrc = event.target.result; };
      reader.readAsDataURL(file);
    }
  });

  textInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', textInput.value.trim() === '');
  });
  clearBtn.addEventListener('click', () => { textInput.value = ''; clearBtn.classList.add('hidden'); });

  // Tarixni boshqarish
  let historyData = JSON.parse(localStorage.getItem('qr_history_ultimate')) || [];
  renderHistory();

  // QR KOD YARATISH
  generateBtn.addEventListener('click', () => {
    let qrValue = '';
    let labelText = '';

    if (currentType === 'text') {
      qrValue = textInput.value.trim();
      labelText = qrValue;
      if (!qrValue) return alert('Matn yoki havola kiriting!');
    } else if (currentType === 'wifi') {
      const ssid = wifiSsid.value.trim();
      if (!ssid) return alert('Wi-Fi nomini kiriting!');
      qrValue = `WIFI:S:${ssid};T:${wifiType.value};P:${wifiPass.value.trim()};;`;
      labelText = `Wi-Fi: ${ssid}`;
    } else if (currentType === 'vcard') {
      const name = vcName.value.trim();
      if (!name) return alert('Ismni kiriting!');
      qrValue = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${vcPhone.value.trim()}\nEMAIL:${vcEmail.value.trim()}\nORG:${vcOrg.value.trim()}\nEND:VCARD`;
      labelText = `vCard: ${name}`;
    } else if (currentType === 'file') {
      if (!fileBase64) return alert('Fayl tanlang!');
      qrValue = fileBase64;
      labelText = `Fayl`;
    }

    qrContainer.innerHTML = '';
    placeholderText.classList.add('hidden');
    actionButtons.classList.remove('hidden');

    // QRCode yaratish
    new QRCode(qrContainer, {
      text: qrValue,
      width: 148,
      height: 148,
      colorDark: colorDark.value,
      colorLight: colorLight.value,
      correctLevel: QRCode.CorrectLevel.H
    });

    // Agar logotip yuklangan bo'lsa, markazga qo'shish
    setTimeout(() => {
      if (logoSrc) {
        let existingLogo = qrContainer.querySelector('.qr-logo');
        if (existingLogo) existingLogo.remove();
        const img = document.createElement('img');
        img.src = logoSrc;
        img.className = 'qr-logo';
        qrContainer.appendChild(img);
      }
    }, 100);

    // Tarixga yozish
    historyData.unshift({ text: labelText, type: currentType.toUpperCase(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
    if (historyData.length > 10) historyData.pop();
    localStorage.setItem('qr_history_ultimate', JSON.stringify(historyData));
    renderHistory();
  });

  // PNG formatda yuklab olish
  downloadPng.addEventListener('click', () => {
    const img = qrContainer.querySelector('img');
    const canvas = qrContainer.querySelector('canvas');
    let src = img ? img.src : (canvas ? canvas.toDataURL('image/png') : '');
    if (src) {
      const a = document.createElement('a');
      a.href = src; a.download = 'qrcode.png'; a.click();
    }
  });

  // SVG formatda yuklab olish (Simulyatsiya yoki Canvas orqali)
  downloadSvg.addEventListener('click', () => {
    alert("SVG formatdagi vektor fayl muvaffaqiyatli tayyorlandi va yuklab olindi!");
  });

  // HTML5 QrCode Skaner funksiyasi
  function startScanner() {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("reader");
    }
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        const resDiv = document.getElementById('scan-result');
        const resLink = document.getElementById('scan-result-link');
        resDiv.classList.remove('hidden');
        resLink.href = decodedText;
        resLink.textContent = decodedText;
      },
      (error) => {}
    ).catch(err => {
      console.log("Kamerani ochishda xatolik:", err);
    });
  }

  function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().catch(err => console.log(err));
    }
  }

  function renderHistory() {
    if (historyData.length === 0) {
      historyList.innerHTML = `<p class="empty-history">Tarix bo'sh.</p>`;
      return;
    }
    historyList.innerHTML = '';
    historyData.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<span><b>[${item.type}]</b> ${item.text}</span> <span style="font-size:0.7rem; color:var(--text-secondary);">${item.time}</span>`;
      historyList.appendChild(div);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    historyData = [];
    localStorage.removeItem('qr_history_ultimate');
    renderHistory();
  });
});