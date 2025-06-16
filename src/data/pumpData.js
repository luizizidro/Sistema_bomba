/**
 * Dados das Bombas Otimizados
 */

import { optimizedLinspace } from '../utils/performance.js';

// Cache para curvas geradas
const curveCache = new Map();

/**
 * Gera curva de rendimento otimizada
 */
function generateEfficiencyCurve(flowData, bepFlow, maxEfficiency) {
    const cacheKey = `eff_${bepFlow}_${maxEfficiency}_${flowData.length}`;
    
    if (curveCache.has(cacheKey)) {
        return curveCache.get(cacheKey);
    }

    const result = flowData.map(flow => {
        const normalizedFlow = flow / bepFlow;
        const efficiency = maxEfficiency * (1 - 0.8 * Math.pow(normalizedFlow - 1, 2));
        return Math.max(0, Math.min(efficiency, maxEfficiency));
    });
    
    curveCache.set(cacheKey, result);
    return result;
}

/**
 * Configuração otimizada das bombas
 */
export const pumpData = {
    "BC-21 R 1/2 (3 CV)": {
        potencia_cv: 3,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 57.05,
        
        // Lazy loading para dados pesados
        _vazaoData: null,
        get vazao_data() {
            if (!this._vazaoData) {
                this._vazaoData = optimizedLinspace(0, 42, 80); // Reduzido de 100 para 80 pontos
            }
            return this._vazaoData;
        },
        
        _alturaData: null,
        get altura_data() {
            if (!this._alturaData) {
                this._alturaData = this.vazao_data.map(q => {
                    const h0 = 32;
                    const qMax = 45;
                    return h0 * (1 - Math.pow(q / qMax, 1.8));
                });
            }
            return this._alturaData;
        },
        
        _potenciaData: null,
        get potencia_data() {
            if (!this._potenciaData) {
                this._potenciaData = this.vazao_data.map(q => {
                    const p0 = 0.8;
                    return p0 + (q / 42) * 2.2 + 0.001 * q * q;
                });
            }
            return this._potenciaData;
        },
        
        _npshCurva: null,
        get npsh_curva() {
            if (!this._npshCurva) {
                this._npshCurva = this.vazao_data.map(q => 1.5 + (q / 42) * 2.5 + 0.0008 * q * q);
            }
            return this._npshCurva;
        },
        
        _rendimentoCurva: null,
        get rendimento_curva() {
            if (!this._rendimentoCurva) {
                this._rendimentoCurva = generateEfficiencyCurve(this.vazao_data, 25, 57.05);
            }
            return this._rendimentoCurva;
        }
    },
    
    "BC-21 R 1/2 (4 CV)": {
        potencia_cv: 4,
        rotacao_rpm: 3500,
        npsh_mca: 2.87,
        rendimento_percent: 54.68,
        
        _vazaoData: null,
        get vazao_data() {
            if (!this._vazaoData) {
                this._vazaoData = optimizedLinspace(0, 50, 80);
            }
            return this._vazaoData;
        },
        
        _alturaData: null,
        get altura_data() {
            if (!this._alturaData) {
                this._alturaData = this.vazao_data.map(q => {
                    const h0 = 42;
                    const qMax = 55;
                    return h0 * (1 - Math.pow(q / qMax, 1.8));
                });
            }
            return this._alturaData;
        },
        
        _potenciaData: null,
        get potencia_data() {
            if (!this._potenciaData) {
                this._potenciaData = this.vazao_data.map(q => {
                    const p0 = 1.2;
                    return p0 + (q / 50) * 2.8 + 0.0008 * q * q;
                });
            }
            return this._potenciaData;
        },
        
        _npshCurva: null,
        get npsh_curva() {
            if (!this._npshCurva) {
                this._npshCurva = this.vazao_data.map(q => 1.8 + (q / 50) * 2.2 + 0.0006 * q * q);
            }
            return this._npshCurva;
        },
        
        _rendimentoCurva: null,
        get rendimento_curva() {
            if (!this._rendimentoCurva) {
                this._rendimentoCurva = generateEfficiencyCurve(this.vazao_data, 30, 54.68);
            }
            return this._rendimentoCurva;
        }
    },
    
    "Bomba Trabalho": {
        potencia_cv: 46.5,
        rotacao_rpm: 1700,
        npsh_mca: 25,
        rendimento_percent: 75,
        
        _vazaoData: null,
        get vazao_data() {
            if (!this._vazaoData) {
                this._vazaoData = optimizedLinspace(0, 500, 100); // Mantido 100 pontos para maior precisão
            }
            return this._vazaoData;
        },
        
        _alturaData: null,
        get altura_data() {
            if (!this._alturaData) {
                this._alturaData = this.vazao_data.map(q => {
                    const h0 = 200;
                    const hFinal = -10;
                    const qMax = 500;
                    const normalizedQ = q / qMax;
                    return h0 + (hFinal - h0) * Math.pow(normalizedQ, 1.5);
                });
            }
            return this._alturaData;
        },
        
        _potenciaData: null,
        get potencia_data() {
            if (!this._potenciaData) {
                this._potenciaData = this.vazao_data.map(q => {
                    const p0 = 12;
                    const pMax = 46.5;
                    const qMax = 500;
                    const normalizedQ = q / qMax;
                    return p0 + (pMax - p0) * (0.3 * normalizedQ + 0.7 * normalizedQ * normalizedQ);
                });
            }
            return this._potenciaData;
        },
        
        _npshCurva: null,
        get npsh_curva() {
            if (!this._npshCurva) {
                this._npshCurva = this.vazao_data.map(q => {
                    const npshMin = 15;
                    const npshMax = 25;
                    const qPico = 300;
                    const qMax = 500;
                    
                    if (q <= qPico) {
                        const normalizedQ = q / qPico;
                        return npshMin + (npshMax - npshMin) * (0.4 * normalizedQ + 0.6 * normalizedQ * normalizedQ);
                    } else {
                        const normalizedQ = (q - qPico) / (qMax - qPico);
                        const decrescimento = 0.3 * normalizedQ + 0.2 * normalizedQ * normalizedQ;
                        return npshMax - 3 * decrescimento;
                    }
                });
            }
            return this._npshCurva;
        },
        
        _rendimentoCurva: null,
        get rendimento_curva() {
            if (!this._rendimentoCurva) {
                this._rendimentoCurva = generateEfficiencyCurve(this.vazao_data, 300, 75);
            }
            return this._rendimentoCurva;
        }
    }
};

/**
 * Limpa cache de curvas
 */
export function clearCurveCache() {
    curveCache.clear();
    
    // Limpa dados lazy-loaded
    Object.values(pumpData).forEach(pump => {
        pump._vazaoData = null;
        pump._alturaData = null;
        pump._potenciaData = null;
        pump._npshCurva = null;
        pump._rendimentoCurva = null;
    });
    
    console.log('🗑️ Cache de curvas limpo');
}