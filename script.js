const video = document.getElementById("camera");
const statusText = document.getElementById("status");
const historyList = document.getElementById("historyList");
const statusCard = document.querySelector(".status-card");
const statusIcon = document.querySelector(".status-icon");

// Helper untuk mengupdate teks status dan ikon
function setStatus(text, emoji = '') {
    if (statusText) {
        statusText.innerText = text;
    }
    if (statusIcon) {
        statusIcon.textContent = emoji || statusIcon.textContent;
    }
}

// Element untuk status perangkat (deteksi page)
const deviceStatusCard = document.getElementById("deviceStatusCard");
const deviceStatus = document.getElementById("deviceStatus");
const deviceTimer = document.getElementById("deviceTimer");
const timerValue = document.getElementById("timerValue");

// Element untuk status perangkat (manual page)
const deviceStatusCardManual = document.getElementById("deviceStatusCardManual");
const deviceStatusManual = document.getElementById("deviceStatusManual");
const deviceTimerManual = document.getElementById("deviceTimerManual");
const timerValueManual = document.getElementById("timerValueManual");

let model;
let deviceTimerInterval = null; // Timer untuk countdown
let deviceTimerIntervalManual = null; // Timer untuk manual page
let remainingSeconds = 0; // Sisa waktu dalam detik
let remainingSecondsManual = 0; // Sisa waktu untuk manual page

// Konfigurasi durasi berdasarkan tingkat kebusukan (dalam detik)
// Semakin tinggi tingkat kebusukan, semakin lama durasi
const SPOILAGE_DURATION_CONFIG = {
    min: 60,      // Minimum 1 menit untuk tingkat kebusukan rendah
    max: 600,     // Maximum 10 menit untuk tingkat kebusukan tinggi
    scale: 540    // Range: 540 detik (9 menit) dari min ke max
};

// Fungsi untuk menghitung durasi berdasarkan tingkat kebusukan
// spoilageLevel: 0-100 (0 = segar, 100 = sangat busuk)
function calculateDuration(spoilageLevel) {
    // Jika tidak busuk (level 0), return 0
    if (spoilageLevel <= 0) {
        return 0;
    }

    // Normalisasi level ke skala 0-1
    const normalizedLevel = Math.min(spoilageLevel / 100, 1);

    // Hitung durasi: min + (normalizedLevel * scale)
    const duration = SPOILAGE_DURATION_CONFIG.min +
        (normalizedLevel * SPOILAGE_DURATION_CONFIG.scale);

    // Bulatkan ke detik terdekat
    return Math.round(duration);
}

// Fungsi untuk memformat waktu dari detik ke MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Fungsi untuk menyalakan kipas & UV dengan durasi tertentu
function turnOnDevice(durationSeconds, isManual = false) {
    // Pilih elemen yang sesuai (deteksi atau manual page)
    const card = isManual ? deviceStatusCardManual : deviceStatusCard;
    const status = isManual ? deviceStatusManual : deviceStatus;
    const timer = isManual ? deviceTimerManual : deviceTimer;
    const timerVal = isManual ? timerValueManual : timerValue;
    const timerInterval = isManual ? deviceTimerIntervalManual : deviceTimerInterval;

    // Set status dan tampilkan timer
    card.classList.add("active");
    status.textContent = "Menyala";
    timer.style.display = "block";

    // Set waktu awal
    if (isManual) {
        remainingSecondsManual = durationSeconds;
    } else {
        remainingSeconds = durationSeconds;
    }

    // Update timer display
    timerVal.textContent = formatTime(durationSeconds);

    // Hapus timer lama jika ada
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Buat timer baru untuk countdown
    const interval = setInterval(() => {
        if (isManual) {
            remainingSecondsManual--;
            if (remainingSecondsManual <= 0) {
                turnOffDevice(true);
                clearInterval(interval);
                if (isManual) {
                    deviceTimerIntervalManual = null;
                } else {
                    deviceTimerInterval = null;
                }
                return;
            }
            timerVal.textContent = formatTime(remainingSecondsManual);
        } else {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
                turnOffDevice(false);
                clearInterval(interval);
                if (isManual) {
                    deviceTimerIntervalManual = null;
                } else {
                    deviceTimerInterval = null;
                }
                return;
            }
            timerVal.textContent = formatTime(remainingSeconds);
        }
    }, 1000);

    // Simpan interval ID
    if (isManual) {
        deviceTimerIntervalManual = interval;
    } else {
        deviceTimerInterval = interval;
    }

    // Log untuk debugging
    console.log(`KIPAS & UV ON (${isManual ? 'Manual' : 'Otomatis'}) - Durasi: ${durationSeconds} detik (${formatTime(durationSeconds)})`);
}

// Fungsi untuk mematikan kipas & UV
function turnOffDevice(isManual = false) {
    const card = isManual ? deviceStatusCardManual : deviceStatusCard;
    const status = isManual ? deviceStatusManual : deviceStatus;
    const timer = isManual ? deviceTimerManual : deviceTimer;
    const timerInterval = isManual ? deviceTimerIntervalManual : deviceTimerInterval;

    // Hapus timer jika ada
    if (timerInterval) {
        clearInterval(timerInterval);
        if (isManual) {
            deviceTimerIntervalManual = null;
        } else {
            deviceTimerInterval = null;
        }
    }

    // Update UI
    card.classList.remove("active");
    status.textContent = "Mati";
    timer.style.display = "none";

    console.log(`KIPAS & UV OFF (${isManual ? 'Manual' : 'Otomatis'})`);
}

// Camera control: start/stop when user presses Start/Stop
let stream = null;
function startCamera() {
    if (stream) return Promise.resolve();
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
            stream = s;
            video.srcObject = stream;
            return video.play().then(() => {
                // Update status to show camera is active
                setStatus('Kamera aktif', '📷');
            });
        })
        .catch(err => {
            console.error("Kamera tidak dapat diakses:", err);
            statusText.innerText = "Kamera tidak dapat diakses";
            throw err;
        });
}

function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    // Update status to show camera is off
    setStatus('Kamera dimatikan', '⏹️');
}

// Load Model AI
async function loadModel() {
    try {
        model = await tf.loadLayersModel("./model/model.json");
        statusText.innerText = "Model Siap ✅";
        statusIcon.textContent = "✅";
        statusCard.classList.remove("fresh", "spoiled");
    } catch (error) {
        console.error("Gagal memuat model:", error);
        statusText.innerText = "Model tidak ditemukan (Demo Mode)";
        statusIcon.textContent = "⚠️";
        // Untuk demo, tetap lanjutkan dengan fake detection
        model = { demo: true };
    }
}
loadModel();

// Update status card styling berdasarkan hasil deteksi
function updateStatusCard(result, spoilageLevel = 0) {
    statusCard.classList.remove("fresh", "spoiled");

    if (result === "Segar") {
        statusCard.classList.add("fresh");
        statusIcon.textContent = "✅";
        statusText.innerText = `Status: Segar`;
    } else if (result === "Busuk") {
        statusCard.classList.add("spoiled");
        statusIcon.textContent = "⚠️";
        // Tampilkan tingkat kebusukan jika tersedia
        if (spoilageLevel > 0) {
            statusText.innerText = `Status: Busuk (Tingkat: ${spoilageLevel}%)`;
        } else {
            statusText.innerText = `Status: Busuk`;
        }
    }
}

// Menambahkan item ke history dengan format yang lebih baik
function addToHistory(result, spoilageLevel = 0) {
    // Hapus pesan "Belum ada riwayat" jika ada
    const emptyItem = historyList.querySelector(".history-empty");
    if (emptyItem) {
        emptyItem.remove();
    }

    const time = new Date().toLocaleTimeString("id-ID");
    const emoji = result === "Segar" ? "✅" : "⚠️";
    const colorClass = result === "Segar" ? "fresh" : "spoiled";
    const duration = result === "Busuk" && spoilageLevel > 0
        ? calculateDuration(spoilageLevel)
        : 0;
    const durationText = duration > 0 ? ` (Durasi: ${formatTime(duration)})` : "";

    const li = document.createElement("li");
    li.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${emoji}</span>
                <div>
                    <span style="font-weight: 600; color: ${result === 'Segar' ? '#16a085' : '#c0392b'};">${result}</span>
                    ${spoilageLevel > 0 ? `<span style="font-size: 12px; color: #999; display: block; margin-top: 2px;">Level: ${spoilageLevel}%${durationText}</span>` : ''}
                </div>
            </div>
            <span style="color: #999; font-size: 13px;">${time}</span>
        </div>
    `;

    historyList.insertBefore(li, historyList.firstChild);

    // Batasi history maksimal 20 item
    while (historyList.children.length > 20) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Controlled fake detection loop (will run only after Start ditekan)
let autoScanInterval = null;
async function runDetectionStep() {
    if (!model) return;

    // Placeholder detection logic: 60% segar, 40% busuk
    const isSpoiled = Math.random() > 0.6;
    let result = "Segar";
    let spoilageLevel = 0;

    if (isSpoiled) {
        result = "Busuk";
        spoilageLevel = Math.floor(Math.random() * 81) + 20; // 20-100%
        const duration = calculateDuration(spoilageLevel);

        // Reset device timer to new duration
        if (deviceTimerInterval) {
            clearInterval(deviceTimerInterval);
            deviceTimerInterval = null;
        }
        turnOnDevice(duration, false);
    } else {
        if (deviceTimerInterval) {
            turnOffDevice(false);
        }
    }

    updateStatusCard(result, spoilageLevel);
    addToHistory(result, spoilageLevel);
}

function startAutoScan(intervalMs = 2000) {
    if (autoScanInterval) return;
    // Run immediately then at interval
    runDetectionStep();
    autoScanInterval = setInterval(runDetectionStep, intervalMs);
}

function stopAutoScan() {
    if (!autoScanInterval) return;
    clearInterval(autoScanInterval);
    autoScanInterval = null;
}

// Wire Start / Stop buttons to control scanning
const startBtn = document.getElementById('startScan');
const stopBtn = document.getElementById('stopScan');
const manualOnBtn = document.getElementById('manualOn');
const manualOffBtn = document.getElementById('manualOff');

function setScanningState(isScanning) {
    if (isScanning) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        // disable manual controls during scanning
        manualOnBtn.disabled = true;
        manualOffBtn.disabled = true;
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        manualOnBtn.disabled = false;
        manualOffBtn.disabled = false;
    }
}

startBtn.addEventListener('click', async () => {
    try {
        setStatus('Memulai scan...', '🔄');
        await startCamera();
        setScanningState(true);
        startAutoScan(2000); // scan tiap 2 detik
        setStatus('Memindai... Tekan Stop untuk berhenti', '🔎');
    } catch (e) {
        setStatus('Gagal mengakses kamera', '⚠️');
        setScanningState(false);
    }
});

stopBtn.addEventListener('click', () => {
    stopAutoScan();
    stopCamera();
    setScanningState(false);
    setStatus('Scan dihentikan', '⏹️');
    // matikan device otomatis saat stop (opsional)
    turnOffDevice(false);
});

// Manual ON/OFF untuk halaman deteksi
document.getElementById("manualOn").onclick = () => {
    // Manual ON dengan durasi default 5 menit (300 detik)
    turnOnDevice(300, false);
};

document.getElementById("manualOff").onclick = () => {
    turnOffDevice(false);
};

// Manual ON/OFF untuk halaman manual
document.getElementById("manualFanOn").onclick = () => {
    // Manual ON dengan durasi default 5 menit (300 detik)
    turnOnDevice(300, true);
};

document.getElementById("manualFanOff").onclick = () => {
    turnOffDevice(true);
};

// File input handler untuk manual review
const fileInput = document.getElementById("fileInput");
const manualStatus = document.getElementById("manualStatus");

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        manualStatus.textContent = `File dipilih: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        manualStatus.style.color = "#16a085";

        // TODO: Di sini bisa ditambahkan logika untuk analisis file
        // dan jika hasilnya busuk, nyalakan kipas & UV dengan durasi sesuai tingkat kebusukan
    } else {
        manualStatus.textContent = "Belum ada file yang dipilih.";
        manualStatus.style.color = "#666";
    }
});

// Navigation dengan update active state
function showPage(id) {
    // Update page visibility
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    // Update navigation button active state
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-page") === id) {
            btn.classList.add("active");
        }
    });
}
