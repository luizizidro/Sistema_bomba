# 🚀 Como Gerar o Executável (.exe)

## ✅ Solução Simples e Rápida

### **Opção 1: Usar o Arquivo .bat (RECOMENDADO)**
1. **Clique duas vezes** no arquivo `build-windows.bat`
2. **Aguarde** o processo terminar
3. **Pronto!** Os executáveis estarão em `dist-electron/`

### **Opção 2: Comandos no Terminal**
```bash
# 1. Fazer build da aplicação
npm run build-only

# 2. Gerar executável
npm run dist-win
```

### **Opção 3: Comando Único**
```bash
npm run dist-win
```

## 📁 Arquivos Gerados

Após o build, você encontrará em `dist-electron/`:

1. **`Sistema de Seleção de Bombas Setup 1.0.0.exe`**
   - Instalador completo
   - Cria atalhos no desktop e menu iniciar
   - Recomendado para distribuição

2. **`Sistema-Selecao-Bombas-Portable.exe`**
   - Versão portátil (não precisa instalar)
   - Ideal para demonstrações
   - Funciona direto do pendrive

## 🔧 Se Der Erro

### **Erro de Permissão:**
Execute o PowerShell como **Administrador** e rode:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Antivírus Bloqueando:**
- Adicione exceção para a pasta do projeto
- Temporariamente desabilite durante o build

### **Dependências Faltando:**
```bash
npm install
```

## ✨ Pronto!

Agora você tem dois executáveis:
- **Instalador**: Para distribuição profissional
- **Portable**: Para uso imediato e demonstrações

**Tamanho**: ~150-200MB cada
**Compatibilidade**: Windows 7/8/10/11 (64-bit)