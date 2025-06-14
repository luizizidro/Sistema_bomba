# Sistema de Seleção de Bombas

Um sistema web interativo para análise e seleção de bombas centrífugas, desenvolvido com HTML, CSS e JavaScript puro. O sistema permite visualizar curvas características de bombas e calcular pontos de operação específicos.

## 📋 Índice

- [Características](#características)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
- [Bombas Disponíveis](#bombas-disponíveis)
- [Interpretação dos Gráficos](#interpretação-dos-gráficos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🚀 Características

- **Interface Intuitiva**: Design moderno e responsivo
- **Visualização Gráfica**: Curvas características interativas usando Chart.js
- **Cálculos Precisos**: Interpolação linear para pontos de operação
- **Múltiplas Bombas**: Suporte a diferentes modelos de bombas
- **Análise Completa**: Altura, potência, rendimento e NPSH
- **Validação Inteligente**: Avisos e verificações de segurança
- **Responsivo**: Funciona em desktop, tablet e mobile

## 🛠 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna com Flexbox
- **JavaScript ES6+**: Lógica de aplicação
- **Chart.js**: Biblioteca para gráficos interativos
- **Vite**: Ferramenta de build e desenvolvimento

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos de Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/sistema-selecao-bombas.git
   cd sistema-selecao-bombas
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   - Abra seu navegador em `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 🎯 Como Usar

### 1. Seleção da Bomba

1. No painel de controle à direita, selecione o modelo da bomba no dropdown "Modelo"
2. As informações técnicas da bomba serão exibidas automaticamente:
   - Potência (CV)
   - Rotação (rpm)
   - NPSHr (mca)
   - Rendimento máximo (%)

### 2. Definição do Ponto de Operação

1. **Insira os valores desejados**:
   - **Vazão (m³/h)**: Fluxo volumétrico desejado
   - **Altura (m)**: Altura manométrica total necessária

2. **Clique em "Calcular Ponto"** para processar os dados

3. **Analise os resultados**:
   - Pontos serão exibidos no gráfico
   - Resultados detalhados aparecerão no painel

### 3. Interpretação dos Resultados

- **Ponto Vermelho (Círculo)**: Seu ponto especificado
- **Pontos Amarelos (Triângulos)**: Valores reais das curvas da bomba
- **Linha Tracejada Vertical**: Indica a vazão especificada
- **Mensagens de Status**: Avisos e validações importantes

## 🔧 Funcionalidades Detalhadas

### Curvas Características

O sistema exibe quatro curvas principais:

1. **Altura (H) - Vermelha**
   - Mostra a relação entre vazão e altura manométrica
   - Curva decrescente típica de bombas centrífugas

2. **Potência (CV) - Azul**
   - Indica o consumo de potência em função da vazão
   - Geralmente crescente com a vazão

3. **NPSH (mca) - Verde**
   - Net Positive Suction Head requerido
   - Importante para evitar cavitação

4. **Rendimento (%) - Roxa**
   - Eficiência da bomba em diferentes vazões
   - Possui um pico no ponto de melhor eficiência (BEP)

### Validações e Avisos

O sistema fornece feedback inteligente:

- ✅ **Sucesso**: Ponto calculado corretamente
- ⚠️ **Avisos**: Condições especiais ou fora da faixa ideal
- ❌ **Erros**: Valores inválidos ou problemas de cálculo

### Condições Especiais

- **Vazão Zero (Shutoff)**: Válvula fechada, máxima altura
- **Altura Zero**: Descarga livre, sem pressão
- **Valores Baixos**: Avisos para operação em condições extremas

## 🏭 Bombas Disponíveis

### BC-21 R 1/2 (3 CV)
- **Potência**: 3 CV
- **Rotação**: 3.500 rpm
- **NPSHr**: 2,87 mca
- **Rendimento Máximo**: 57,05%
- **Faixa de Vazão**: 0 - 42 m³/h
- **Altura Máxima**: ~32 m

### BC-21 R 1/2 (4 CV)
- **Potência**: 4 CV
- **Rotação**: 3.500 rpm
- **NPSHr**: 2,87 mca
- **Rendimento Máximo**: 54,68%
- **Faixa de Vazão**: 0 - 50 m³/h
- **Altura Máxima**: ~42 m

### Bomba Trabalho
- **Potência**: 46,5 CV
- **Rotação**: 1.700 rpm
- **NPSHr**: 25 mca
- **Rendimento Máximo**: 75%
- **Faixa de Vazão**: 0 - 120 m³/h
- **Altura Máxima**: ~65 m

## 📊 Interpretação dos Gráficos

### Eixos do Gráfico

- **Eixo X**: Vazão (m³/h) - horizontal
- **Eixo Y Esquerdo**: Altura (m) - vermelho
- **Eixo Y Direito 1**: Potência (CV) - azul
- **Eixo Y Direito 2**: NPSH (mca) - verde
- **Eixo Y Direito 3**: Rendimento (%) - roxo

### Pontos de Operação

1. **Ponto Especificado (Vermelho)**
   - Representa os valores inseridos pelo usuário
   - Pode não coincidir com as curvas da bomba

2. **Pontos das Curvas (Amarelo)**
   - Mostram os valores reais da bomba para a vazão especificada
   - São os valores que a bomba realmente fornecerá

### Análise de Discrepâncias

Se houver diferença significativa entre o ponto especificado e os pontos das curvas:

- **Altura Especificada vs Altura da Curva**: Indica se o sistema terá a pressão desejada
- **Avisos de Distância**: Sistema alerta quando o ponto está longe da curva característica

## 📁 Estrutura do Projeto

```
sistema-selecao-bombas/
├── index.html              # Página principal
├── style.css              # Estilos CSS
├── script.js              # Lógica JavaScript
├── package.json           # Dependências e scripts
├── README.md              # Documentação
├── sistema_bomba          # Versão Python (referência)
└── dist/                  # Build de produção (gerado)
```

### Arquivos Principais

#### `index.html`
- Estrutura HTML da aplicação
- Layout responsivo com painel de controle e área do gráfico
- Formulários para entrada de dados

#### `style.css`
- Estilos modernos com design limpo
- Layout flexível e responsivo
- Cores e tipografia profissionais

#### `script.js`
- Dados das bombas com curvas matemáticas
- Lógica de interpolação e cálculos
- Integração com Chart.js
- Validações e tratamento de erros

## 🔬 Desenvolvimento

### Estrutura dos Dados

As bombas são definidas como objetos JavaScript com:

```javascript
{
    potencia_cv: number,        // Potência nominal
    rotacao_rpm: number,        // Rotação nominal
    npsh_mca: number,          // NPSH requerido
    rendimento_percent: number, // Rendimento máximo
    vazao_data: Array,         // Pontos de vazão
    altura_data: Array,        // Curva H-Q
    potencia_data: Array,      // Curva P-Q
    npsh_curva: Array,         // Curva NPSH-Q
    rendimento_curva: Array    // Curva η-Q
}
```

### Funções Principais

- `generateEfficiencyCurve()`: Gera curva de rendimento realística
- `interp()`: Interpolação linear entre pontos
- `calculateOperatingPoint()`: Calcula e valida ponto de operação
- `updateOperatingPointDisplay()`: Atualiza visualização no gráfico
- `plotCurves()`: Desenha curvas características

### Curvas Matemáticas

As curvas são baseadas em equações típicas de bombas centrífugas:

- **Altura**: Parabólica decrescente
- **Potência**: Crescente com componente quadrático
- **NPSH**: Crescente com a vazão
- **Rendimento**: Curva com pico no BEP

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### Diretrizes de Contribuição

- Mantenha o código limpo e bem documentado
- Teste todas as funcionalidades antes de submeter
- Siga os padrões de código existentes
- Atualize a documentação quando necessário

## 🐛 Relatório de Bugs

Para reportar bugs, abra uma issue incluindo:

- Descrição detalhada do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do navegador/sistema

## 📈 Roadmap

### Próximas Funcionalidades

- [ ] Exportação de relatórios em PDF
- [ ] Mais modelos de bombas
- [ ] Cálculo de custos operacionais
- [ ] Comparação entre bombas
- [ ] Modo escuro
- [ ] Internacionalização (i18n)

### Melhorias Técnicas

- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Otimização de performance
- [ ] Acessibilidade (WCAG)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Desenvolvedor Principal** - *Trabalho inicial* - [SeuUsuário](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- Chart.js pela excelente biblioteca de gráficos
- Comunidade de engenharia de bombas pelas referências técnicas
- Vite pela ferramenta de desenvolvimento moderna

## 📞 Suporte

Para suporte técnico:

- 📧 Email: suporte@exemplo.com
- 💬 Issues: [GitHub Issues](https://github.com/seu-usuario/sistema-selecao-bombas/issues)
- 📖 Wiki: [Documentação Técnica](https://github.com/seu-usuario/sistema-selecao-bombas/wiki)

---

**Desenvolvido com ❤️ para a comunidade de engenharia**