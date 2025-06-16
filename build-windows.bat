@echo off
echo 🚀 Iniciando build para Windows...

echo 📦 Fazendo build da aplicacao web...
call npm run build-only

if %errorlevel% neq 0 (
    echo ❌ Erro no build da aplicacao web
    pause
    exit /b %errorlevel%
)

echo ✅ Build da aplicacao web concluido

echo 🔧 Gerando executavel do Electron...
call npx electron-builder --win --publish=never --config.win.sign=null --config.forceCodeSigning=false

if %errorlevel% neq 0 (
    echo ❌ Erro na geracao do executavel
    pause
    exit /b %errorlevel%
)

echo ✅ Executavel gerado com sucesso!
echo 📁 Verifique a pasta dist-electron/
pause