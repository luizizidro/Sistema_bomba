# 📦 Como Criar um Executável do Sistema de Seleção de Bombas

## 🚀 Opções Disponíveis

### **1. Electron (Recomendado) - Desktop Nativo**

O Electron permite criar aplicações desktop nativas para Windows, macOS e Linux.

#### **Instalação das Dependências:**
```bash
npm install
```

#### **Comandos Disponíveis:**

**Desenvolvimento:**
```bash
npm run electron-dev
```
- Executa o app em modo desenvolvimento
- Hot reload ativado
- DevTools disponível

**Build para Produção:**
```bash
npm run build-electron
```
- Cria executável para o sistema atual

**Distribuição:**
```bash
npm run dist
```
- Cria instaladores para distribuição

#### **Executáveis Gerados:**
- **Windows**: `.exe` + instalador NSIS
- **macOS**: `.dmg` 
- **Linux**: `.AppImage`

---

### **2. PWA (Progressive Web App)**

Transformar em PWA permite instalação via navegador.

#### **Vantagens:**
- ✅ Funciona offline
- ✅ Instalável via navegador
- ✅ Atualizações automáticas
- ✅ Menor tamanho

#### **Como Usar:**
1. Acesse o site
2. Clique em "Instalar" no navegador
3. App fica disponível como nativo

---

### **3. Tauri (Alternativa Leve)**

Framework Rust para apps desktop mais leves que Electron.

#### **Instalação:**
```bash
npm install --save-dev @tauri-apps/cli
```

#### **Configuração:**
```bash
npx tauri init
```

---

## 🔧 **Configuração Detalhada - Electron**

### **Estrutura de Arquivos:**
```
projeto/
├── main.js          # Processo principal do Electron
├── preload.js       # Script de pré-carregamento
├── package.json     # Configurações e dependências
├── dist/           # Build da aplicação web
└── dist-electron/  # Executáveis gerados
```

### **Recursos Incluídos:**
- 🖼️ **Ícone personalizado** (adicione em `assets/`)
- 📋 **Menu nativo** em português
- 🔧 **DevTools** em desenvolvimento
- 📱 **Responsivo** e redimensionável
- 🚀 **Auto-updater** (configurável)

### **Personalização do Ícone:**

Crie a pasta `assets/` e adicione:
- `icon.ico` (Windows - 256x256)
- `icon.icns` (macOS)
- `icon.png` (Linux - 512x512)

### **Build para Diferentes Plataformas:**

**Windows (no Windows):**
```bash
npm run dist -- --win
```

**macOS (no macOS):**
```bash
npm run dist -- --mac
```

**Linux (no Linux):**
```bash
npm run dist -- --linux
```

**Todos (cross-platform):**
```bash
npm run dist -- --win --mac --linux
```

---

## 📋 **Checklist de Preparação**

### **Antes de Gerar o Executável:**

- [ ] Testar aplicação web (`npm run build`)
- [ ] Criar ícones nas resoluções corretas
- [ ] Configurar informações do app no `package.json`
- [ ] Testar em modo desenvolvimento (`npm run electron-dev`)
- [ ] Verificar se todas as funcionalidades funcionam
- [ ] Configurar certificado de código (opcional, para Windows)

### **Informações do App (package.json):**
```json
{
  "name": "pump-selector-system",
  "productName": "Sistema de Seleção de Bombas",
  "version": "1.0.0",
  "description": "Sistema para análise e seleção de bombas centrífugas",
  "author": "Seu Nome <email@exemplo.com>",
  "homepage": "https://seusite.com"
}
```

---

## 🎯 **Recomendação Final**

**Para uso profissional**: Use **Electron** - oferece máxima compatibilidade e recursos nativos.

**Para distribuição web**: Configure como **PWA** - mais leve e fácil de atualizar.

**Para máxima performance**: Considere **Tauri** - menor consumo de recursos.

---

## 🚨 **Solução de Problemas**

### **Erro de Permissão (Windows):**
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Erro de Certificado (macOS):**
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

### **Dependências Nativas:**
Se usar bibliotecas nativas, configure o `electron-rebuild`:
```bash
npm install --save-dev electron-rebuild
```

---

## 📞 **Suporte**

Para problemas específicos:
1. Verifique os logs no console
2. Teste primeiro em modo desenvolvimento
3. Consulte documentação oficial do Electron
4. Verifique compatibilidade do sistema operacional

**Documentação Oficial**: https://www.electronjs.org/docs