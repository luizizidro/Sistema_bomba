@echo off
chcp 65001 >nul
echo 🚀 BUILD OTIMIZADO - Sistema de Seleção de Bombas v2.0

echo.
echo 📋 Verificando ambiente...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale Node.js 16+ primeiro.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

echo 🧹 Limpando arquivos antigos...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 📦 Instalando/atualizando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro na instalação de dependências
    pause
    exit /b %errorlevel%
)

echo.
echo 🔧 Fazendo build otimizado da aplicação...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro no build da aplicação
    pause
    exit /b %errorlevel%
)

echo ✅ Build da aplicação concluído

echo.
echo 📊 Analisando tamanho dos arquivos...
for /f %%i in ('dir /s /b dist\*.js ^| find /c /v ""') do echo   📄 Arquivos JS: %%i
for /f %%i in ('dir /s /b dist\*.css ^| find /c /v ""') do echo   🎨 Arquivos CSS: %%i
for /f %%i in ('dir /s /b dist\*.html ^| find /c /v ""') do echo   📝 Arquivos HTML: %%i

echo.
echo 🔧 Gerando executável otimizado...
call npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ❌ Erro na geração do executável. Tentando método alternativo...
    call npx electron-builder --win --config.forceCodeSigning=false
    if %errorlevel% neq 0 (
        echo ❌ Falha na geração do executável
        pause
        exit /b %errorlevel%
    )
)

echo.
echo ✅ Executável gerado com sucesso!
echo.
echo 📁 Arquivos criados em dist-electron/:
dir /b dist-electron\*.exe 2>nul
echo.

echo 📊 Informações do build:
echo   🎯 Versão: 2.0.0 Otimizada
echo   ⚡ Performance: Melhorada
echo   🧠 Memória: Otimizada
echo   📱 Interface: Modernizada
echo   🔒 Segurança: Aprimorada

echo.
echo 🎉 Build otimizado concluído!
echo 💡 Dicas:
echo   - Use a versão portable para demonstrações
echo   - Use o instalador para distribuição
echo   - Teste em diferentes resoluções
echo.
pause