// ============================================================
// sounds.js
// Gera os sons dos botões diretamente via JavaScript,
// sem precisar de arquivos de áudio externos (.mp3, .wav etc).
//
// Usa a Web Audio API — uma API nativa do navegador que permite
// criar e manipular sons em tempo real com código.
//
// Todos os sons são "sintetizados" (criados do zero):
//   fogo()        — botão AQUECER
//   frio()        — botão ESFRIAR
//   bolha()       — botão + PART e toque duplo
//   lixo()        — botão LIMPAR
//   cliqueBotao() — demais botões (pausar, gráfico, iniciar)
// ============================================================


// O Howler.js (incluído no HTML) ajuda a desbloquear o áudio
// no mobile. Navegadores bloqueiam áudio até que o usuário
// interaja com a página — o Howler resolve isso automaticamente.

const Sons = (() => {

  // Contexto de áudio: o "motor" que produz o som.
  // Criado uma única vez e reutilizado em todos os sons.
  let contextoAudio = null;


  // ------------------------------------------------------------
  // Retorna o contexto de áudio, criando-o na primeira chamada.
  // Se o navegador tiver suspendido o áudio (política de autoplay),
  // chama resume() para reativar.
  // ------------------------------------------------------------
  function pegarContexto() {
    if (!contextoAudio) {
      contextoAudio = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (contextoAudio.state === "suspended") contextoAudio.resume();
    return contextoAudio;
  }


  // ------------------------------------------------------------
  // Conecta uma sequência de nós de áudio em cadeia.
  // Funciona como montar cabos de guitarra:
  //   fonte → filtro → volume → saída (caixa de som)
  //
  // Recebe quantos nós quiser via "...nos" (rest parameters).
  // ------------------------------------------------------------
  function conectar(...nos) {
    for (let i = 0; i < nos.length - 1; i++) {
      nos[i].connect(nos[i + 1]);
    }
  }


  // ------------------------------------------------------------
  // Cria um nó de controle de volume (GainNode) com valor inicial.
  // "ganho" é o termo técnico para volume em processamento de áudio.
  // ------------------------------------------------------------
  function criarGanho(valor, ac) {
    const ganho = ac.createGain();
    ganho.gain.value = valor;
    return ganho;
  }


  // ============================================================
  // SOM DE FOGO — botão AQUECER
  //
  // Componentes do som:
  //   - Ruído branco filtrado (passa-baixa) = crepitar grave do fogo
  //   - 8 estalos aleatórios (oscilador sawtooth) = fagulhas
  // ============================================================
  function fogo() {
    const ac  = pegarContexto();
    const now = ac.currentTime;  // tempo atual do contexto de áudio
    const dur = 1.2;             // duração total em segundos

    // RUÍDO BRANCO: buffer cheio de valores aleatórios entre -1 e 1
    // Isso gera um "shhhhh" que soa como estática ou fogo
    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const dados  = buffer.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    const fonte  = ac.createBufferSource();
    fonte.buffer = buffer;

    // FILTRO PASSA-BAIXA: deixa passar só frequências graves (< 400Hz)
    // Isso transforma o ruído estático em som de fogo
    const filtro = ac.createBiquadFilter();
    filtro.type  = "lowpass";
    filtro.frequency.setValueAtTime(400, now);
    filtro.frequency.linearRampToValueAtTime(200, now + dur);  // graves diminuem com o tempo

    // ENVELOPE DE VOLUME: ramp de entrada rápida, saída gradual
    const volume = criarGanho(0, ac);
    volume.gain.setValueAtTime(0,    now);
    volume.gain.linearRampToValueAtTime(0.55, now + 0.05);  // sobe rápido
    volume.gain.linearRampToValueAtTime(0.4,  now + 0.6);   // mantém
    volume.gain.linearRampToValueAtTime(0,    now + dur);   // apaga

    conectar(fonte, filtro, volume, ac.destination);
    fonte.start(now);
    fonte.stop(now + dur);

    // ESTALOS DO FOGO: 8 osciladores curtos em momentos aleatórios
    for (let i = 0; i < 8; i++) {
      const t = now + Math.random() * dur * 0.9;  // momento aleatório

      const osc  = ac.createOscillator();
      osc.type   = "sawtooth";  // onda serrada = som mais áspero, como fagulha
      osc.frequency.value = 80 + Math.random() * 120;  // frequência aleatória grave

      const vol = criarGanho(0, ac);
      vol.gain.setValueAtTime(0.35, t);
      vol.gain.exponentialRampToValueAtTime(0.001, t + 0.07);  // apaga rápido

      conectar(osc, vol, ac.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }


  // ============================================================
  // SOM DE FRIO — botão ESFRIAR
  //
  // Componentes do som:
  //   - Ruído branco filtrado (passa-alta) = vento agudo e gelado
  //   - Oscilador descendente (sine) = swoosh de vento frio
  // ============================================================
  function frio() {
    const ac  = pegarContexto();
    const now = ac.currentTime;
    const dur = 1.0;

    // RUÍDO BRANCO (mesmo conceito do fogo, mas com filtro diferente)
    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const dados  = buffer.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    const fonte  = ac.createBufferSource();
    fonte.buffer = buffer;

    // FILTRO PASSA-ALTA: deixa passar só frequências agudas (> 1800Hz)
    // Isso transforma o ruído em som de vento frio e cortante
    const filtro   = ac.createBiquadFilter();
    filtro.type    = "highpass";
    filtro.frequency.setValueAtTime(1800, now);
    filtro.frequency.linearRampToValueAtTime(3500, now + dur);  // fica mais agudo
    filtro.Q.value = 1.5;  // Q aumenta a ressonância — som mais "uivante"

    const volume = criarGanho(0, ac);
    volume.gain.setValueAtTime(0,    now);
    volume.gain.linearRampToValueAtTime(0.45, now + 0.08);
    volume.gain.linearRampToValueAtTime(0.3,  now + 0.5);
    volume.gain.linearRampToValueAtTime(0,    now + dur);

    conectar(fonte, filtro, volume, ac.destination);
    fonte.start(now);
    fonte.stop(now + dur);

    // SWOOSH DESCENDENTE: tom grave que cai de 900Hz para 180Hz
    // Soa como uma rajada de vento passando
    const osc = ac.createOscillator();
    osc.type  = "sine";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.6);  // desce suavemente

    const volOsc = criarGanho(0.25, ac);
    volOsc.gain.linearRampToValueAtTime(0.15, now + 0.3);
    volOsc.gain.linearRampToValueAtTime(0,    now + 0.65);

    conectar(osc, volOsc, ac.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }


  // ============================================================
  // SOM DE BOLHA — botão + PART e toque duplo
  //
  // Componentes do som:
  //   - Oscilador sine descendente = corpo da bolha estourando
  //   - Oscilador square curto = clique do estouro
  // ============================================================
  function bolha() {
    const ac  = pegarContexto();
    const now = ac.currentTime;

    // TOM DESCENDENTE: soa como uma bolha que estoura
    // A frequência cai rapidamente de 520Hz para 200Hz
    const osc = ac.createOscillator();
    osc.type  = "sine";  // onda senoidal = som suave e redondo
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    const volume = criarGanho(0.6, ac);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.14);  // apaga rápido

    conectar(osc, volume, ac.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // CLIQUE DO ESTOURO: tom agudo muito curto (25ms)
    // Simula o "pop" do momento exato que a bolha estoura
    const clique = ac.createOscillator();
    clique.type  = "square";  // onda quadrada = som mais duro e claro
    clique.frequency.value = 1200;

    const volClique = criarGanho(0.3, ac);
    volClique.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    conectar(clique, volClique, ac.destination);
    clique.start(now);
    clique.stop(now + 0.03);
  }


  // ============================================================
  // SOM DE LIXO — botão LIMPAR
  //
  // Componentes do som:
  //   - Ruído bandpass descendente = som de papel amassando
  //   - Oscilador descendente (sine) = batida surda do lixo fechando
  // ============================================================
  function lixo() {
    const ac  = pegarContexto();
    const now = ac.currentTime;
    const dur = 0.5;

    // RUÍDO DE "JOGAR FORA": ruído filtrado que desce de frequência
    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const dados  = buffer.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;

    const fonte  = ac.createBufferSource();
    fonte.buffer = buffer;

    // FILTRO BANDPASS: deixa passar apenas uma faixa de frequências
    // Cria um som mais "focado" que vai descendo
    const filtro   = ac.createBiquadFilter();
    filtro.type    = "bandpass";
    filtro.frequency.setValueAtTime(800, now);
    filtro.frequency.linearRampToValueAtTime(200, now + dur);
    filtro.Q.value = 2;  // Q alto = faixa mais estreita

    const volume = criarGanho(0.5, ac);
    volume.gain.linearRampToValueAtTime(0.3, now + 0.1);
    volume.gain.linearRampToValueAtTime(0,   now + dur);

    conectar(fonte, filtro, volume, ac.destination);
    fonte.start(now);
    fonte.stop(now + dur);

    // BATIDA SURDA: tom grave que cai de 160Hz para 40Hz
    // Soa como uma batida pesada — a tampa do lixo fechando
    const batida = ac.createOscillator();
    batida.type  = "sine";
    batida.frequency.setValueAtTime(160, now + 0.05);
    batida.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    const volBatida = criarGanho(0.7, ac);
    volBatida.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    conectar(batida, volBatida, ac.destination);
    batida.start(now + 0.05);  // começa 50ms depois do ruído
    batida.stop(now + 0.28);
  }


  // ============================================================
  // SOM DE BOTÃO — PAUSAR, GRÁFICO, INICIAR e outros
  //
  // Componentes do som:
  //   - Oscilador triangle descendente = tom principal do clique
  //   - Oscilador square curtíssimo = sub-clique (sensação física)
  // ============================================================
  function cliqueBotao() {
    const ac  = pegarContexto();
    const now = ac.currentTime;

    // TOM PRINCIPAL: frequência cai de 880Hz para 660Hz em 60ms
    // A onda triangular tem um som mais suave e limpo que a quadrada
    const osc = ac.createOscillator();
    osc.type  = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.06);

    const volume = criarGanho(0.25, ac);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    conectar(osc, volume, ac.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // SUB-CLIQUE: tom agudo muito curto (15ms)
    // Dá a sensação de um "clique físico" real, como apertar um botão
    const subClique = ac.createOscillator();
    subClique.type  = "square";
    subClique.frequency.value = 2200;

    const volSub = criarGanho(0.08, ac);
    volSub.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    conectar(subClique, volSub, ac.destination);
    subClique.start(now);
    subClique.stop(now + 0.02);
  }


  // Expõe apenas as funções que os outros módulos precisam chamar
  return { fogo, frio, bolha, lixo, cliqueBotao };

})();
