@echo off
title GLOBAL SOUL - Local Server

cd /d "%~dp0"

echo.
echo =====================================
echo      GLOBAL SOUL Local Server
echo =====================================
echo.

echo Browser:
echo http://localhost:8080
echo.

npx serve public -l 8080

pause