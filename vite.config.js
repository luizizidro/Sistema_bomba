import { defineConfig } from 'vite';

export default defineConfig({
  // Configurações de build otimizadas
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    // Otimizações de bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Chart.js em chunk próprio para cache
          'chart': ['chart.js']
        },
        // Nomes de arquivo com hash para cache
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Configurações do Terser para minificação
    terserOptions: {
      compress: {
        drop_console: false, // Manter console.log para debug
        drop_debugger: true,
        pure_funcs: ['console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Limite de aviso de tamanho
    chunkSizeWarningLimit: 1000
  },
  
  // Configurações do servidor de desenvolvimento
  server: {
    port: 5173,
    host: true,
    open: false,
    cors: true,
    
    // Headers de segurança
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Configurações de preview
  preview: {
    port: 4173,
    host: true
  },
  
  // Otimizações de dependências
  optimizeDeps: {
    include: ['chart.js'],
    exclude: []
  },
  
  // Configurações de CSS
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Configurações de assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico'],
  
  // Base path para produção
  base: './',
  
  // Configurações de worker
  worker: {
    format: 'es'
  },
  
  // Configurações experimentais
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `"./${filename}"` };
      } else {
        return { relative: true };
      }
    }
  },
  
  // Plugin personalizado para otimizações
  plugins: [
    {
      name: 'pump-system-optimizer',
      generateBundle(options, bundle) {
        // Log de informações do bundle
        console.log('📦 Bundle gerado com otimizações:');
        Object.keys(bundle).forEach(fileName => {
          const file = bundle[fileName];
          if (file.type === 'chunk') {
            console.log(`  📄 ${fileName}: ${Math.round(file.code.length / 1024)}KB`);
          } else if (file.type === 'asset') {
            console.log(`  🖼️ ${fileName}: ${Math.round(file.source.length / 1024)}KB`);
          }
        });
      }
    }
  ],
  
  // Configurações de resolução
  resolve: {
    alias: {
      '@': '/src',
      '@utils': '/src/utils',
      '@components': '/src/components',
      '@data': '/src/data',
      '@styles': '/src/styles'
    }
  },
  
  // Configurações de definição global
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});