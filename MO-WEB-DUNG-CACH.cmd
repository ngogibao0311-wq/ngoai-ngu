@echo off
setlocal
cd /d "%~dp0"
title Lingo - Khoi dong web dung cach

echo ================================================
echo   LINGO - FIREBASE GOOGLE LOGIN
echo ================================================
echo.
echo Web BAT BUOC phai chay bang http://localhost:5174/
echo KHONG mo index.html truc tiep.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua co Node.js hoac Node.js chua nam trong PATH.
  echo Hay cai Node.js, sau do chay lai file nay.
  pause
  exit /b 1
)

REM Start the local web server in its own minimized window.
start "Lingo Local Server" /min cmd /c "cd /d ""%~dp0"" ^&^& node server.cjs"

REM Give the server a moment to bind the port before opening the browser.
timeout /t 2 /nobreak >nul

echo Dang mo: http://localhost:5174/
start "" "http://localhost:5174/"
echo.
echo Neu Google Login bao unauthorized-domain:
echo Firebase Console ^> Authentication ^> Settings ^> Authorized domains
echo Them: localhost
echo.
echo Ban co the dong cua so nay. Server chay o cua so Lingo Local Server.
pause
endlocal
