@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js de chay web.
  pause
  exit /b 1
)
echo Mo trinh duyet tai: http://127.0.0.1:5174
echo Giu cua so nay mo trong khi dung web. Nhan Ctrl+C de dung.
node server.cjs
pause
