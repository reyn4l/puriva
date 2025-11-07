# Menjalankan project untuk debugging (server lokal)

File-file ini membantu Anda menjalankan server lokal dan membuka `index.html` secara cepat pada Windows.

Opsi 1 — Windows (Batch) — mudah (double-click):

- Jalankan `start_debug.bat` dengan double-click atau dari Command Prompt:

```bat
cd \Users\ACER\puriva
start_debug.bat
```

Ini akan membuka jendela cmd baru yang menjalankan `python -m http.server 8000` dan membuka browser ke `http://localhost:8000/index.html`.

Opsi 2 — PowerShell:

Jalankan `start_debug.ps1` dari PowerShell (jalankan dengan ExecutionPolicy bila perlu):

```powershell
cd C:\Users\ACER\puriva
.\start_debug.ps1
```

Opsi 3 — manual (cmd) — pakai Python:

```bat
cd C:\Users\ACER\puriva
py -3 -m http.server 8000
```

Kemudian buka browser di `http://localhost:8000/index.html`.

Catatan:
- Jika browser menolak akses kamera (getUserMedia) pastikan Anda membuka laman lewat `http://localhost` (server lokal) atau HTTPS.
- Jika perintah `py` tidak tersedia, gunakan `python` pada sistem Anda.
