// ============================================================
// chart.js
// Desenha e atualiza o diagrama P-V (Pressão × Volume)
// usando a biblioteca Chart.js.
//
// O gráfico mostra três coisas ao mesmo tempo:
//   Dataset 0 — Isoterma: curva teórica PV = constante
//   Dataset 1 — Trajetória: caminho percorrido pelo gás no tempo
//   Dataset 2 — Ponto atual: onde o gás está agora (laranja)
//
// Funções deste arquivo:
//   calcularIsotema()   — gera os pontos da curva teórica
//   atualizarGrafico()  — redesenha o gráfico com dados atuais
//   limparGrafico()     — apaga todos os dados do gráfico
// ============================================================


// Pega o contexto 2D do elemento <canvas id="pvChart"> no HTML
// O Chart.js precisa desse contexto para desenhar dentro do canvas
const canvasGrafico = document.getElementById("pvChart").getContext("2d");


// ------------------------------------------------------------
// Calcula os pontos da curva isotérmica: PV = NkT = constante.
//
// Numa isoterma, a temperatura é fixa. Ao variar o volume,
// a pressão varia inversamente: se V dobra, P cai pela metade.
//
// Parâmetros:
//   numeroDeParticulas — quantas partículas existem na simulação
//   temperatura        — temperatura atual em Kelvin
//
// Retorna um array de pontos { x: volume, y: pressão }
// que formam a curva tracejada verde no gráfico.
// ------------------------------------------------------------
function calcularIsotema(numeroDeParticulas, temperatura) {
  const CONSTANTE_BOLTZMANN = 1.380649e-23;  // constante k em J/K
  const NkT = numeroDeParticulas * CONSTANTE_BOLTZMANN * temperatura;
  if (NkT === 0) return [];  // sem partículas = sem curva

  const pontos = [];
  for (let i = 0; i <= 60; i++) {
    const v = 1 + i / 60;              // volume varia de 1.0 até 2.0 m³
    pontos.push({ x: v, y: (NkT / v) * 100000 });  // P = NkT / V
  }
  return pontos;
}


// ------------------------------------------------------------
// Cria a instância do gráfico com Chart.js.
//
// Os três datasets são configurados aqui com estilos visuais
// que seguem o tema neon do laboratório.
// Esta parte roda uma vez só quando o arquivo é carregado.
// ------------------------------------------------------------
const grafico = new Chart(canvasGrafico, {
  type: "scatter",
  data: {
    datasets: [

      // Dataset 0 — linha tracejada verde: isoterma teórica
      {
        label: "Isoterma T atual",
        data: [],
        type: "line",
        borderColor: "rgba(0, 255, 136, 0.45)",
        borderWidth: 1.5,
        borderDash: [4, 3],   
        pointRadius: 0,         
        fill: false,
        tension: 0.4,
        order: 2,              
      },

      // Dataset 1 — linha cyan: trajetória histórica do gás
      {
        label: "Trajetória P-V",
        data: [],
        borderColor: "rgba(0, 245, 255, 0.6)",
        backgroundColor: "rgba(0, 245, 255, 0.15)",
        borderWidth: 1.5,
        pointRadius: 1.5,
        showLine: true,
        tension: 0.3,
        fill: false,
        order: 1,
      },

      // Dataset 2 — ponto laranja: estado atual do gás
      {
        label: "Estado atual",
        data: [],
        backgroundColor: "#ff6b00",
        borderColor: "#fff",
        borderWidth: 1.5,
        pointRadius: 7,        
        showLine: false,
        order: 0,               
      },
    ],
  },
  options: {
    animation: false,          
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "V (m³)", color: "rgba(0,245,255,0.7)", font: { family: "'Share Tech Mono', monospace", size: 8 } },
        min: 0.8,
        max: 2.2,
        ticks: { color: "rgba(255,255,255,0.5)", font: { size: 7 }, maxTicksLimit: 4 },
        grid:  { color: "rgba(0,245,255,0.08)" },
      },
      y: {
        type: "linear",
        title: { display: true, text: "P (Pa)", color: "rgba(0,245,255,0.7)", font: { family: "'Share Tech Mono', monospace", size: 8 } },
        min: 0,
        ticks: {
          color: "rgba(255,255,255,0.5)",
          font: { size: 7 },
          maxTicksLimit: 4,
          callback: (v) => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v,
        },
        grid: { color: "rgba(0,245,255,0.08)" },
      },
    },
    plugins: {
      legend:  { display: false }, 
      tooltip: { enabled: false },  
    },
  },
});


// ------------------------------------------------------------
// Atualiza o gráfico com os dados mais recentes do State.
// Esta função é chamada a cada 400ms pelo loop em main.js.
//
// O que ela faz a cada chamada:
//  1. Recalcula a isoterma para a temperatura atual
//  2. Ajusta o eixo Y para acomodar o maior valor registrado
//  3. Redesenha a trajetória histórica (todos os pontos salvos)
//  4. Reposiciona o ponto laranja (estado atual)
//  5. Atualiza os valores no badge abaixo do gráfico
// ------------------------------------------------------------
function atualizarGrafico() {
  if (State.particulas.length === 0) return;  // sem partículas = não atualiza

  // Isoterma recalculada a cada frame para refletir a temperatura atual
  grafico.data.datasets[0].data = calcularIsotema(State.particulas.length, State.temperatura);

  // Eixo Y se expande para sempre mostrar o maior valor já registrado
  const maiorPressao = Math.max(...State.historicoPV.map(h => h.p), State.pressao, 1);
  grafico.options.scales.y.max = maiorPressao * 1.2;

  // Trajetória: converte o histórico em pontos {x, y} para o Chart.js
  grafico.data.datasets[1].data = State.historicoPV.map(h => ({ x: h.v, y: h.p }));

  // Ponto atual: sempre um único ponto laranja
  grafico.data.datasets[2].data = [{ x: State.volume, y: State.pressao }];

  // "none" desativa a animação de transição (mais rápido no mobile)
  grafico.update("none");

  // Atualiza os três valores numéricos exibidos abaixo do gráfico
  document.getElementById("badgeP").innerText = State.pressao.toFixed(0);
  document.getElementById("badgeV").innerText = State.volume.toFixed(2);
  document.getElementById("badgeT").innerText = State.temperatura.toFixed(0);
}


// ------------------------------------------------------------
// Apaga todos os dados do gráfico.
// Chamada por limparParticulas() em particles.js.
// ------------------------------------------------------------
function limparGrafico() {
  grafico.data.datasets[0].data = [];
  grafico.data.datasets[1].data = [];
  grafico.data.datasets[2].data = [];
  grafico.update("none");
}
