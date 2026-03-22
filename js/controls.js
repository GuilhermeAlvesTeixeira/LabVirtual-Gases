// ============================================================
// controls.js
// Gerencia toda a interface do usuário:
//   — botões de controle
//   — slider de volume
//   — tela de introdução
//   — modelos 3D (fogo e flocos de neve)
//   — interações de toque (duplo toque e arrasto)
//
// Interações implementadas:
//   TOQUE DUPLO  — dois toques rápidos (< 300ms): adiciona partícula
//   ARRASTO      — dedo arrastando na tela: rotaciona o cubo
// ============================================================


// ── Referências a elementos da página ───────────────────────
// Guardamos referências aqui para não precisar chamar
// getElementById repetidamente ao longo do código.
const teladeIntroducao = document.getElementById("introScreen");
const areaDeControles  = document.getElementById("controls");
const areaDeVolume     = document.getElementById("volumeContainer");
const painelDados      = document.getElementById("dataPanel");
const painelGrafico    = document.getElementById("pvPanel");
const botaoModo        = document.getElementById("modeBtn");
const botaoPausa       = document.getElementById("pauseBtn");
const botaoToggleView  = document.getElementById("toggleViewBtn");
const modeloFogo       = document.getElementById("fireModel");
const modeloGelo       = document.getElementById("iceModel");
const feedbackEl       = document.getElementById("feedbackToque");
const cuboDaSimulacao  = document.getElementById("gasContainer");


// ------------------------------------------------------------
// Torna o modelo de fogo visível e inicia sua animação interna.
// Esconde o modelo de gelo ao mesmo tempo.
// Chamada quando o modo muda para "aquecer".
// ------------------------------------------------------------
function mostrarFogo() {
  modeloFogo.setAttribute("visible", "true");
  modeloGelo.setAttribute("visible", "false");
  // timeScale: 1 = animação rodando na velocidade normal
  modeloFogo.setAttribute("animation-mixer", "clip: *; loop: repeat; clampWhenFinished: false; timeScale: 1");
}


// ------------------------------------------------------------
// Torna o modelo de flocos de neve visível e inicia sua animação.
// Esconde o modelo de fogo e para sua animação ao mesmo tempo.
// Chamada quando o modo muda para "esfriar".
// ------------------------------------------------------------
function mostrarGelo() {
  modeloGelo.setAttribute("visible", "true");
  modeloFogo.setAttribute("visible", "false");
  // Liga a animação dos flocos
  modeloGelo.setAttribute("animation-mixer", "clip: *; loop: repeat; clampWhenFinished: false; timeScale: 1");
  // Para a animação do fogo (timeScale: 0 = congelado)
  modeloFogo.setAttribute("animation-mixer", "clip: *; loop: repeat; clampWhenFinished: false; timeScale: 0");
}


// ------------------------------------------------------------
// Esconde os dois modelos 3D e para suas animações.
// Chamada ao pausar a simulação.
// ------------------------------------------------------------
function esconderModelos() {
  modeloFogo.setAttribute("visible", "false");
  modeloGelo.setAttribute("visible", "false");
  // Para as animações dos dois modelos
  modeloFogo.setAttribute("animation-mixer", "clip: *; loop: repeat; clampWhenFinished: false; timeScale: 0");
  modeloGelo.setAttribute("animation-mixer", "clip: *; loop: repeat; clampWhenFinished: false; timeScale: 0");
}


// ------------------------------------------------------------
// Botão INICIAR SIMULAÇÃO
//
// Quando o usuário clica, este botão:
//  1. Toca o som de clique
//  2. Faz a tela de introdução desaparecer com fade (0.8s)
//  3. Exibe os controles e o painel de dados
//  4. Marca a simulação como ativa
//  5. Cria 5 partículas iniciais após 500ms (tempo para a cena carregar)
// ------------------------------------------------------------
document.getElementById("startBtn").addEventListener("click", function () {
  Sons.cliqueBotao();

  teladeIntroducao.style.opacity = "0";
  setTimeout(() => { teladeIntroducao.style.display = "none"; }, 800);

  areaDeControles.style.display = "flex";
  areaDeVolume.style.display    = "block";
  painelDados.style.display     = "block";

  State.simulacaoAtiva = true;

  setTimeout(() => {
    for (let i = 0; i < 5; i++) adicionarParticula();  // função de particles.js
  }, 500);
});


// ------------------------------------------------------------
// Botão + PART — adiciona uma partícula manualmente
// ------------------------------------------------------------
document.getElementById("addBtn").onclick = function () {
  Sons.bolha();
  adicionarParticula();
};


// ------------------------------------------------------------
// Botão LIMPAR — remove todas as partículas da simulação
// ------------------------------------------------------------
document.getElementById("clearBtn").onclick = function () {
  Sons.lixo();
  limparParticulas();
};


// ------------------------------------------------------------
// Slider de VOLUME
// Chamado cada vez que o usuário arrasta o slider.
// parseFloat converte a string do slider para número decimal.
// ------------------------------------------------------------
document.getElementById("volumeSlider").oninput = function () {
  atualizarVolume(parseFloat(this.value));  // função de physics.js
};


// ------------------------------------------------------------
// Botão AQUECENDO / ESFRIANDO
// Alterna entre os dois modos e atualiza visual e modelos 3D.
// ------------------------------------------------------------
botaoModo.onclick = function () {
  if (State.modo === "aquecer") {
    // Estava aquecendo → muda para esfriar
    Sons.frio();
    State.modo                 = "esfriar";
    botaoModo.innerText        = "ESFRIANDO";
    botaoModo.style.background = "dodgerblue";
    mostrarGelo();
  } else {
    // Estava esfriando → muda para aquecer
    Sons.fogo();
    State.modo                 = "aquecer";
    botaoModo.innerText        = "AQUECENDO";
    botaoModo.style.background = "#ff6b00";
    mostrarFogo();
  }
};


// ------------------------------------------------------------
// Botão PAUSAR / CONTINUAR
// Delega a lógica para alternarPausa() para que o toque duplo
// também possa chamar a mesma função.
// ------------------------------------------------------------
botaoPausa.onclick = function () {
  Sons.cliqueBotao();
  alternarPausa();
};


// ------------------------------------------------------------
// Alterna o estado de pausa da simulação.
// Atualiza o texto e a cor do botão conforme o novo estado.
// Esconde ou restaura os modelos 3D conforme necessário.
// ------------------------------------------------------------
function alternarPausa() {
  State.pausado = !State.pausado;  // inverte: false → true, true → false

  botaoPausa.innerText        = State.pausado ? "CONTINUAR" : "PAUSAR";
  botaoPausa.style.background = State.pausado ? "#006600"   : "#cc0000";

  // Esconde modelos ao pausar, restaura o correto ao continuar
  State.pausado ? esconderModelos()
                : (State.modo === "aquecer" ? mostrarFogo() : mostrarGelo());
}


// ------------------------------------------------------------
// Botão GRAFICO / DADOS
// Alterna entre exibir o painel de dados e o diagrama P-V.
// ------------------------------------------------------------
let mostrandoGrafico = false;  // controla qual painel está visível

botaoToggleView.onclick = function () {
  Sons.cliqueBotao();
  mostrandoGrafico = !mostrandoGrafico;

  painelDados.style.display   = mostrandoGrafico ? "none"  : "block";
  painelGrafico.style.display = mostrandoGrafico ? "block" : "none";
  botaoToggleView.innerText   = mostrandoGrafico ? "DADOS" : "GRAFICO";
};


// ------------------------------------------------------------
// Exibe um texto flutuante no ponto do toque.
//
// Usa uma animação CSS (feedback-flutua) para fazer o texto
// subir e desaparecer. A classe é removida e adicionada de novo
// para reiniciar a animação mesmo que seja chamada rapidamente.
// ------------------------------------------------------------
function mostrarFeedback(x, y, texto) {
  feedbackEl.innerText  = texto;
  feedbackEl.style.left = x + "px";
  feedbackEl.style.top  = y + "px";

  feedbackEl.classList.remove("feedback-ativo");
  void feedbackEl.offsetWidth;  // força o navegador a "ver" a remoção antes de adicionar
  feedbackEl.classList.add("feedback-ativo");
}


// ------------------------------------------------------------
// Verifica se o ponto do toque está em cima de algum elemento
// da interface (botões, painéis, slider).
//
// Retorna true se o toque foi na UI — nesse caso as interações
// de arrasto e duplo toque não devem ser ativadas.
// ------------------------------------------------------------
function toqueFoiNaUI(e) {
  const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  return el && el.closest("#controls, #volumeContainer, #dataPanel, #pvPanel, #introScreen");
}


// ============================================================
// INTERAÇÃO 1 — TOQUE DUPLO → adiciona partícula
//
// Dois toques com intervalo menor que 300ms são detectados
// como duplo toque. Um texto "+ PARTICULA" aparece no local.
// ============================================================

let ultimoToque = 0;  // momento do último toque (milissegundos)

document.addEventListener("touchstart", function (e) {
  // Ignora se a simulação não iniciou, se tem mais de 1 dedo, ou se tocou na UI
  if (!State.simulacaoAtiva || e.touches.length !== 1 || toqueFoiNaUI(e)) return;

  const agora = Date.now();
  const x     = e.touches[0].clientX;
  const y     = e.touches[0].clientY;

  // Verifica se é um duplo toque (menos de 300ms desde o último)
  if (agora - ultimoToque < 300) {
    Sons.bolha();
    adicionarParticula();
    mostrarFeedback(x, y, "+ PARTICULA");
    ultimoToque = 0;  // reseta para evitar triplo toque
    return;
  }

  ultimoToque = agora;  // salva o momento para comparar no próximo toque
}, { passive: true });


// ============================================================
// INTERAÇÃO 2 — ARRASTO → rotaciona o cubo
//
// Ao arrastar um dedo, o cubo gira em torno do seu próprio centro.
// Isso funciona porque gasContainer está em position="0 0.5 0",
// que é o centro geométrico do cubo.
//
// Após soltar o dedo, o cubo continua girando por inércia
// e desacelera gradualmente (controlado por ATRITO).
// ============================================================

let arrastando = false;
let ultimoTX   = 0, ultimoTY = 0;   // última posição do dedo na tela
let anguloX    = 0, anguloY  = 0;   // ângulos acumulados de rotação (graus)
let velocX     = 0, velocY   = 0;   // velocidade atual de rotação (para inércia)

const SENSIBILIDADE = 0.45;  // quanto 1 pixel de arrasto vira em graus
const ATRITO        = 0.90;  // quanto a inércia diminui por frame (0 = para logo, 1 = não para)
const VEL_MINIMA    = 0.02;  // velocidade mínima abaixo da qual para completamente


// Início do arrasto: registra posição inicial e zera inércia
document.addEventListener("touchstart", function (e) {
  if (e.touches.length !== 1 || toqueFoiNaUI(e)) return;
  arrastando = true;
  velocX = velocY = 0;
  ultimoTX = e.touches[0].clientX;
  ultimoTY = e.touches[0].clientY;
}, { passive: true });


// Durante o arrasto: calcula o quanto o dedo se moveu e gira o cubo
document.addEventListener("touchmove", function (e) {
  if (!arrastando || e.touches.length !== 1) return;

  // Diferença de posição do dedo desde o último evento
  velocY = (e.touches[0].clientX - ultimoTX) * SENSIBILIDADE;  // horizontal → gira em Y
  velocX = (e.touches[0].clientY - ultimoTY) * SENSIBILIDADE;  // vertical   → gira em X

  anguloX += velocX;
  anguloY += velocY;

  cuboDaSimulacao.setAttribute("rotation", { x: anguloX, y: anguloY, z: 0 });

  // Atualiza posição anterior para o próximo evento
  ultimoTX = e.touches[0].clientX;
  ultimoTY = e.touches[0].clientY;
}, { passive: true });


// Fim do arrasto: a velocidade do último movimento vira a inércia inicial
document.addEventListener("touchend", function () {
  arrastando = false;
});


// ------------------------------------------------------------
// Loop de inércia
// Roda a cada frame via requestAnimationFrame.
// Quando o usuário solta o dedo, continua girando usando a
// última velocidade registrada, que diminui gradualmente pelo ATRITO.
// ------------------------------------------------------------
(function loopDeInercia() {
  if (!arrastando && (Math.abs(velocX) > VEL_MINIMA || Math.abs(velocY) > VEL_MINIMA)) {
    anguloX += velocX;
    anguloY += velocY;
    velocX  *= ATRITO;   // diminui a velocidade a cada frame
    velocY  *= ATRITO;
    cuboDaSimulacao.setAttribute("rotation", { x: anguloX, y: anguloY, z: 0 });
  }
  requestAnimationFrame(loopDeInercia);
})();
