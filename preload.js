const { contextBridge } = require('electron');

// Expor APIs protegidas para o contexto do renderizador
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações do sistema
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
  getAppVersion: () => require('./package.json').version
});