const { contextBridge } = require('electron');

// Expor APIs protegidas para o contexto do renderizador
contextBridge.exposeInMainWorld('electronAPI', {
  // Adicione aqui funções que precisam ser acessadas pelo frontend
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform
});