@echo off
title Event Crowd Runner
echo ===================================================
echo   Event Crowd Management System - Developer Setup
echo ===================================================
echo.
echo [1/3] Ensuring local MongoDB database is seeded...
cd backend
call npm.cmd run seed
if %errorlevel% neq 0 (
    echo.
    echo WARNING: MongoDB seeding failed. Please ensure MongoDB Service is running!
    echo Proceeding anyway...
)
echo.
echo [2/3] Booting backend server in a new window...
start cmd /k "title Event Crowd Backend && cd /d %~dp0backend && npm.cmd run dev"

echo [3/3] Booting frontend dev server in a new window...
start cmd /k "title Event Crowd Frontend && cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ===================================================
echo   System running successfully!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:5000
echo ===================================================
echo.
pause
