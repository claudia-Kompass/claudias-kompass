@echo off
title GLOBAL SOUL - Publish DEV

cd /d "%~dp0"

echo.
echo =====================================
echo        GLOBAL SOUL - DEV Publish
echo =====================================
echo.

git status

echo.
set /p msg=Commit-Nachricht: 

git add .

git commit -m "%msg%"

git push origin dev

echo.
echo =====================================
echo        Upload abgeschlossen
echo =====================================
pause