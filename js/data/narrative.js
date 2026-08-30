/**
 * narrative.js — eventos aleatórios (nó ❓).
 *
 * Cada escolha aplica uma lista de efeitos (systems/run.js os interpreta):
 *   sementes, fragmentos   → moedas (n pode ser negativo)
 *   healPct, damagePct     → % do HP máx de todo o esquadrão
 *   maxHp                  → +HP máx permanente na run
 *   relic                  → relíquia aleatória
 *   relicId                → relíquia específica
 *   upgrade               → abre uma escolha de carta de Mácula
 *   reviveAll             → cura total + reergue os caídos
 */

export const EVENTS = [
  {
    id: "prece_semente",
    scene: "🌱",
    title: "Preces na Semente Primordial",
    text:
      "Uma Semente Primordial pulsa no altar de pedra, meio enterrada. Oaoj sugere seguir em frente. Takimatida ajoelha-se e fecha os olhos.",
    choices: [
      {
        label: "Oferecer preces (perde tempo, ganha bênção)",
        detail: "−1 turno de descanso, mas o esquadrão é abençoado.",
        outcome: {
          text: "A luz da Semente entra em vocês. As feridas fecham e algo desperta.",
          effects: [{ t: "healPct", n: 0.4 }, { t: "upgrade" }],
        },
      },
      {
        label: "Arrancar a Semente e seguir",
        detail: "Ganha Sementes Primordiais, mas irrita os espíritos.",
        outcome: {
          text: "Você a arranca do chão. Vale muito — mas os sussurros ao redor não perdoam.",
          effects: [{ t: "sementes", n: 8 }, { t: "damagePct", n: 0.15 }],
        },
      },
      {
        label: "Deixar como está e passar",
        detail: "Nada acontece. Ou quase.",
        outcome: {
          text: "Vocês seguem. Nas costas, a Semente brilha uma última vez, como um aceno.",
          effects: [{ t: "sementes", n: 2 }],
        },
      },
    ],
  },

  {
    id: "acordo_haluhaluhu",
    scene: "🔥",
    title: "O Acordo de Haluhaluhu",
    text:
      "Uma voz sobe do chão rachado, doce como mel fervido: — \"Poder. Agora. Basta um pouco do que te mantém inteiro.\"",
    choices: [
      {
        label: "Aceitar o acordo",
        detail: "Relíquia poderosa, mas o esquadrão perde HP máx.",
        outcome: {
          text: "O calor sobe pelos braços. Vocês estão mais fortes — e mais ocos.",
          effects: [{ t: "relic" }, { t: "maxHp", n: -8 }],
        },
      },
      {
        label: "Cuspir na oferta",
        detail: "O Rei Demônio não gosta de ser recusado.",
        outcome: {
          text: "O chão se fecha com um rosnado. Ivad sorri: — \"Achei que ele fosse mais persuasivo.\"",
          effects: [{ t: "damagePct", n: 0.1 }, { t: "sementes", n: 6 }],
        },
      },
    ],
  },

  {
    id: "mercador_errante",
    scene: "🧳",
    title: "O Mercador Errante",
    text:
      "Um velho sob os sóis gêmeos de Centris estende um pano cheio de bugigangas. — \"Fragmentos de Magma? Eu troco. Sempre troco.\"",
    choices: [
      {
        label: "Trocar Fragmentos por uma relíquia",
        detail: "Custa 25 🔥. Se não tiver, ele ri de você.",
        cost: { fragmentos: 25 },
        outcome: {
          text: "Ele embrulha a peça com cuidado de quem já a perdeu antes.",
          effects: [{ t: "relic" }],
        },
      },
      {
        label: "Vender uma lembrança (ganha 🔥)",
        detail: "+18 Fragmentos de Magma.",
        outcome: {
          text: "— \"Isso vale mais pra mim do que pra você\", ele diz. Provavelmente mente.",
          effects: [{ t: "fragmentos", n: 18 }],
        },
      },
      {
        label: "Agradecer e seguir",
        detail: "Sem trocas.",
        outcome: {
          text: "— \"Volte quando estiver mais pobre\", ele grita. \"Todo mundo volta.\"",
          effects: [],
        },
      },
    ],
  },

  {
    id: "fonte_dojo",
    scene: "⛲",
    title: "A Fonte do Dojo",
    text:
      "Água gelada desce da montanha para uma bacia de pedra. Xing Zang diz que quem bebe com pressa não sente o gosto — nem o efeito.",
    choices: [
      {
        label: "Descansar e beber com calma",
        detail: "Cura considerável e reergue os caídos.",
        outcome: {
          text: "O frio limpa a fadiga. Todos de pé, de novo.",
          effects: [{ t: "reviveAll" }],
        },
      },
      {
        label: "Encher os cantis e treinar",
        detail: "Cura pequena + carta de Mácula.",
        outcome: {
          text: "Uma hora de sombra e respiração. Sai dali mais afiado.",
          effects: [{ t: "healPct", n: 0.2 }, { t: "upgrade" }],
        },
      },
    ],
  },

  {
    id: "relicario_quebrado",
    scene: "⚰️",
    title: "O Relicário Quebrado",
    text:
      "Entre ruínas, um cofre de mármore rachado. Dentro, duas peças de Mácula — e um cheiro de armadilha.",
    choices: [
      {
        label: "Abrir com força (Poderoso na frente)",
        detail: "Ganha relíquia, mas a armadilha dispara.",
        outcome: {
          text: "Lâminas saltam das paredes. Poderoso apara a maioria. A maioria.",
          effects: [{ t: "relic" }, { t: "damagePct", n: 0.18 }],
        },
      },
      {
        label: "Desarmar com paciência",
        detail: "Ganha Fragmentos de Magma, sem risco.",
        outcome: {
          text: "Kão-Woji fareja cada fio. Vinte minutos depois: cofre limpo.",
          effects: [{ t: "fragmentos", n: 22 }],
        },
      },
      {
        label: "Não mexer",
        detail: "Segue reto. Covardia é uma tática.",
        outcome: {
          text: "O cofre explode sozinho três segundos depois. Boa decisão.",
          effects: [{ t: "sementes", n: 4 }],
        },
      },
    ],
  },

  {
    id: "duelo_treino",
    scene: "🥋",
    title: "Desafio de Treino",
    text:
      "Um discípulo do dojo bate o pé: — \"Um duelo. Se eu ganhar, fico com seus Fragmentos. Se você ganhar...\"",
    choices: [
      {
        label: "Aceitar o duelo",
        detail: "Aposta 15 🔥 por uma carta de Mácula + o dobro de volta.",
        cost: { fragmentos: 15 },
        outcome: {
          text: "Três trocas de golpes. Ele cai rindo. — \"Beleza, vocês servem.\"",
          effects: [{ t: "fragmentos", n: 30 }, { t: "upgrade" }],
        },
      },
      {
        label: "Recusar",
        detail: "Ele resmunga e vai embora.",
        outcome: {
          text: "— \"Turistas\", ele cospe. Xing Zang segura o riso.",
          effects: [],
        },
      },
    ],
  },

  {
    id: "portal_instavel",
    scene: "🌀",
    title: "Fenda para a Dimensão Alfa",
    text:
      "Uma fenda entre realidades gira no ar, cuspindo faíscas — energia primordial da Dimensão Alfa vaza por ela. Bob acha que dá pra 'pular por cima'. Ninguém apoia Bob.",
    choices: [
      {
        label: "Atravessar a fenda",
        detail: "Aleatório: grande ganho ou grande perda.",
        outcome: {
          text: "O outro lado é... diferente. Vocês voltam mudados.",
          effects: [{ t: "gamble" }],
        },
      },
      {
        label: "Selar a fenda com Fragmentos",
        detail: "−20 🔥, +HP máx permanente.",
        cost: { fragmentos: 20 },
        outcome: {
          text: "O ki condensado nos Fragmentos fecha a costura no ar. O grupo respira melhor.",
          effects: [{ t: "maxHp", n: 14 }],
        },
      },
      {
        label: "Contornar",
        detail: "Caminho mais longo, sem susto.",
        outcome: {
          text: "Vocês dão a volta. A fenda implode sozinha. Bob parece decepcionado.",
          effects: [{ t: "fragmentos", n: 6 }],
        },
      },
    ],
  },
];
