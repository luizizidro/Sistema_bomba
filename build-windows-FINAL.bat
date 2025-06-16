@echo off
chcp 65001 >nul
echo 🔥 BUILD FINAL - Corrigindo Erro de Módulo

echo 📦 Fazendo build da aplicacao...
call npm run build-only

if %errorlevel% neq 0 (
    echo ❌ Erro no build
    pause
    exit /b %errorlevel%
)

echo ✅ Build concluido

echo 🔧 Gerando executavel (sem assinatura)...
call npx electron-builder --win --publish=never --config.forceCodeSigning=false

if %errorlevel% neq 0 (
    echo ❌ Erro. Tentando metodo alternativo...
    call npx electron-builder --win --config electron-builder-simple.json
)

echo ✅ Executavel gerado!
echo 📁 Verifique: dist-electron\
echo.
echo 🎉 Pronto para testar!
pause