@echo off
chcp 65001 >nul
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
call npx electron-builder --win --publish=never

if %errorlevel% neq 0 (
    echo ❌ Erro na geracao do executavel
    pause
    exit /b %errorlevel%
)

echo ✅ Executavel gerado com sucesso!
echo 📁 Arquivos criados em dist-electron/:
echo    - Sistema de Seleção de Bombas Setup 1.0.0.exe (Instalador)
echo    - Sistema-Selecao-Bombas-Portable.exe (Versão Portable)
echo.
echo 🎉 Pronto para usar!
pause