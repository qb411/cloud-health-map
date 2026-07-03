#!/bin/bash

# AWS Health Map V1 - Simple Python Environment Setup

set -e

echo "🐍 Setting up Python environment..."

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate and install
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Setup complete! Activate with: source venv/bin/activate"