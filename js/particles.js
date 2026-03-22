// ============================================================
// particles.js
// Responsável por tudo que envolve as partículas (bolinhas)
// que representam as moléculas do gás na cena AR.
//
// Funções deste arquivo:
//   corDaTemperatura()              — cor atual das bolinhas
//   velocidadeAleatoria()           — cria uma velocidade inicial
//   ajustarVelocidadesComTemperatura() — reescala velocidades ao mudar T
//   adicionarParticula()            — cria uma bolinha nova na cena
//   limparParticulas()              — remove todas as bolinhas
//   manterParticulasDentroDoVolume() — impede bolinhas de sair do cubo
//   calcularColisoes()              — detecta e responde a colisões
//   atualizarParticulas()           — move todas as bolinhas (chamada a cada frame)
// ============================================================


// Referência ao elemento da cena AR que contém as partículas
const containerParticulas = document.getElementById("particles");


// ------------------------------------------------------------
// Retorna a cor atual das partículas com base na temperatura.
// Quanto mais frio → azul. Quanto mais quente → vermelho.
//
// Usa o formato HSL (Hue, Saturation, Lightness):
//   hue 200 = azul, hue 0 = vermelho
//   "t" normaliza a temperatura entre 0 (200K) e 1 (800K)
// ------------------------------------------------------------
function corDaTemperatura() {
  const t = (State.temperatura - 200) / 600;
  return `hsl(${200 * (1 - t)}, 100%, 55%)`;
}


// ------------------------------------------------------------
// Cria uma velocidade inicial aleatória para uma nova partícula.
//
// A rapidez é proporcional à raiz quadrada da temperatura (√T),
// que é exatamente o que a teoria cinética dos gases prevê:
// partículas mais quentes se movem mais rápido.
// ------------------------------------------------------------
function velocidadeAleatoria() {
  const rapidez = Math.sqrt(State.temperatura) / 200;
  return {
    x: (Math.random() - 0.5) * rapidez,  // direção aleatória entre -0.5 e +0.5
    y: (Math.random() - 0.5) * rapidez,
    z: (Math.random() - 0.5) * rapidez,
  };
}


// ------------------------------------------------------------
// Quando a temperatura muda, as velocidades das partículas
// já existentes precisam ser ajustadas.
//
// Multiplica todas as velocidades por um fator = √(T_nova / T_anterior).
// Isso garante que a energia cinética do gás seja consistente
// com a nova temperatura.
// ------------------------------------------------------------
function ajustarVelocidadesComTemperatura() {
  if (State.tempAnterior === 0) return;  // evita divisão por zero

  const fator = Math.sqrt(State.temperatura / State.tempAnterior);

  for (const p of State.particulas) {
    p.vel.x *= fator;
    p.vel.y *= fator;
    p.vel.z *= fator;
  }

  // Atualiza a temperatura anterior para o próximo frame
  State.tempAnterior = State.temperatura;
}


// ------------------------------------------------------------
// Cria uma nova partícula (bolinha) dentro do cubo.
//
// Passos:
//  1. Cria um elemento <a-sphere> no A-Frame
//  2. Define cor e brilho conforme a temperatura atual
//  3. Posiciona aleatoriamente dentro do cubo
//  4. Adiciona animação de nascimento (escala 0 → 1 com bounce)
//  5. Registra no array State.particulas para controle futuro
// ------------------------------------------------------------
function adicionarParticula() {
  // Cria o elemento 3D (esfera) na cena AR
  const esfera = document.createElement("a-sphere");
  esfera.setAttribute("radius", Config.RAIO_PARTICULA);
  esfera.setAttribute("material", {
    color:             corDaTemperatura(),
    emissive:          corDaTemperatura(),   // faz a bolinha "brilhar" levemente
    emissiveIntensity: State.temperatura / 800,  // brilho maior = mais quente
  });

  // Posição aleatória dentro do cubo
  // (o gasContainer já está deslocado 0.5 no Y, então usamos y centrado em 0)
  const posicao = {
    x: (Math.random() - 0.5) * 0.8,
    y: (Math.random() - 0.5) * 0.8,
    z: (Math.random() - 0.5) * 0.8,
  };
  esfera.setAttribute("position", posicao);

  // ANIMAÇÃO DE NASCIMENTO: a bolinha começa invisível (scale 0)
  // e cresce até o tamanho normal com um efeito elástico (bounce).
  esfera.setAttribute("scale", "0 0 0");
  esfera.setAttribute("animation__spawn", {
    property: "scale",
    from:     "0 0 0",
    to:       "1 1 1",
    dur:      500,           // duração: 500 milissegundos
    easing:   "easeOutElastic",  // tipo de curva: cresce e "quica" um pouco
  });

  // Adiciona a esfera à cena e registra no State
  containerParticulas.appendChild(esfera);
  State.particulas.push({ el: esfera, pos: posicao, vel: velocidadeAleatoria() });

  // Atualiza o contador exibido na tela
  document.getElementById("countVal").innerText = State.particulas.length;
}


// ------------------------------------------------------------
// Remove todas as partículas da cena e zera o histórico do gráfico.
// Chamada quando o usuário clica em "LIMPAR".
// ------------------------------------------------------------
function limparParticulas() {
  for (const p of State.particulas) {
    containerParticulas.removeChild(p.el);  // remove da cena AR
  }

  State.particulas  = [];   // esvazia a lista de partículas
  State.historicoPV = [];   // apaga o histórico do gráfico P-V

  document.getElementById("countVal").innerText = 0;

  limparGrafico();  // função definida em chart.js
}


// ------------------------------------------------------------
// Garante que as partículas não saiam do cubo quando o volume muda.
//
// Se uma partícula ultrapassou uma parede, ela é reposicionada
// exatamente na parede e tem sua velocidade invertida naquele eixo
// (como uma bolinha quicando na parede).
// ------------------------------------------------------------
function manterParticulasDentroDoVolume() {
  const metade = State.volume / 2;  // metade do lado do cubo

  for (const p of State.particulas) {
    if (p.pos.x >  metade) { p.pos.x =  metade; if (p.vel.x > 0) p.vel.x *= -1; }
    if (p.pos.x < -metade) { p.pos.x = -metade; if (p.vel.x < 0) p.vel.x *= -1; }
    if (p.pos.y >  metade) { p.pos.y =  metade; if (p.vel.y > 0) p.vel.y *= -1; }
    if (p.pos.y < -metade) { p.pos.y = -metade; if (p.vel.y < 0) p.vel.y *= -1; }
    if (p.pos.z >  metade) { p.pos.z =  metade; if (p.vel.z > 0) p.vel.z *= -1; }
    if (p.pos.z < -metade) { p.pos.z = -metade; if (p.vel.z < 0) p.vel.z *= -1; }
  }
}


// ------------------------------------------------------------
// Verifica colisões entre todos os pares de partículas.
//
// Quando duas bolinhas se tocam, suas velocidades são trocadas
// na direção do impacto (colisão elástica — conserva energia).
//
// O loop duplo (i, j) compara cada partícula com todas as outras
// sem repetir pares (j começa em i+1).
// ------------------------------------------------------------
function calcularColisoes() {
  for (let i = 0; i < State.particulas.length; i++) {
    for (let j = i + 1; j < State.particulas.length; j++) {
      const a = State.particulas[i];
      const b = State.particulas[j];

      // Distância entre os centros das duas partículas
      const dx   = b.pos.x - a.pos.x;
      const dy   = b.pos.y - a.pos.y;
      const dz   = b.pos.z - a.pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Só colide se as bolinhas estiverem se tocando
      if (dist === 0 || dist >= Config.RAIO_PARTICULA * 2) continue;

      // Vetor normalizado na direção da colisão
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;

      // Intensidade do impacto (produto escalar das velocidades relativas)
      const imp = (a.vel.x - b.vel.x) * nx
                + (a.vel.y - b.vel.y) * ny
                + (a.vel.z - b.vel.z) * nz;

      // Só aplica se estiverem se aproximando (evita que fiquem presas)
      if (imp <= 0) continue;

      // Troca de velocidades na direção do impacto
      a.vel.x -= imp * nx;  a.vel.y -= imp * ny;  a.vel.z -= imp * nz;
      b.vel.x += imp * nx;  b.vel.y += imp * ny;  b.vel.z += imp * nz;
    }
  }
}


// ------------------------------------------------------------
// Move todas as partículas um passo no tempo.
// Esta função é chamada ~60 vezes por segundo pelo loop em main.js.
//
// Para cada partícula:
//  1. Avança posição pela velocidade (pos += vel)
//  2. Inverte a velocidade se bater numa parede
//  3. Atualiza a posição e cor do elemento 3D na cena
// ------------------------------------------------------------
function atualizarParticulas() {
  if (State.pausado) return;  // não move nada se estiver pausado

  const metade = State.volume / 2;
  calcularColisoes();  // testa colisões antes de mover

  for (const p of State.particulas) {
    // Avança a posição
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.pos.z += p.vel.z;

    // Quica nas paredes do cubo
    if (Math.abs(p.pos.x) > metade) p.vel.x *= -1;
    if (Math.abs(p.pos.y) > metade) p.vel.y *= -1;
    if (Math.abs(p.pos.z) > metade) p.vel.z *= -1;

    // Atualiza visualmente na cena AR
    p.el.setAttribute("position", p.pos);
    p.el.setAttribute("material", {
      color:             corDaTemperatura(),
      emissive:          corDaTemperatura(),
      emissiveIntensity: State.temperatura / 800,
    });
  }
}
