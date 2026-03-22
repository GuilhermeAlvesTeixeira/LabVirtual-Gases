
# Laboratório Virtual de Gases Ideais em Realidade Aumentada

Projeto desenvolvido para a disciplina de Realidade Aumentada.
Simulação interativa da Lei dos Gases Ideais (PV = nRT) usando A-Frame e AR.js.

<img width="500" height="500" alt="image" src="https://github.com/user-attachments/assets/06ada546-70d7-476a-90f2-3243e356b4ca" />

---

## Como usar

1. Imprima ou exiba o marcador **HIRO** na tela
2. Abra o projeto no navegador do celular
3. Clique em **INICIAR SIMULAÇÃO**
4. Aponte a câmera para o marcador

---

## Interações implementadas

### Toque duplo na tela

Dois toques rápidos (menos de 300ms de intervalo) em qualquer área da tela fora dos botões adicionam uma nova partícula à simulação. Um texto **"+ PARTICULA"** aparece no ponto do toque como confirmação visual.

Essa interação foi implementada registrando o momento de cada `touchstart` e comparando com o toque anterior. Se o intervalo for menor que 300ms, a partícula é adicionada e o contador é resetado para evitar triplos toques.

---

### Arrasto com um dedo

Arrastar o dedo na tela rotaciona o cubo em torno do próprio eixo. Após soltar o dedo, o cubo continua girando por inércia e desacelera gradualmente (efeito de atrito simulado).

O cubo gira corretamente em torno do próprio centro porque o elemento `gasContainer` foi posicionado em `position="0 0.5 0"` — o centro geométrico do cubo — e não na base. Assim, qualquer rotação aplicada gira em torno do eixo correto.

---

## Animações implementadas

| Animação                | Tipo                  | Descrição                                                          |
| ----------------------- | --------------------- | ------------------------------------------------------------------ |
| Nascimento de partícula | Declarativa (A-Frame) | Cada nova partícula cresce de escala 0 para 1 com efeito elástico  |
| Pulso de escala         | Dinâmica (JavaScript) | O cubo expande até 18% conforme a pressão aumenta                  |
| Tremor                  | Dinâmica (JavaScript) | O cubo vibra em X e Z quando a temperatura passa de 650K           |
| Brilho emissive         | Dinâmica (JavaScript) | O cubo emite luz proporcional à temperatura (azul → vermelho)      |
| Animação dos modelos 3D | GLB (animation-mixer) | O fogo e os flocos de neve tocam a animação interna do arquivo GLB |

As animações declarativas (A-Frame) são definidas diretamente no HTML via atributo `animation__*`.
As animações dinâmicas são calculadas por JavaScript a cada frame dentro da função `animarCubo()` em `physics.js`, utilizando interpolação linear (lerp) e offsets aleatórios.

---

## Modelos 3D utilizados

**Fogo** — exibido quando a simulação está no modo AQUECENDO

* Título: *Fire*
* Autor: **Edgar_koh**
* Fonte: Sketchfab
* Link: https://sketchfab.com/3d-models/fire-8161ae32b81446b397a0efcd36796753
* Licença: Creative Commons Attribution

**Flocos de neve** — exibido quando a simulação está no modo ESFRIANDO

* Título: *Snowflakes Animation*
* Autor: **ayvlasov**
* Fonte: Sketchfab
* Link: https://sketchfab.com/3d-models/snowflakes-animation-dd5b7efa9d82415a83f2d0348930300e
* Licença: Creative Commons Attribution

---

## Estrutura do projeto

```
/
├── index.html          — estrutura da página e cena AR
├── css/
│   └── styles.css      — estilo visual da interface
├── js/
│   ├── config.js       — configurações e estado global
│   ├── sounds.js       — sons dos botões (Web Audio API)
│   ├── particles.js    — criação e movimentação das partículas
│   ├── physics.js      — física do gás e animações do cubo
│   ├── chart.js        — diagrama P-V (Chart.js)
│   ├── controls.js     — botões, slider e interações de toque
│   └── main.js         — loop principal e ajustes de câmera
└── models/
    ├── fire.glb         — modelo 3D do fogo
    └── snowflakes.glb   — modelo 3D dos flocos de neve
```

---

## Tecnologias utilizadas

* **A-Frame 1.4.0** — framework de realidade aumentada e 3D para web
* **AR.js** — rastreamento de marcador HIRO via câmera
* **Chart.js 4.4.0** — diagrama P-V interativo
* **Howler.js 2.2.4** — desbloqueio de áudio em dispositivos mobile
* **Web Audio API** — síntese procedural dos sons dos botões
* **aframe-extras** — componente `animation-mixer` para GLB com animações

---

## Imagens 
<img width="886" height="532" alt="Captura de tela de 2026-03-22 19-55-11" src="https://github.com/user-attachments/assets/3b3f6277-9635-42ae-900c-124d5f5310f4" />


## Checklist final de Build e Publicação Conforme E-book da Unidade 5

### Recursos (Assets)

* [x] Modelos 3D no formato `.glb` e otimizados para web (< 4MB)
* [x] Uso do marcador padrão **HIRO** (alto contraste e rastreamento confiável)

---

### Código e Estrutura

* [x] Bibliotecas JavaScript importadas corretamente (A-Frame, AR.js, extras)
* [x] Caminhos de arquivos (`gltf-model`, etc.) corretos e sensíveis a maiúsculas/minúsculas
* [x] Código organizado, indentado e comentado

---

### Experiência de Realidade Aumentada

* [x] Rastreamento estável do marcador em boas condições de iluminação
* [x] Objeto 3D com escala e posição adequadas
* [x] Iluminação configurada (ambiente e direcional) valorizando o modelo

---

### Interatividade

* [x] Interações principais funcionando corretamente (toque duplo e arrasto)
* [x] Feedback visual claro para ações do usuário

---

### Publicação e Acesso

* [x] Projeto publicado no Netlify com todos os arquivos necessários
* [x] Acesso via HTTPS funcionando em dispositivos móveis
* [x] Permissão de câmera solicitada e aplicação funcionando corretamente


## Uso de Inteligência Artificial no Projeto

Durante o desenvolvimento deste laboratório virtual, ferramentas de Inteligência Artificial foram utilizadas como apoio para acelerar o desenvolvimento, melhorar a organização do código e auxiliar na resolução de problemas.

### Uso integral

A IA foi utilizada de forma predominante (praticamente integral) nos seguintes aspectos:

* **Estilização (CSS)** — estruturação completa do layout e ajustes visuais da interface
* **Sons procedurais (`sounds.js`)** — geração de efeitos sonoros utilizando a Web Audio API
* **Comentários no código** — documentação interna para facilitar manutenção e entendimento
* **Configuração dos gráficos (`chart.js`)** — definição das opções, estrutura e comportamento do diagrama P-V

---

### Uso parcial (com refinamento manual)

A IA também foi utilizada como suporte em partes mais técnicas do sistema, mas com intervenção direta do autor para ajustes, correções e refinamento:

* **Física da simulação (`physics.js`)**

  * Auxílio na estrutura inicial das funções
  * Ajustes manuais para comportamento mais realista e estável
  * Correção de bugs e adaptação ao contexto da simulação

* **Sistema de partículas (`particles.js`)**

  * Geração inicial da lógica de criação e movimentação
  * Refinamento manual para controle, performance e integração com o restante do sistema

* **Construção do README.md**

  * Estrutura inicial e organização do conteúdo
  * Ajustes manuais para clareza, precisão técnica e adequação acadêmica

---

### Considerações

A utilização de IA neste projeto teve como objetivo **aumentar a produtividade e servir como ferramenta de apoio**, não substituindo o entendimento técnico necessário para implementar, adaptar e integrar cada parte do sistema.
