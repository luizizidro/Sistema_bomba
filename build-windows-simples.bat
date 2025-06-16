@echo off
chcp 65001 >nul
echo 🚀 Build Simplificado para Windows...

echo 📦 Fazendo build da aplicacao...
call npm run build-only

if %errorlevel% neq 0 (
    echo ❌ Erro no build
    pause
    exit /b %errorlevel%
)

echo 🔧 Gerando executavel SEM assinatura...
call npx electron-builder --win --publish=never --config.win.sign=null --config.forceCodeSigning=false --config.win.certificateFile=null

if %errorlevel% neq 0 (
    echo ❌ Tentando metodo alternativo...
    call npx electron-builder --win --publish=never --config.directories.output=dist-electron --config.win.target=nsis
)

if %errorlevel% neq 0 (
    echo ❌ Erro na geracao. Tentando comando basico...
    call npx electron-builder --win
)

echo ✅ Processo concluido!
echo 📁 Verifique a pasta dist-electron/
pause