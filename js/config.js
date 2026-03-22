// ============================================================
// config.js
// Aqui ficam as configurações gerais e o "estado" da simulação.
//
// Este arquivo é carregado PRIMEIRO — todos os outros dependem
// das variáveis definidas aqui.
// ============================================================


// ------------------------------------------------------------
// Config: valores fixos que não mudam durante a simulação.
// É como as "regras do jogo" — definidas uma vez só.
// ------------------------------------------------------------
const Config = {

  RAIO_PARTICULA: 0.03,  // tamanho de cada bolinha no AR (em metros)
  MAX_HISTORICO:  80,    // quantos pontos o gráfico P-V guarda antes de apagar os mais antigos
  CSS_ESCALA_Y:       0.5,   // escala visual do canvas  (neutro = 1.0)
  ESCALA_PROJECAO_X:  1.0,   // correção interna da câmera AR (neutro = 1.0)
  CORRECAO_ASPECTO:   1.0,   // proporção largura/altura da câmera (neutro = 1.0)
};


// ------------------------------------------------------------
// State: o "estado atual" da simulação.
// Funciona como a memória do programa — guarda tudo que muda
// enquanto a simulação está rodando.
// Todos os outros módulos (particles, physics, controls...)
// leem e escrevem neste objeto.
// ------------------------------------------------------------
const State = {

  // Grandezas físicas do gás
  temperatura:    300,   // temperatura atual, em Kelvin (K)
  tempAnterior:   300,   // temperatura do frame anterior — usada para ajustar velocidades
  pressao:        0,     // pressão calculada, em Pascal (Pa)
  volume:         1,     // volume do cubo, em metros cúbicos (m³)

  // Controles de fluxo da simulação
  modo:           "aquecer",  // modo atual: "aquecer" ou "esfriar"
  pausado:        false,      // true = simulação parada, false = rodando
  simulacaoAtiva: false,      // false até o usuário clicar em "INICIAR SIMULAÇÃO"

  // Listas de objetos que crescem durante a simulação
  particulas:  [],  // cada item guarda: { el (elemento 3D), pos (posição), vel (velocidade) }
  historicoPV: [],  // cada item guarda: { p (pressão), v (volume) } — para o gráfico P-V
};
