@echo off
echo ============================================
echo   VibeApp - Backend Setup ^& Start
echo ============================================
echo.

:: Try to find Python in common locations
set PYTHON_CMD=python

:: Check if python works
python --version >nul 2>&1
if %errorlevel% neq 0 (
    :: Try py launcher
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Python not found!
        echo.
        echo Please install Python from: https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        echo.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
)

%PYTHON_CMD% --version
echo.

cd /d "%~dp0backend"

echo [1/4] Installing Python dependencies...
%PYTHON_CMD% -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [2/4] Making migrations...
%PYTHON_CMD% manage.py makemigrations users
%PYTHON_CMD% manage.py makemigrations posts

echo.
echo [3/4] Applying migrations...
%PYTHON_CMD% manage.py migrate

echo.
echo [4/4] Starting Django server...
echo.
echo ============================================
echo   Backend running at: http://127.0.0.1:8000
echo   Admin panel:        http://127.0.0.1:8000/admin
echo.
echo   Open frontend\index.html in your browser
echo   Or use: npx serve frontend (in another terminal)
echo   Then go to: http://localhost:3000
echo ============================================
echo.
%PYTHON_CMD% manage.py runserver
pause
