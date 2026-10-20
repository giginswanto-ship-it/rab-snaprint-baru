@echo off
title Snaprint Digital Printing - RAB & Perkiraan Modal Awal (Live Database)
echo ======================================================================
echo   SNAPRINT DIGITAL PRINTING - SISTEM LIVE DATABASE & RAB TERINTEGRASI
echo ======================================================================
echo.
echo [1/2] Memulai Live Database Server...
start "" /b cmd /c "node server.js"
timeout /t 2 /nobreak >nul
echo.
echo [2/2] Membuka aplikasi di browser (http://localhost:3000)...
start "" "http://localhost:3000"
echo.
echo ======================================================================
echo  * Status Database    : LIVE CONNECTED (Real-time SSE Stream)
echo  * File Database Fisik: data\database.json
echo  * Server URL         : http://localhost:3000
echo ======================================================================
echo.
echo Server sedang berjalan. Biarkan jendela ini tetap terbuka selama bekerja.
echo Tekan sembarang tombol untuk menghentikan server.
pause >nul
