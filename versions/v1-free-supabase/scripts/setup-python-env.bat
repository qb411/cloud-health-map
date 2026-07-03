@echo off
REM AWS Health Map V1 - Simple Python Environment Setup (Windows)

echo 🐍 Setting up Python environment...

REM Create virtual environment
if not exist "venv" (
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate and install
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

echo ✅ Setup complete! Activate with: venv\Scripts\activate.bat