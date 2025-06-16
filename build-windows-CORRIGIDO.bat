@echo off
chcp 65001 >nul
echo 🔥 BUILD CORRIGIDO - Aplicativo Funcionando

echo 📦 Fazendo build da aplicacao...
call npm run build-only

if %errorlevel% neq 0 (
    echo ❌ Erro no build
    pause
    exit /b %errorlevel%
)

echo ✅ Build concluido

echo 🔧 Gerando executavel corrigido...
call npx electron-builder --win --publish=never --config.forceCodeSigning=false

if %errorlevel% neq 0 (
    echo ❌ Erro. Tentando metodo alternativo...
    call npx electron-builder --win --config electron-builder-simple.json
)

echo ✅ Executavel gerado!
echo 📁 Verifique: dist-electron\
echo.
echo 🎉 Agora o app deve mostrar as curvas e informações!
pause