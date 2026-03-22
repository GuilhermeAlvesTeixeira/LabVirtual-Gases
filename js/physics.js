 
/*Funções deste arquivo:
   atualizarTemperatura(dt)  — evolui a temperatura no tempo
   calcularFisica()          — calcula pressão e velocidade média
   atualizarTermometro()     — atualiza a altura do termômetro visual
   atualizarFundo()          — muda a cor de fundo com a temperatura
   atualizarVolume(v)        — redimensiona o cubo quando o slider muda
   animarCubo()              — aplica pulso, tremor e brilho ao cubo
============================================================
*/

const liquidoTermometro = document.getElementById("thermoLiquid");
const termometro        = document.getElementById("thermometer");
const fundoColorido     = document.getElementById("overlay");

// ------------------------------------------------------------
// Aumenta ou diminui a temperatura ao longo do tempo.
//
// "dt" é o tempo decorrido desde o último frame, em segundos.

// A temperatura é limitada entre 200K e 800K para a simulação
// não sair do controle.
// ------------------------------------------------------------
function atualizarTemperatura(dt) {
  if (State.pausado) return;

  if (State.modo === "aquecer") State.temperatura += 20 * dt;  // +20 Kelvin por segundo
  if (State.modo === "esfriar") State.temperatura -= 20 * dt;  // -20 Kelvin por segundo

  State.temperatura = Math.max(200, Math.min(800, State.temperatura));
}


// ------------------------------------------------------------
// Calcula a pressão e a velocidade média das partículas.
//
// Usa a teoria cinética dos gases:
//   Pressão = (N × soma(v²)) / (3 × Volume)
// onde N é o número de partículas e v é a velocidade de cada uma.
//
// O resultado é exibido nos campos "Pressão" e "Vel. média" da tela.
// ------------------------------------------------------------
function calcularFisica() {
  if (State.pausado || State.particulas.length === 0) return;

  let somaV  = 0;   // soma das velocidades (para calcular a média)
  let somaV2 = 0;   // soma dos quadrados das velocidades (para pressão)

  for (const p of State.particulas) {
    // Módulo da velocidade: √(vx² + vy² + vz²)
    const v = Math.sqrt(p.vel.x ** 2 + p.vel.y ** 2 + p.vel.z ** 2);
    somaV  += v;
    somaV2 += v * v;
  }

  const n = State.particulas.length;

  // Fórmula da pressão cinética (com fator 100000 para converter para Pa)
  // p = n * m * v² / 3V
  // https://fisicacomentada.blogspot.com/2013/05/teoria-cinetica-dos-gases.html
  State.pressao = (n * somaV2) / (3 * State.volume) * 100000;
  if (!isFinite(State.pressao)) State.pressao = 0;  

  // Atualiza os valores exibidos na tela
  document.getElementById("speedVal").innerText    = (somaV / n).toFixed(2);
  document.getElementById("pressureVal").innerText = State.pressao.toFixed(0);
}


// ------------------------------------------------------------
// Atualiza a altura da coluna vermelha do termômetro visual.
//
// "norm" normaliza a temperatura entre 0 (mais frio) e 1 (mais quente).
// A altura varia de 0.1 (quase vazio) a 0.9 (quase cheio).
// ------------------------------------------------------------
function atualizarTermometro() {
  const norm   = Math.max(0, Math.min(1, (State.temperatura - 200) / 600));
  const altura = 0.1 + norm * 0.8;

  liquidoTermometro.setAttribute("height",   altura);
  liquidoTermometro.setAttribute("position", { x: 0, y: -0.5 + altura / 2, z: 0 });
}


// ------------------------------------------------------------
// Muda a cor do fundo da tela de acordo com a temperatura.
//
// Frio:   fundo levemente azulado
// Quente: fundo levemente avermelhado
// ------------------------------------------------------------
function atualizarFundo() {
  const t = (State.temperatura - 200) / 600;
  fundoColorido.style.background =
    `rgba(${Math.round(255 * t)}, 0, ${Math.round(255 * (1 - t))}, 0.15)`;
}


// ------------------------------------------------------------
// Redimensiona o cubo quando o usuário arrasta o slider de volume.
//
// Além de mudar as dimensões do cubo na cena AR, também:
//  - Atualiza os textos de volume na tela
//  - Move o termômetro para ficar sempre colado na lateral do cubo
//  - Reposiciona as partículas que ficaram fora do novo volume menor
// ------------------------------------------------------------
function atualizarVolume(novoVolume) {
  State.volume = novoVolume;

  const cubo = document.getElementById("container");
  cubo.setAttribute("width",  novoVolume);
  cubo.setAttribute("height", novoVolume);
  cubo.setAttribute("depth",  novoVolume);

  document.getElementById("volumeVal").innerText  = novoVolume.toFixed(2);
  document.getElementById("volDisplay").innerText = novoVolume.toFixed(1);

  // Termômetro
  termometro.setAttribute("position", { x: novoVolume / 2 + 0.4, y: 0.5, z: 0 });

  manterParticulasDentroDoVolume();  
}


// ============================================================
// ANIMAÇÕES DINÂMICAS DO CUBO
//
// Esta função roda a cada frame e aplica três efeitos visuais
// baseados no estado físico atual da simulação:
//
//   1. PULSO DE ESCALA  — o cubo fica maior conforme a pressão sobe
//   2. TREMOR           — o cubo vibra quando está muito quente (> 650K)
//   3. BRILHO EMISSIVE  — o cubo emite luz proporcional à temperatura
//
// Nota: o tremor mexe apenas em X e Z para não conflitar com a
// animação "bob" (flutuação em Y) definida no HTML via A-Frame.
// ============================================================

// Objeto que guarda os valores de animação entre um frame e o próximo
const animCubo = {
  escalaAtual: 1,   // escala suavizada pelo lerp
  offX:        0,   // deslocamento de tremor no eixo X
  offZ:        0,   // deslocamento de tremor no eixo Z
};

function animarCubo() {
  if (State.pausado || State.particulas.length === 0) return;

  const gasContainer = document.getElementById("gasContainer");
  const cubo         = document.getElementById("container");


  // ── 1. PULSO DE ESCALA ──────────────────────────────────────
  // Quanto maior a pressão, mais o cubo se expande (até 18% maior).
  //
  // Lerp (interpolação linear): em vez de pular direto para o valor alvo,
  // a escala se aproxima 6% por frame — isso cria uma transição suave.
  // Fórmula do lerp: atual = atual + (alvo - atual) × fator
  const pressaoNorm = Math.min(State.pressao / 60000, 1);  // normaliza entre 0 e 1
  const escalaAlvo  = 1 + pressaoNorm * 0.18;              // entre 1.0 e 1.18

  animCubo.escalaAtual += (escalaAlvo - animCubo.escalaAtual) * 0.06;
  const s = animCubo.escalaAtual;
  gasContainer.setAttribute("scale", `${s} ${s} ${s}`);


  // ── 2. TREMOR ───────────────────────────────────────────────
  // Acima de 650K o cubo começa a vibrar.
  // A intensidade cresce até atingir o máximo em 800K.
  // Ao esfriar, o tremor diminui gradualmente (multiplica por 0.7).
  if (State.temperatura > 650) {
    const intensidade = ((State.temperatura - 650) / 150) * 0.04;
    animCubo.offX = (Math.random() - 0.5) * intensidade;  // deslocamento aleatório
    animCubo.offZ = (Math.random() - 0.5) * intensidade;
  } else {
    animCubo.offX *= 0.7;  // amortece o tremor ao esfriar
    animCubo.offZ *= 0.7;
  }

  // Aplica o tremor preservando o Y atual (controlado pelo A-Frame bob)
  const posAtual = gasContainer.getAttribute("position");
  gasContainer.setAttribute("position",
    `${animCubo.offX} ${posAtual.y} ${animCubo.offZ}`
  );


  // ── 3. BRILHO (emissive glow) ───────────────────────────────
  // O material do cubo emite luz cuja intensidade varia com a temperatura.
  // A 200K = sem brilho. A 800K = brilho máximo (0.5).
  // A cor segue a mesma lógica das partículas: azul → vermelho.
  const brilho = Math.min((State.temperatura - 200) / 600, 1) * 0.5;
  const cor    = corDaTemperatura();  // função definida em particles.js

  cubo.setAttribute("material",
    `opacity: 0.3; transparent: true; color: ${cor}; emissive: ${cor}; emissiveIntensity: ${brilho}`
  );
}
