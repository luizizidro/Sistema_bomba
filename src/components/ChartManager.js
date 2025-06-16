/**
 * Gerenciador de Gráficos Otimizado
 */

import { debounce, throttle, perfMonitor } from '../utils/performance.js';

export class ChartManager {
    constructor() {
        this.chart = null;
        this.operatingPointDatasets = [];
        this.isInitialized = false;
        this.updateQueue = [];
        this.isUpdating = false;
        
        // Debounced update para evitar atualizações excessivas
        this.debouncedUpdate = debounce(this._performUpdate.bind(this), 100);
        this.throttledResize = throttle(this._handleResize.bind(this), 250);
        
        this.setupResizeObserver();
    }

    /**
     * Inicializa o gráfico com configurações otimizadas
     */
    async initialize(canvasElement) {
        if (this.isInitialized) {
            console.warn('⚠️ Gráfico já inicializado');
            return true;
        }

        if (!canvasElement) {
            console.error('❌ Canvas não encontrado');
            return false;
        }

        try {
            perfMonitor.start('chart-init');
            
            // Verifica se já existe um chart no canvas e o destrói
            const existingChart = Chart.getChart(canvasElement);
            if (existingChart) {
                existingChart.destroy();
                console.log('🗑️ Chart existente destruído');
            }
            
            // Configuração otimizada do Chart.js
            this.chart = new Chart(canvasElement, {
                type: 'line',
                data: { datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    
                    // Otimizações de performance
                    animation: {
                        duration: 0 // Desabilita animações para melhor performance
                    },
                    
                    elements: {
                        point: {
                            radius: 0, // Remove pontos por padrão
                            hoverRadius: 4
                        },
                        line: {
                            tension: 0.1 // Reduz tensão para melhor performance
                        }
                    },
                    
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    
                    // Otimização de datasets
                    datasets: {
                        line: {
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            borderWidth: 2
                        }
                    },
                    
                    plugins: {
                        title: {
                            display: true,
                            text: 'Curvas Características da Bomba',
                            font: { size: 16, weight: 'bold' },
                            color: '#2c3e50'
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12 },
                                filter: (legendItem) => legendItem.text !== ''
                            }
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#3498db',
                            borderWidth: 1
                        }
                    },
                    
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Vazão - Q (m³/h)',
                                font: { size: 14, weight: 'bold' },
                                color: '#2c3e50'
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0,0,0,0.1)'
                            },
                            min: 0
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Altura (m)',
                                color: '#e74c3c',
                                font: { weight: 'bold' }
                            },
                            ticks: { color: '#e74c3c' },
                            grid: { display: true, color: 'rgba(231,76,60,0.1)' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Potência (CV)',
                                color: '#3498db',
                                font: { weight: 'bold' }
                            },
                            ticks: { color: '#3498db' },
                            grid: { drawOnChartArea: false },
                            min: 0
                        },
                        y2: {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: 'NPSH (mca)',
                                color: '#27ae60',
                                font: { weight: 'bold' }
                            },
                            ticks: { color: '#27ae60' },
                            grid: { drawOnChartArea: false },
                            offset: true,
                            min: 0
                        },
                        y3: {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Rendimento (%)',
                                color: '#9b59b6',
                                font: { weight: 'bold' }
                            },
                            ticks: { color: '#9b59b6' },
                            grid: { drawOnChartArea: false },
                            offset: true,
                            min: 0,
                            max: 100
                        }
                    }
                }
            });

            this.isInitialized = true;
            perfMonitor.end('chart-init');
            console.log('✅ Gráfico inicializado com otimizações');
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar gráfico:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Atualiza as curvas da bomba
     */
    updateCurves(pumpData) {
        if (!this.isInitialized || !this.chart) {
            console.warn('⚠️ Gráfico não inicializado');
            return;
        }

        perfMonitor.start('update-curves');

        try {
            const datasets = [
                {
                    label: 'Altura (H)',
                    data: pumpData.vazao_data.map((x, i) => ({ x, y: pumpData.altura_data[i] })),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    yAxisID: 'y',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2.5
                },
                {
                    label: 'Potência (CV)',
                    data: pumpData.vazao_data.map((x, i) => ({ x, y: pumpData.potencia_data[i] })),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    yAxisID: 'y1',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2.5
                },
                {
                    label: 'NPSH (mca)',
                    data: pumpData.vazao_data.map((x, i) => ({ x, y: pumpData.npsh_curva[i] })),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    yAxisID: 'y2',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2.5
                },
                {
                    label: 'Rendimento (%)',
                    data: pumpData.vazao_data.map((x, i) => ({ x, y: pumpData.rendimento_curva[i] })),
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    yAxisID: 'y3',
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2.5
                }
            ];

            this.chart.data.datasets = datasets;
            this.debouncedUpdate();
            
            perfMonitor.end('update-curves');

        } catch (error) {
            console.error('❌ Erro ao atualizar curvas:', error);
        }
    }

    /**
     * Adiciona pontos de operação
     */
    addOperatingPoints(flow, userHead, curveHead, power, npshRequired, efficiency) {
        if (!this.isInitialized || !this.chart) return;

        this.clearOperatingPoints();

        try {
            const userPoint = {
                label: 'Ponto Especificado',
                data: [{ x: flow, y: userHead }],
                borderColor: '#e74c3c',
                backgroundColor: '#e74c3c',
                yAxisID: 'y',
                pointRadius: 12,
                pointHoverRadius: 14,
                showLine: false,
                pointBorderWidth: 3,
                pointBorderColor: '#c0392b',
                pointStyle: 'circle'
            };

            const curvePoints = [
                {
                    label: 'Altura da Curva',
                    data: [{ x: flow, y: curveHead }],
                    borderColor: '#f39c12',
                    backgroundColor: '#f39c12',
                    yAxisID: 'y',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    showLine: false,
                    pointBorderWidth: 2,
                    pointBorderColor: '#e67e22',
                    pointStyle: 'triangle'
                },
                {
                    label: '',
                    data: [{ x: flow, y: power }],
                    borderColor: '#f39c12',
                    backgroundColor: '#f39c12',
                    yAxisID: 'y1',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    showLine: false,
                    pointBorderWidth: 2,
                    pointBorderColor: '#e67e22',
                    pointStyle: 'triangle'
                },
                {
                    label: '',
                    data: [{ x: flow, y: npshRequired }],
                    borderColor: '#f39c12',
                    backgroundColor: '#f39c12',
                    yAxisID: 'y2',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    showLine: false,
                    pointBorderWidth: 2,
                    pointBorderColor: '#e67e22',
                    pointStyle: 'triangle'
                },
                {
                    label: '',
                    data: [{ x: flow, y: efficiency }],
                    borderColor: '#f39c12',
                    backgroundColor: '#f39c12',
                    yAxisID: 'y3',
                    pointRadius: 10,
                    pointHoverRadius: 12,
                    showLine: false,
                    pointBorderWidth: 2,
                    pointBorderColor: '#e67e22',
                    pointStyle: 'triangle'
                }
            ];

            // Linha vertical de referência
            const maxHeight = Math.max(curveHead, userHead, 0) * 1.1;
            const minHeight = Math.min(curveHead, userHead, 0) * 1.1;

            const verticalLine = {
                label: '',
                data: [
                    { x: flow, y: minHeight },
                    { x: flow, y: maxHeight }
                ],
                borderColor: 'rgba(149, 165, 166, 0.6)',
                backgroundColor: 'transparent',
                yAxisID: 'y',
                borderWidth: 2,
                borderDash: [8, 4],
                pointRadius: 0,
                showLine: true,
                fill: false
            };

            this.operatingPointDatasets = [userPoint, ...curvePoints, verticalLine];
            this.chart.data.datasets = [...this.chart.data.datasets.slice(0, 4), ...this.operatingPointDatasets];
            
            this.debouncedUpdate();

        } catch (error) {
            console.error('❌ Erro ao adicionar pontos de operação:', error);
        }
    }

    /**
     * Remove pontos de operação
     */
    clearOperatingPoints() {
        if (this.chart && this.operatingPointDatasets.length > 0) {
            try {
                this.chart.data.datasets = this.chart.data.datasets.slice(0, 4);
                this.operatingPointDatasets = [];
                this.debouncedUpdate();
            } catch (error) {
                console.error('❌ Erro ao limpar pontos:', error);
            }
        }
    }

    /**
     * Atualização interna otimizada
     */
    _performUpdate() {
        if (!this.chart || this.isUpdating) return;
        
        this.isUpdating = true;
        try {
            this.chart.update('none');
        } catch (error) {
            console.error('❌ Erro na atualização do gráfico:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Configura observer para redimensionamento
     */
    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(this.throttledResize);
        }
    }

    /**
     * Manipula redimensionamento
     */
    _handleResize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    /**
     * Observa elemento para redimensionamento
     */
    observeResize(element) {
        if (this.resizeObserver && element) {
            this.resizeObserver.observe(element);
        }
    }

    /**
     * Destrói o gráfico e limpa recursos
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        this.operatingPointDatasets = [];
        this.isInitialized = false;
        
        console.log('🗑️ Gráfico destruído e recursos limpos');
    }
}