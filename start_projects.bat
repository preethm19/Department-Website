@echo off
echo Starting AI Department Website and SMS System...
echo.

echo Starting SMS Server (Node.js)...
start "SMS Server" cmd /k "cd /d %~dp0sms && npm start"

timeout /t 3 /nobreak > nul

echo Starting Main Website (Python HTTP Server)...
start "Main Website" cmd /k "cd /d %~dp0 && python -m http.server 8080"

echo.
echo Both projects are starting up...
echo.
echo SMS Server: http://localhost:3000
echo Main Website: http://localhost:8080
echo.
echo Press any key to close this window...
pause > nul
