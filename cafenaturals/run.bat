@echo off
cd /d "%~dp0"
echo Starting Cafe Blossom Development Server...

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Starting development server...
npm run dev
pause
