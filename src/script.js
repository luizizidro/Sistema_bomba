/**
 * Sistema de Seleção de Bombas - Versão Otimizada
 */

import { optimizedInterp, debounce, perfMonitor, cleanupMemory } from './utils/performance.js';
import { pumpData, clearCurveCache } from './data/pumpData.js';
import { ChartManager } from './components/ChartManager.js';

// Instâncias globais
let chartManager;
let isSystemInitialized = false;

// Debounced functions para otimizar interações
const debouncedCalculate = debounce(calculateOperatingPoint, 300);
const debouncedPumpSelect = debounce(onPumpSelect, 200);

/**
 * Inicialização principal do sistema
 */
async function initializeSystem() {
    console.log('🚀 Inicializando sistema otimizado...');
    
    if (isSystemInitialized) {
        console.log('⚠️ Sistema já inicializado');
        return true;
    }
    
    perfMonitor.start('system-init');
    
    try {
        // Verificar dependências
        if (typeof Chart === 'undefined' || !Chart.Chart) {
            console.error('❌ Chart.js não disponível');
            showStatus("Erro: Biblioteca de gráficos não carregada.", "error");
            return false;
        }
        
        // Inicializar gerenciador de gráficos
        chartManager = new ChartManager();
        
        const canvas = document.getElementById('pumpChart');
        if (!canvas) {
            console.error('❌ Canvas não encontrado');
            showStatus("Erro: Elemento de gráfico não encontrado.", "error");
            return false;
        }
        
        // Inicializar gráfico
        const chartInitialized = await chartManager.initialize(canvas);
        if (!chartInitialized) {
            showStatus("Erro: Falha na inicialização do gráfico.", "error");
            return false;
        }
        
        // Configurar observador de redimensionamento
        chartManager.observeResize(canvas.parentElement);
        
        // Configurar event listeners otimizados
        setupEventListeners();
        
        // Configurar limpeza automática de memória
        setupMemoryManagement();
        
        // Inicializar com primeira bomba
        setTimeout(() => {
            onPumpSelect();
            isSystemInitialized = true;
            perfMonitor.end('system-init');
            console.log('🎉 Sistema inicializado com sucesso!');
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showStatus("Erro: Falha na inicialização do sistema.", "error");
        perfMonitor.end('system-init');
        return false;
    }
}

/**
 * Configuração otimizada de event listeners
 */
function setupEventListeners() {
    const pumpSelect = document.getElementById('pumpSelect');
    const flowInput = document.getElementById('flowInput');
    const headInput = document.getElementById('headInput');
    
    if (pumpSelect) {
        pumpSelect.removeEventListener('change', debouncedPumpSelect);
        pumpSelect.addEventListener('change', debouncedPumpSelect);
    }
    
    // Event listeners para inputs com validação em tempo real
    if (flowInput) {
        flowInput.addEventListener('input', debounce(validateFlowInput, 500));
        flowInput.addEventListener('keypress', handleEnterKey);
    }
    
    if (headInput) {
        headInput.addEventListener('input', debounce(validateHeadInput, 500));
        headInput.addEventListener('keypress', handleEnterKey);
    }
    
    // Listener para visibilidade da página (otimização de performance)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    console.log('✅ Event listeners configurados');
}

/**
 * Gerenciamento automático de memória
 */
function setupMemoryManagement() {
    // Limpeza automática a cada 5 minutos
    setInterval(() => {
        if (!document.hidden) {
            cleanupMemory();
        }
    }, 5 * 60 * 1000);
    
    // Limpeza ao sair da página
    window.addEventListener('beforeunload', () => {
        if (chartManager) {
            chartManager.destroy();
        }
        cleanupMemory();
    });
}

/**
 * Manipula mudanças de visibilidade para otimizar performance
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // Página não visível - reduzir atividade
        console.log('📴 Página oculta - reduzindo atividade');
    } else {
        // Página visível - retomar atividade normal
        console.log('👁️ Página visível - retomando atividade');
    }
}

/**
 * Validação em tempo real para vazão
 */
function validateFlowInput(event) {
    const value = parseFloat(event.target.value);
    const pumpSelect = document.getElementById('pumpSelect');
    
    if (!isNaN(value) && pumpSelect) {
        const selectedPump = pumpSelect.value;
        const data = pumpData[selectedPump];
        const maxFlow = Math.max(...data.vazao_data);
        
        if (value > maxFlow * 1.2) {
            event.target.style.borderColor = '#e74c3c';
            showStatus(`Aviso: Vazão muito alta (máx. recomendado: ${maxFlow.toFixed(1)} m³/h)`, "warning");
        } else {
            event.target.style.borderColor = '#27ae60';
            clearStatus();
        }
    }
}

/**
 * Validação em tempo real para altura
 */
function validateHeadInput(event) {
    const value = parseFloat(event.target.value);
    const pumpSelect = document.getElementById('pumpSelect');
    
    if (!isNaN(value) && pumpSelect) {
        const selectedPump = pumpSelect.value;
        const data = pumpData[selectedPump];
        const maxHead = Math.max(...data.altura_data);
        
        if (value > maxHead * 1.2) {
            event.target.style.borderColor = '#e74c3c';
            showStatus(`Aviso: Altura muito alta (máx. recomendado: ${maxHead.toFixed(1)} m)`, "warning");
        } else {
            event.target.style.borderColor = '#27ae60';
            clearStatus();
        }
    }
}

/**
 * Manipula tecla Enter nos inputs
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        debouncedCalculate();
    }
}

/**
 * Seleção de bomba otimizada
 */
function onPumpSelect() {
    if (!isSystemInitialized || !chartManager) {
        console.log('⏳ Aguardando inicialização...');
        setTimeout(onPumpSelect, 500);
        return;
    }
    
    perfMonitor.start('pump-select');
    
    clearResults();
    const pumpSelect = document.getElementById('pumpSelect');
    
    if (!pumpSelect) {
        console.error('❌ Select da bomba não encontrado');
        return;
    }
    
    const selectedPump = pumpSelect.value;
    const data = pumpData[selectedPump];
    
    if (!data) {
        console.error('❌ Dados da bomba não encontrados:', selectedPump);
        return;
    }
    
    console.log('📊 Bomba selecionada:', selectedPump);
    
    // Atualizar informações da bomba
    updatePumpInfo(data);
    
    // Atualizar gráfico
    chartManager.updateCurves(data);
    
    // Limpar validações visuais
    resetInputStyles();
    
    perfMonitor.end('pump-select');
}

/**
 * Atualização otimizada das informações da bomba
 */
function updatePumpInfo(data) {
    const elements = {
        powerInfo: document.getElementById('powerInfo'),
        rotationInfo: document.getElementById('rotationInfo'),
        npshInfo: document.getElementById('npshInfo'),
        efficiencyInfo: document.getElementById('efficiencyInfo')
    };
    
    try {
        if (elements.powerInfo) {
            elements.powerInfo.textContent = `${data.potencia_cv} CV`;
        }
        if (elements.rotationInfo) {
            elements.rotationInfo.textContent = `${data.rotacao_rpm} rpm`;
        }
        if (elements.npshInfo) {
            elements.npshInfo.textContent = `${data.npsh_mca} mca`;
        }
        if (elements.efficiencyInfo) {
            elements.efficiencyInfo.textContent = `${data.rendimento_percent}%`;
        }
        
        console.log('✅ Informações da bomba atualizadas');
    } catch (error) {
        console.error('❌ Erro ao atualizar informações:', error);
    }
}

/**
 * Cálculo otimizado do ponto de operação
 */
function calculateOperatingPoint() {
    if (!isSystemInitialized || !chartManager) {
        showStatus("Erro: Sistema não inicializado.", "error");
        return;
    }
    
    perfMonitor.start('calculate-point');
    
    const flowInput = document.getElementById('flowInput');
    const headInput = document.getElementById('headInput');
    const pumpSelect = document.getElementById('pumpSelect');
    
    if (!flowInput || !headInput || !pumpSelect) {
        showStatus("Erro: Elementos de interface não encontrados.", "error");
        return;
    }
    
    if (flowInput.value === '' || headInput.value === '') {
        showStatus("Erro: Insira valores para vazão e altura.", "error");
        return;
    }
    
    try {
        const flowVal = parseFloat(flowInput.value);
        const headVal = parseFloat(headInput.value);
        const selectedPump = pumpSelect.value;
        const data = pumpData[selectedPump];
        
        if (isNaN(flowVal) || isNaN(headVal)) {
            showStatus("Erro: Valores inválidos inseridos.", "error");
            return;
        }
        
        // Validações otimizadas
        const validationResult = validateOperatingPoint(flowVal, headVal, selectedPump, data);
        if (!validationResult.isValid) {
            showStatus(validationResult.message, "error");
            return;
        }
        
        // Cálculos otimizados com interpolação melhorada
        const calculations = performOptimizedCalculations(flowVal, headVal, data);
        
        // Atualizar display
        chartManager.addOperatingPoints(
            flowVal, headVal, calculations.headFromCurve,
            calculations.powerFromCurve, calculations.npshFromCurve,
            calculations.effFromCurve
        );
        
        updateResultsDisplay(flowVal, headVal, calculations);
        
        // Mostrar status baseado nas validações
        if (validationResult.warnings.length > 0) {
            showStatus("Aviso: " + validationResult.warnings.join(" "), "warning");
        } else {
            showStatus("Ponto de operação calculado com sucesso.", "success");
        }
        
        perfMonitor.end('calculate-point');
        
    } catch (error) {
        console.error("❌ Erro no cálculo:", error);
        showStatus("Erro: Falha no cálculo do ponto de operação.", "error");
        perfMonitor.end('calculate-point');
    }
}

/**
 * Validação otimizada do ponto de operação
 */
function validateOperatingPoint(flowVal, headVal, selectedPump, data) {
    const warnings = [];
    
    // Verificações básicas
    if (flowVal < 0) {
        return { isValid: false, message: "Erro: Vazão não pode ser negativa." };
    }
    
    if (selectedPump !== "Bomba Trabalho" && headVal < 0) {
        return { isValid: false, message: "Erro: Altura não pode ser negativa para esta bomba." };
    }
    
    // Verificações de faixa
    const maxFlow = Math.max(...data.vazao_data);
    const maxHead = Math.max(...data.altura_data);
    const minHead = Math.min(...data.altura_data);
    
    if (flowVal > maxFlow * 1.3) {
        return { isValid: false, message: "Erro: Vazão muito alta para esta bomba." };
    }
    
    if (headVal > maxHead * 1.3) {
        return { isValid: false, message: "Erro: Altura muito alta para esta bomba." };
    }
    
    // Avisos (não impedem o cálculo)
    if (flowVal > maxFlow) {
        warnings.push("Vazão acima da faixa recomendada.");
    }
    
    if (headVal > maxHead) {
        warnings.push("Altura acima da faixa recomendada.");
    }
    
    if (flowVal > 0 && flowVal < maxFlow * 0.05) {
        warnings.push("Vazão muito baixa - verifique adequação.");
    }
    
    if (headVal > 0 && headVal < Math.abs(maxHead) * 0.05) {
        warnings.push("Altura muito baixa - verifique adequação.");
    }
    
    // Condições especiais
    if (flowVal === 0 && headVal === 0) {
        warnings.push("Condição de parada total - bomba desligada.");
    } else if (flowVal === 0) {
        warnings.push("Condição de shutoff - válvula fechada.");
    } else if (headVal === 0) {
        warnings.push("Condição de descarga livre - sem pressão.");
    }
    
    if (selectedPump === "Bomba Trabalho" && headVal < 0) {
        warnings.push("Operação com altura negativa (sucção) - verificar instalação.");
    }
    
    return { isValid: true, warnings };
}

/**
 * Cálculos otimizados com cache
 */
function performOptimizedCalculations(flowVal, headVal, data) {
    let powerFromCurve, effFromCurve, npshFromCurve, headFromCurve;
    
    if (flowVal === 0) {
        // Condições especiais para vazão zero
        powerFromCurve = data.potencia_data[0];
        effFromCurve = 0;
        npshFromCurve = data.npsh_curva[0];
        headFromCurve = data.altura_data[0];
    } else {
        // Interpolação otimizada
        powerFromCurve = optimizedInterp(flowVal, data.vazao_data, data.potencia_data);
        effFromCurve = optimizedInterp(flowVal, data.vazao_data, data.rendimento_curva);
        npshFromCurve = optimizedInterp(flowVal, data.vazao_data, data.npsh_curva);
        headFromCurve = optimizedInterp(flowVal, data.vazao_data, data.altura_data);
    }
    
    return {
        powerFromCurve,
        effFromCurve,
        npshFromCurve,
        headFromCurve
    };
}

/**
 * Atualização otimizada dos resultados
 */
function updateResultsDisplay(flow, userHead, calculations) {
    const elements = {
        flowResult: document.getElementById('flowResult'),
        headResult: document.getElementById('headResult'),
        powerResult: document.getElementById('powerResult'),
        efficiencyResult: document.getElementById('efficiencyResult')
    };
    
    try {
        if (elements.flowResult) {
            elements.flowResult.textContent = `Vazão (m³/h): ${flow.toFixed(2)}`;
        }
        if (elements.headResult) {
            elements.headResult.textContent = 
                `Altura Especificada: ${userHead.toFixed(2)}m | Altura da Curva: ${calculations.headFromCurve.toFixed(2)}m`;
        }
        if (elements.powerResult) {
            elements.powerResult.textContent = `Potência da Curva (CV): ${calculations.powerFromCurve.toFixed(3)}`;
        }
        if (elements.efficiencyResult) {
            elements.efficiencyResult.textContent = `Rendimento da Curva (%): ${calculations.effFromCurve.toFixed(2)}`;
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar resultados:', error);
    }
}

/**
 * Limpa todos os resultados e pontos
 */
function clearAll() {
    const flowInput = document.getElementById('flowInput');
    const headInput = document.getElementById('headInput');
    
    if (flowInput) {
        flowInput.value = '';
        flowInput.style.borderColor = '';
    }
    if (headInput) {
        headInput.value = '';
        headInput.style.borderColor = '';
    }
    
    if (chartManager) {
        chartManager.clearOperatingPoints();
    }
    
    clearResults();
    clearStatus();
}

/**
 * Limpa resultados
 */
function clearResults() {
    const elements = {
        flowResult: document.getElementById('flowResult'),
        headResult: document.getElementById('headResult'),
        powerResult: document.getElementById('powerResult'),
        efficiencyResult: document.getElementById('efficiencyResult')
    };
    
    try {
        if (elements.flowResult) elements.flowResult.textContent = 'Vazão (m³/h): -';
        if (elements.headResult) elements.headResult.textContent = 'Altura (m): -';
        if (elements.powerResult) elements.powerResult.textContent = 'Potência Resultante (CV): -';
        if (elements.efficiencyResult) elements.efficiencyResult.textContent = 'Rendimento no Ponto (%): -';
    } catch (error) {
        console.error('❌ Erro ao limpar resultados:', error);
    }
}

/**
 * Mostra status com estilo
 */
function showStatus(message, type) {
    const statusElement = document.getElementById('statusResult');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
    }
    console.log(`📢 Status: ${type} - ${message}`);
}

/**
 * Limpa status
 */
function clearStatus() {
    const statusElement = document.getElementById('statusResult');
    if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }
}

/**
 * Reseta estilos dos inputs
 */
function resetInputStyles() {
    const flowInput = document.getElementById('flowInput');
    const headInput = document.getElementById('headInput');
    
    if (flowInput) flowInput.style.borderColor = '';
    if (headInput) headInput.style.borderColor = '';
}

// Exposição de funções globais
window.calculateOperatingPoint = calculateOperatingPoint;
window.clearAll = clearAll;
window.initializeSystem = initializeSystem;

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    setTimeout(initializeSystem, 100);
}

// Exportações para módulos
export {
    initializeSystem,
    calculateOperatingPoint,
    clearAll,
    chartManager
};