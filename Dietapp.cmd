@echo off
:: -----------------------------------------------------------------------
::  Dietapp - arranque provisional (doble clic)
::  1) Si el servidor no esta en marcha, lo arranca minimizado (ventana "Dietapp - servidor").
::  2) Abre la app en el navegador: http://localhost:4173
::  Para cerrar la app del todo: cierra esa ventana minimizada.
::  Requiere Node.js (ya instalado). Sirve la carpeta dist/ (la version compilada).
:: -----------------------------------------------------------------------
title Dietapp
cd /d "%~dp0"

:: Si no hay version compilada, la genera (tarda unos segundos la primera vez)
if not exist "dist\index.html" (
  echo Compilando Dietapp por primera vez...
  call npm run build
)

:: Ya esta el servidor respondiendo?
call :ping && goto open

start "Dietapp - servidor" /min cmd /c "npx vite preview --port 4173 --host --strictPort"

:: Espera (max. 30 s) a que responda
set /a tries=0
:wait
timeout /t 1 /nobreak >nul
call :ping && goto open
set /a tries+=1
if %tries% lss 30 goto wait
echo No he podido arrancar el servidor. Abre esta carpeta en una terminal y ejecuta: npx vite preview --port 4173
pause
exit /b 1

:open
start "" "http://localhost:4173"
exit /b 0

:ping
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -UseBasicParsing 'http://localhost:4173' -TimeoutSec 1; exit 0 } catch { exit 1 }"
exit /b %errorlevel%
