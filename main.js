const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Criar a janela do navegador
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Permitir carregamento de recursos externos
      allowRunningInsecureContent: true
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Carregar o app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Abrir DevTools em desenvolvimento
    mainWindow.webContents.openDevTools();
  } else {
    // Carregar arquivo local com protocolo file://
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    // Debug: verificar se os arquivos estão sendo carregados
    console.log('🔍 Verificando arquivos...');
    console.log('📁 Diretório atual:', __dirname);
    console.log('📄 Arquivo HTML:', path.join(__dirname, 'dist', 'index.html'));
  });

  // Interceptar erros de carregamento
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Erro ao carregar:', errorDescription, validatedURL);
  });

  // Log quando a página terminar de carregar
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página carregada com sucesso');
    
    // Injetar verificação de Chart.js
    mainWindow.webContents.executeJavaScript(`
      console.log('🔍 Verificando Chart.js:', typeof Chart);
      console.log('🔍 Verificando elementos:', {
        canvas: !!document.getElementById('pumpChart'),
        select: !!document.getElementById('pumpSelect'),
        powerInfo: !!document.getElementById('powerInfo')
      });
    `).catch(err => console.error('Erro ao executar JavaScript:', err));
  });

  // Criar menu personalizado
  createMenu();

  // Prevenir navegação externa
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'F5',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectall', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o Sistema',
          click: async () => {
            const { dialog } = require('electron');
            await dialog.showMessageBox({
              type: 'info',
              title: 'Sobre o Sistema',
              message: 'Sistema de Seleção de Bombas',
              detail: 'Versão 1.0.0\n\nSistema para análise e seleção de bombas centrífugas.\n\nDesenvolvido com Electron e Chart.js\n\nPermite cálculo de pontos de operação e visualização de curvas características.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método será chamado quando o Electron tiver terminado
// a inicialização e estiver pronto para criar janelas do navegador.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // No macOS, é comum recriar uma janela no app quando o
    // ícone do dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Sair quando todas as janelas estiverem fechadas, exceto no macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Configurações de segurança
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});