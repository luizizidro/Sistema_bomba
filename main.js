const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Configuração de segurança
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');

let mainWindow;

/**
 * Cria a janela principal otimizada
 */
function createWindow() {
    console.log('🚀 Criando janela principal...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
            allowRunningInsecureContent: true,
            experimentalFeatures: true
        },
        
        // Otimizações visuais
        show: false,
        titleBarStyle: 'default',
        autoHideMenuBar: false,
        backgroundColor: '#667eea',
        
        // Ícone da aplicação
        icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png')
    });

    // Carregar aplicação
    if (isDev) {
        console.log('🔧 Modo desenvolvimento - carregando de localhost');
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        console.log('📦 Modo produção - carregando arquivo local');
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }

    // Otimizações de performance
    mainWindow.webContents.on('dom-ready', () => {
        console.log('✅ DOM carregado');
        
        // Injetar otimizações de performance
        mainWindow.webContents.executeJavaScript(`
            // Configurações de performance
            if (window.performance && window.performance.mark) {
                window.performance.mark('electron-dom-ready');
            }
            
            // Configurar console para debug
            console.log('🔍 Electron DOM Ready - Performance:', {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
                } : 'N/A',
                timing: performance.timing ? {
                    load: performance.timing.loadEventEnd - performance.timing.navigationStart + 'ms'
                } : 'N/A'
            });
        `);
    });

    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        console.log('👁️ Janela pronta para exibição');
        mainWindow.show();
        mainWindow.focus();
        
        // Otimizar após carregamento
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(`
                    // Limpeza inicial de memória
                    if (window.gc) window.gc();
                    console.log('🧹 Limpeza inicial de memória executada');
                `);
            }
        }, 2000);
    });

    // Interceptar erros de carregamento
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('❌ Erro ao carregar:', {
            code: errorCode,
            description: errorDescription,
            url: validatedURL
        });
    });

    // Log de carregamento concluído
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ Carregamento concluído');
        
        // Verificações pós-carregamento
        mainWindow.webContents.executeJavaScript(`
            console.log('🔍 Verificações pós-carregamento:', {
                chartJs: typeof Chart !== 'undefined',
                canvas: !!document.getElementById('pumpChart'),
                systemInit: typeof window.initializeSystem === 'function'
            });
        `).catch(err => console.error('Erro na verificação:', err));
    });

    // Criar menu otimizado
    createOptimizedMenu();

    // Configurar navegação segura
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Configurar zoom
    mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
        const currentZoom = mainWindow.webContents.getZoomFactor();
        if (zoomDirection === 'in') {
            mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 2.0));
        } else {
            mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
        }
    });
}

/**
 * Cria menu otimizado em português
 */
function createOptimizedMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Novo Cálculo',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('if(window.clearAll) window.clearAll();');
                    }
                },
                {
                    label: 'Exportar Gráfico',
                    accelerator: 'CmdOrCtrl+E',
                    click: async () => {
                        try {
                            const result = await dialog.showSaveDialog(mainWindow, {
                                defaultPath: 'curvas-bomba.png',
                                filters: [
                                    { name: 'Imagens PNG', extensions: ['png'] },
                                    { name: 'Todos os arquivos', extensions: ['*'] }
                                ]
                            });
                            
                            if (!result.canceled) {
                                mainWindow.webContents.executeJavaScript(`
                                    const canvas = document.getElementById('pumpChart');
                                    if (canvas) {
                                        const link = document.createElement('a');
                                        link.download = '${path.basename(result.filePath)}';
                                        link.href = canvas.toDataURL();
                                        link.click();
                                    }
                                `);
                            }
                        } catch (error) {
                            console.error('Erro ao exportar:', error);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Recarregar',
                    accelerator: 'F5',
                    click: () => mainWindow.reload()
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => app.quit()
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
                { role: 'togglefullscreen', label: 'Tela Cheia' },
                { type: 'separator' },
                {
                    label: 'Otimizar Performance',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
                            if (window.cleanupMemory) {
                                window.cleanupMemory();
                                console.log('🚀 Performance otimizada via menu');
                            }
                        `);
                    }
                }
            ]
        },
        {
            label: 'Ferramentas',
            submenu: [
                {
                    label: 'Limpar Cache',
                    click: () => {
                        mainWindow.webContents.session.clearCache();
                        console.log('🗑️ Cache limpo');
                    }
                },
                {
                    label: 'Informações de Performance',
                    click: () => {
                        mainWindow.webContents.executeJavaScript(`
                            const info = {
                                memory: performance.memory ? {
                                    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                                    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
                                } : 'N/A',
                                timing: performance.timing ? {
                                    load: performance.timing.loadEventEnd - performance.timing.navigationStart + 'ms'
                                } : 'N/A',
                                chartLoaded: typeof Chart !== 'undefined',
                                systemReady: typeof window.initializeSystem === 'function'
                            };
                            alert('Performance Info:\\n' + JSON.stringify(info, null, 2));
                        `);
                    }
                }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre o Sistema',
                    click: async () => {
                        await dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre o Sistema',
                            message: 'Sistema de Seleção de Bombas',
                            detail: `Versão 2.0.0 - Otimizado

Sistema avançado para análise e seleção de bombas centrífugas.

Características:
• Interface moderna e responsiva
• Gráficos interativos de alta performance
• Cálculos precisos com interpolação otimizada
• Cache inteligente para melhor performance
• Suporte a múltiplos modelos de bombas

Desenvolvido com:
• Electron ${process.versions.electron}
• Node.js ${process.versions.node}
• Chrome ${process.versions.chrome}
• Chart.js 4.4.1

© 2024 Sistema de Bombas`,
                            buttons: ['OK']
                        });
                    }
                },
                {
                    label: 'Atalhos do Teclado',
                    click: async () => {
                        await dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Atalhos do Teclado',
                            message: 'Atalhos Disponíveis',
                            detail: `Arquivo:
Ctrl+N - Novo Cálculo
Ctrl+E - Exportar Gráfico
F5 - Recarregar
Ctrl+Q - Sair

Visualização:
Ctrl+0 - Zoom Normal
Ctrl++ - Aumentar Zoom
Ctrl+- - Diminuir Zoom
F11 - Tela Cheia

Edição:
Ctrl+Z - Desfazer
Ctrl+Y - Refazer
Ctrl+C - Copiar
Ctrl+V - Colar
Ctrl+A - Selecionar Tudo

Navegação:
Enter - Calcular (nos campos de entrada)
Tab - Navegar entre campos`,
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

/**
 * Configurações de inicialização do app
 */
app.whenReady().then(() => {
    console.log('🎉 Electron pronto, criando janela...');
    createWindow();

    // Configurar protocolo personalizado se necessário
    app.setAsDefaultProtocolClient('pump-selector');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Sair quando todas as janelas estiverem fechadas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Configurações de segurança
app.on('web-contents-created', (event, contents) => {
    // Prevenir navegação para URLs externas
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    // Prevenir abertura de novas janelas
    contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
});

// Otimizações de performance
app.on('browser-window-created', (event, window) => {
    // Configurar otimizações por janela
    window.webContents.on('did-finish-load', () => {
        // Configurar garbage collection automático
        setInterval(() => {
            if (!window.isDestroyed()) {
                window.webContents.executeJavaScript(`
                    if (window.gc) {
                        window.gc();
                    }
                `).catch(() => {
                    // Ignorar erros se a janela foi fechada
                });
            }
        }, 5 * 60 * 1000); // A cada 5 minutos
    });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});

// IPC handlers para comunicação com o renderer
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-system-info', () => {
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome
    };
});

// Exportar para testes
module.exports = { createWindow };