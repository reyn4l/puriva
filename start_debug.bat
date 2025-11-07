@echo off
REM Enhanced starter: try py -> python -> npx http-server. Shows clear error if none found.
REM Usage: double-click this file or run from cmd in the project folder

:: Ensure we run from the script directory
cd /d "%~dp0"

set PORT=8000
echo Checking for Python (py)
where py >nul 2>&1
if %ERRORLEVEL%==0 (
	set PY_CMD=py -3
) else (
	echo 'py' launcher not found, checking 'python'...
	where python >nul 2>&1
	if %ERRORLEVEL%==0 (
		set PY_CMD=python
	) else (
		set PY_CMD=
	)
)

if defined PY_CMD (
	echo Starting Python HTTP server on port %PORT% using %PY_CMD%...
	start "Puriva Server" cmd /k "%PY_CMD% -m http.server %PORT%"
	timeout /t 1 >nul
	start "" "http://localhost:%PORT%/index.html"
	echo Server should be starting in a new window. If browser can't connect, check that the server window shows no errors.
	goto :EOF
)

echo Python not found. Checking for Node's npx...
where npx >nul 2>&1
if %ERRORLEVEL%==0 (
	echo Starting http-server via npx on port %PORT%...
	start "Puriva Server (npx)" cmd /k "npx http-server -p %PORT%"
	timeout /t 1 >nul
	start "" "http://localhost:%PORT%/index.html"
	goto :EOF
)

echo.
echo ERROR: Tidak ditemukan 'py' atau 'python' atau 'npx' di PATH.
echo - Untuk Python: install Python 3 dari https://www.python.org/downloads/ (pastikan centang 'Add to PATH')
echo - Atau install Node.js (untuk npx/http-server): https://nodejs.org/
echo Setelah memasang, jalankan lagi script ini atau jalankan salah satu perintah manual di bawah.
echo.
echo Perintah manual yang bisa dicoba dari Command Prompt di folder projek:
echo.
echo Python:
echo    py -3 -m http.server %PORT%
echo atau
echo    python -m http.server %PORT%
echo.
echo Node (jika sudah terpasang):
echo    npx http-server -p %PORT%
echo.
pause
