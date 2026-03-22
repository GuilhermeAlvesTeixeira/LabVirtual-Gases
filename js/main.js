// ============================================================
// main.js
// O coração da simulação: o loop principal que roda a cada frame.
// Também resolve problemas de câmera e vídeo no mobile.
//
// Este arquivo é carregado POR ÚLTIMO, depois de todos os outros,
// porque usa funções definidas nos outros módulos.
// ============================================================


// ============================================================
// BLOCO 1 — AJUSTES DE CÂMERA PARA MOBILE
//
// O AR.js às vezes inicializa a câmera com proporções erradas
// no celular, distorcendo os objetos 3D. As funções abaixo
// corrigem isso em várias camadas para garantir que funcione.
// ============================================================

(function ajustarCameraParaMobile() {

  const cena = document.querySelector("a-scene");


  // ------------------------------------------------------------
  // Aplica uma escala CSS no canvas do A-Frame.
  // Controlada por Config.CSS_ESCALA_Y em config.js.
  // É a correção mais simples e direta — age na saída visual.
  // ------------------------------------------------------------
  function aplicarEscalaCSS() {
    const canvas = document.querySelector("canvas.a-canvas");
    if (!canvas) return;
    canvas.style.setProperty("transform",        `scaleY(${Config.CSS_ESCALA_Y})`, "important");
    canvas.style.setProperty("transform-origin", "center center",                  "important");
  }


  // ------------------------------------------------------------
  // Corrige a matriz de projeção interna do AR.js.
  // A matriz de projeção define como a câmera 3D "enxerga" a cena.
  // O AR.js às vezes a configura com o aspect ratio errado.
  // Só ativa se Config.ESCALA_PROJECAO_X for diferente de 1.
  // ------------------------------------------------------------
  function corrigirMatrizDeProjecao() {
    if (Config.ESCALA_PROJECAO_X === 1.0) return;
    try {
      const sistemaAR = cena.systems["arjs"];
      if (!sistemaAR) return;

      // Tenta acessar o arController pelo caminho do AR.js 3.x
      const ctrl = sistemaAR.arToolkitContext || sistemaAR._arToolkitContext;
      if (ctrl && ctrl._arToolkitContext && ctrl._arToolkitContext.arController) {
        const m = ctrl._arToolkitContext.arController.camera.projectionMatrix.elements;
        if (m) m[0] *= Config.ESCALA_PROJECAO_X;  // m[0] é a escala X do frustum
      }
      // Tenta também pelo caminho direto
      if (sistemaAR.arController) {
        const m = sistemaAR.arController.camera
               && sistemaAR.arController.camera.projectionMatrix
               && sistemaAR.arController.camera.projectionMatrix.elements;
        if (m) m[0] *= Config.ESCALA_PROJECAO_X;
      }
    } catch (_) {}  // silencia erros — o AR.js pode ainda não estar pronto
  }


  // ------------------------------------------------------------
  // Sincroniza o tamanho do renderer WebGL com a tela do celular.
  // Também corrige o aspect ratio (proporção largura/altura) da câmera.
  //
  // O renderer é o "motor de renderização" do A-Frame/Three.js.
  // Se ele não souber o tamanho real da tela, os objetos ficam
  // distorcidos ou o canvas não cobre a tela inteira.
  // ------------------------------------------------------------
  function sincronizarCameraComTela() {
    if (!cena || !cena.renderer) return;

    const largura = window.innerWidth;
    const altura  = window.innerHeight;

    cena.renderer.setSize(largura, altura);

    // Remove planos de corte que poderiam "aparar" os objetos
    cena.renderer.clippingPlanes       = [];
    cena.renderer.localClippingEnabled = false;

    if (cena.camera) {
      cena.camera.aspect = (largura / altura) * Config.CORRECAO_ASPECTO;
      cena.camera.near   = 0.01;   // objetos muito próximos não somem
      cena.camera.far    = 1000;   // objetos distantes não somem
      cena.camera.updateProjectionMatrix();
    }
  }


  // Aplica todas as correções quando a cena termina de carregar
  cena.addEventListener("loaded", function () {
    sincronizarCameraComTela();
    aplicarEscalaCSS();

    // Repete após alguns ms porque o AR.js pode redefinir os valores depois
    [100, 300, 700].forEach(function (ms) {
      setTimeout(function () {
        sincronizarCameraComTela();
        aplicarEscalaCSS();
        corrigirMatrizDeProjecao();
      }, ms);
    });
  });


  // Repete as correções quando o vídeo da câmera estiver disponível
  cena.addEventListener("arjs-video-loaded", function () {
    sincronizarCameraComTela();
    aplicarEscalaCSS();
    setTimeout(corrigirMatrizDeProjecao, 100);
  });


  // Se ESCALA_PROJECAO_X estiver ativa, corrige a cada 2 frames
  // (necessário porque o AR.js reseta a matriz continuamente)
  if (Config.ESCALA_PROJECAO_X !== 1.0) {
    let contador = 0;
    function loopCorrecao() {
      contador++;
      if (contador % 2 === 0) corrigirMatrizDeProjecao();
      requestAnimationFrame(loopCorrecao);
    }
    cena.addEventListener("loaded", function () { requestAnimationFrame(loopCorrecao); });
  }


  // Resincroniza quando o usuário gira o celular
  window.addEventListener("resize", function () {
    sincronizarCameraComTela();
    aplicarEscalaCSS();
  });
  window.addEventListener("orientationchange", function () {
    setTimeout(function () {
      sincronizarCameraComTela();
      aplicarEscalaCSS();
    }, 300);
  });


  // ------------------------------------------------------------
  // Corrige o vídeo da câmera para preencher a tela inteira.
  //
  // O AR.js injeta um elemento <video> dinamicamente no HTML.
  // O MutationObserver "fica de olho" no body e avisa assim que
  // o vídeo aparecer. Quando aparece, calculamos as dimensões
  // corretas para cobrir a tela sem deixar faixas pretas.
  // ------------------------------------------------------------
  const observador = new MutationObserver(function () {
    const video = document.querySelector("video");
    if (!video) return;
    observador.disconnect();  // para de observar após encontrar o vídeo

    function preencherTela() {
      const propTela  = window.innerWidth / window.innerHeight;
      const propVideo = (video.videoWidth || 640) / (video.videoHeight || 480);

      let largura, altura;

      // Compara as proporções para decidir quem define a escala
      if (propVideo > propTela) {
        // Vídeo mais largo que a tela: a altura preenche, e a largura extrapola
        altura  = window.innerHeight;
        largura = Math.ceil(altura * propVideo);
      } else {
        // Vídeo mais alto que a tela: a largura preenche, e a altura extrapola
        largura = window.innerWidth;
        altura  = Math.ceil(largura / propVideo);
      }

      if (video.videoWidth) {
        video.style.setProperty("width",  largura + "px", "important");
        video.style.setProperty("height", altura  + "px", "important");
      }
    }

    video.addEventListener("loadedmetadata", preencherTela);  // quando o stream inicia
    window.addEventListener("resize", preencherTela);
    window.addEventListener("orientationchange", function () { setTimeout(preencherTela, 200); });
    preencherTela();
  });

  observador.observe(document.body, { childList: true, subtree: true });

})();


// ============================================================
// BLOCO 2 — COMPONENTE A-FRAME: fix-clipping
//
// Componentes A-Frame são como "extensões" que podem ser
// adicionadas a qualquer elemento da cena AR via atributo HTML.
//
// Este componente roda seu método "tick" a cada frame e garante
// que os planos de corte da câmera permaneçam com os valores corretos.
// O AR.js pode resetar esses valores continuamente, então precisamos
// corrigi-los também de dentro do loop do A-Frame.
// ============================================================

AFRAME.registerComponent("fix-clipping", {
  // "tick" é chamado pelo A-Frame a cada frame automaticamente
  tick: function () {
    const camera = this.el.sceneEl && this.el.sceneEl.camera;
    if (!camera) return;

    // Só atualiza se os valores estiverem errados (evita trabalho desnecessário)
    if (camera.near !== 0.01 || camera.far !== 1000) {
      camera.near = 0.01;   // objetos próximos não desaparecem
      camera.far  = 1000;   // objetos distantes não desaparecem
      camera.updateProjectionMatrix();
    }
  }
});


// ============================================================
// BLOCO 3 — LOOP PRINCIPAL
//
// A função "animar" roda aproximadamente 60 vezes por segundo.
// Cada execução corresponde a um "frame" da simulação.
//
// "requestAnimationFrame" é uma função do navegador que chama
// "animar" no próximo frame disponível, criando um loop suave
// sincronizado com a taxa de atualização da tela.
// ============================================================

let ultimoTempo         = performance.now();  // tempo do frame anterior
let temporizadorGrafico = 0;                  // acumula tempo para atualizar o gráfico

function animar(tempoAtual) {

  // dt = tempo decorrido desde o último frame, em segundos
  // Exemplo: 60fps → dt ≈ 0.016s | 30fps → dt ≈ 0.033s
  const dt = (tempoAtual - ultimoTempo) / 1000;
  ultimoTempo = tempoAtual;

  if (State.simulacaoAtiva) {

    // ── Atualiza a física ─────────────────────────────────────
    atualizarTemperatura(dt);           // evolui a temperatura
    ajustarVelocidadesComTemperatura(); // reescala velocidades
    atualizarParticulas();              // move as bolinhas
    calcularFisica();                   // calcula pressão e velocidade

    // ── Atualiza os visuais ───────────────────────────────────
    atualizarFundo();       // cor do fundo da tela
    atualizarTermometro();  // altura do líquido no termômetro
    document.getElementById("tempVal").innerText = State.temperatura.toFixed(0);

    // ── Animações do cubo ─────────────────────────────────────
    animarCubo();  // pulso de escala, tremor e brilho (physics.js)

    // ── Atualiza o gráfico P-V a cada 400ms ───────────────────
    // Não precisa atualizar todo frame — 400ms é suficiente
    // e economiza processamento no mobile.
    temporizadorGrafico += dt;
    if (temporizadorGrafico >= 0.4 && State.particulas.length > 0) {
      temporizadorGrafico = 0;

      // Salva o estado atual no histórico
      State.historicoPV.push({ p: State.pressao, v: State.volume });

      // Remove o ponto mais antigo se o histórico estiver cheio
      if (State.historicoPV.length > Config.MAX_HISTORICO) State.historicoPV.shift();

      atualizarGrafico();  // redesenha o gráfico (chart.js)
    }
  }

  // Solicita o próximo frame — isso mantém o loop rodando
  requestAnimationFrame(animar);
}

// Inicia o loop pela primeira vez
requestAnimationFrame(animar);
