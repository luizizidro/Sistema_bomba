# 📦 Como Gerar o Executável (.exe)

## 🚀 Instruções para Criar o Executável

### **Pré-requisitos:**
1. **Node.js** (versão 16 ou superior)
2. **npm** ou **yarn**
3. **Windows** (para gerar .exe)

### **Passos para Gerar o Executável:**

#### **1. Instalar Dependências**
```bash
npm install
```

#### **2. Gerar Executável para Windows**
```bash
npm run dist-win
```

Este comando irá:
- Fazer o build da aplicação web
- Criar o executável do Electron
- Gerar dois tipos de arquivo:
  - **Instalador NSIS** (.exe com instalador)
  - **Versão Portable** (.exe que roda direto)

#### **3. Localizar os Arquivos Gerados**
Os executáveis serão criados na pasta `dist-electron/`:
- `Sistema de Seleção de Bombas Setup 1.0.0.exe` (Instalador)
- `Sistema-Selecao-Bombas-Portable.exe` (Versão Portable)

### **📋 Tipos de Executável Gerados:**

#### **🔧 Instalador NSIS**
- Instala o programa no sistema
- Cria atalhos no desktop e menu iniciar
- Permite desinstalação pelo Painel de Controle
- Recomendado para distribuição profissional

#### **📱 Versão Portable**
- Executa diretamente sem instalação
- Ideal para uso em pendrives
- Não deixa rastros no sistema
- Perfeito para demonstrações

### **⚙️ Configurações do Executável:**

- **Nome**: Sistema de Seleção de Bombas
- **Versão**: 1.0.0
- **Arquitetura**: 64-bit (x64)
- **Tamanho**: ~150-200MB
- **Compatibilidade**: Windows 7/8/10/11

### **🎯 Recursos Incluídos:**

- ✅ Interface nativa do Windows
- ✅ Menu em português
- ✅ Ícone personalizado
- ✅ Atalhos de teclado
- ✅ Redimensionamento de janela
- ✅ Todas as funcionalidades do sistema web

### **🚨 Solução de Problemas:**

#### **Erro de Permissão:**
```bash
# Execute como Administrador no PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### **Antivírus Bloqueando:**
- Adicione exceção para a pasta do projeto
- Temporariamente desabilite o antivírus durante o build

#### **Erro de Dependências:**
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **📊 Comparação de Opções:**

| Característica | Instalador NSIS | Versão Portable |
|----------------|-----------------|-----------------|
| Instalação | Sim | Não |
| Atalhos | Sim | Não |
| Desinstalação | Sim | Manual |
| Portabilidade | Baixa | Alta |
| Uso Profissional | ✅ Recomendado | ⚠️ Limitado |
| Demonstrações | ⚠️ Complexo | ✅ Ideal |

### **🎉 Pronto para Usar!**

Após executar `npm run dist-win`, você terá:
1. Um instalador profissional para distribuição
2. Uma versão portable para uso imediato
3. Ambos com todas as funcionalidades do sistema

**Recomendação**: Use o instalador NSIS para distribuição profissional e a versão portable para testes e demonstrações.