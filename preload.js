const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script otimizado para segurança e performance
 */

// APIs expostas de forma segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Informações do sistema
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getPlatform: () => process.platform,
    
    // Performance e debugging
    getPerformanceInfo: () => ({
        memory: process.memoryUsage(),
        versions: process.versions,
        uptime: process.uptime()
    }),
    
    // Utilitários
    isElectron: true,
    isDevelopment: process.env.NODE_ENV === 'development'
});

// APIs de performance para monitoramento
contextBridge.exposeInMainWorld('performanceAPI', {
    // Marcar pontos de performance
    mark: (name) => {
        if (performance && performance.mark) {
            performance.mark(name);
        }
    },
    
    // Medir intervalos
    measure: (name, startMark, endMark) => {
        if (performance && performance.measure) {
            performance.measure(name, startMark, endMark);
        }
    },
    
    // Obter métricas
    getMetrics: () => {
        if (performance && performance.getEntriesByType) {
            return {
                marks: performance.getEntriesByType('mark'),
                measures: performance.getEntriesByType('measure'),
                navigation: performance.getEntriesByType('navigation')[0],
                memory: performance.memory || null
            };
        }
        return null;
    },
    
    // Limpar métricas
    clearMetrics: () => {
        if (performance && performance.clearMarks) {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }
});

// Console melhorado para debugging
contextBridge.exposeInMainWorld('debugAPI', {
    log: (...args) => {
        console.log('[RENDERER]', ...args);
    },
    
    error: (...args) => {
        console.error('[RENDERER ERROR]', ...args);
    },
    
    warn: (...args) => {
        console.warn('[RENDERER WARNING]', ...args);
    },
    
    info: (...args) => {
        console.info('[RENDERER INFO]', ...args);
    },
    
    // Informações de debug estruturadas
    debugInfo: () => {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
            } : null,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            }
        };
    }
});

// Event listeners para otimização
window.addEventListener('DOMContentLoaded', () => {
    // Marcar carregamento do DOM
    if (window.performanceAPI) {
        window.performanceAPI.mark('dom-content-loaded');
    }
    
    console.log('🔧 Preload: DOM carregado');
});

window.addEventListener('load', () => {
    // Marcar carregamento completo
    if (window.performanceAPI) {
        window.performanceAPI.mark('window-loaded');
        window.performanceAPI.measure('dom-to-load', 'dom-content-loaded', 'window-loaded');
    }
    
    console.log('✅ Preload: Janela carregada');
});

// Monitoramento de erros
window.addEventListener('error', (event) => {
    console.error('❌ Erro capturado pelo preload:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada capturada pelo preload:', event.reason);
});

// Otimizações de performance
document.addEventListener('DOMContentLoaded', () => {
    // Configurar observer para lazy loading de imagens
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        // Observar imagens com data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Configurar prefetch para recursos críticos
    const prefetchResources = [
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'
    ];
    
    prefetchResources.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
});

console.log('🔧 Preload script carregado com otimizações');