/**
 * Utilitários de Performance e Otimização
 */

// Cache para dados computados
const computeCache = new Map();
const CACHE_SIZE_LIMIT = 100;

/**
 * Sistema de cache com LRU (Least Recently Used)
 */
class LRUCache {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (this.cache.has(key)) {
            // Move para o final (mais recente)
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        return null;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove o mais antigo
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Cache global para interpolações
const interpolationCache = new LRUCache(200);

/**
 * Debounce para otimizar eventos frequentes
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para limitar execuções
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Interpolação otimizada com cache
 */
export function optimizedInterp(x, xp, fp) {
    const cacheKey = `${x}_${xp.length}_${xp[0]}_${xp[xp.length-1]}`;
    
    const cached = interpolationCache.get(cacheKey);
    if (cached !== null) {
        return cached;
    }

    let result;
    
    if (x <= xp[0]) {
        result = fp[0];
    } else if (x >= xp[xp.length - 1]) {
        result = fp[fp.length - 1];
    } else {
        // Busca binária para arrays grandes
        if (xp.length > 20) {
            let left = 0;
            let right = xp.length - 1;
            
            while (right - left > 1) {
                const mid = Math.floor((left + right) / 2);
                if (xp[mid] <= x) {
                    left = mid;
                } else {
                    right = mid;
                }
            }
            
            const t = (x - xp[left]) / (xp[right] - xp[left]);
            result = fp[left] + t * (fp[right] - fp[left]);
        } else {
            // Busca linear para arrays pequenos
            for (let i = 0; i < xp.length - 1; i++) {
                if (x >= xp[i] && x <= xp[i + 1]) {
                    const t = (x - xp[i]) / (xp[i + 1] - xp[i]);
                    result = fp[i] + t * (fp[i + 1] - fp[i]);
                    break;
                }
            }
        }
    }
    
    interpolationCache.set(cacheKey, result);
    return result;
}

/**
 * Gerador de dados otimizado
 */
export function optimizedLinspace(start, stop, num) {
    const cacheKey = `linspace_${start}_${stop}_${num}`;
    
    const cached = computeCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const step = (stop - start) / (num - 1);
    const result = new Float32Array(num); // Usa Float32Array para melhor performance
    
    for (let i = 0; i < num; i++) {
        result[i] = start + step * i;
    }
    
    // Limita o tamanho do cache
    if (computeCache.size >= CACHE_SIZE_LIMIT) {
        const firstKey = computeCache.keys().next().value;
        computeCache.delete(firstKey);
    }
    
    computeCache.set(cacheKey, Array.from(result));
    return Array.from(result);
}

/**
 * Monitor de performance
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    start(label) {
        this.metrics.set(label, performance.now());
    }

    end(label) {
        const startTime = this.metrics.get(label);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            this.metrics.delete(label);
            return duration;
        }
        return 0;
    }

    measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    }
}

/**
 * Otimizador de memória
 */
export function cleanupMemory() {
    // Limpa caches
    computeCache.clear();
    interpolationCache.clear();
    
    // Force garbage collection se disponível
    if (window.gc) {
        window.gc();
    }
    
    console.log('🧹 Memória limpa');
}

/**
 * Lazy loading para dados pesados
 */
export function createLazyLoader(dataFactory) {
    let data = null;
    let loading = false;
    
    return async function() {
        if (data) return data;
        
        if (loading) {
            // Aguarda carregamento em andamento
            while (loading) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            return data;
        }
        
        loading = true;
        try {
            data = await dataFactory();
            return data;
        } finally {
            loading = false;
        }
    };
}

// Instância global do monitor
export const perfMonitor = new PerformanceMonitor();