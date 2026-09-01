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
    scene: "💠",
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
        detail: "Ganha Fragmentos Universais, mas irrita os espíritos.",
        outcome: {
          text: "Você a arranca do chão. Vale muito — mas os sussurros ao redor não perdoam.",
          effects: [{ t: "frag", n: 3 }, { t: "damagePct", n: 0.15 }],
        },
      },
      {
        label: "Deixar como está e passar",
        detail: "Nada acontece. Ou quase.",
        outcome: {
          text: "Vocês seguem. Nas costas, a Semente brilha uma última vez, como um aceno.",
          effects: [{ t: "frag", n: 1 }],
        },
      },
    ],
  },

  {
    id: "acordo_haluhaluhu",
    scene: "💎",
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
          effects: [{ t: "damagePct", n: 0.1 }, { t: "frag", n: 2 }],
        },
      },
    ],
  },

  {
    id: "mercador_errante",
    scene: "🧳",
    title: "O Mercador Errante",
    text:
      "Um velho sob os sóis gêmeos de Centris estende um pano cheio de bugigangas. — \"Gemas? Eu troco. Sempre troco.\"",
    choices: [
      {
        label: "Trocar Gemas por uma relíquia",
        detail: "Custa 25 💎. Se não tiver, ele ri de você.",
        cost: { gemas: 25 },
        outcome: {
          text: "Ele embrulha a peça com cuidado de quem já a perdeu antes.",
          effects: [{ t: "relic" }],
        },
      },
      {
        label: "Vender uma lembrança (ganha 💎)",
        detail: "+18 Gemas.",
        outcome: {
          text: "— \"Isso vale mais pra mim do que pra você\", ele diz. Provavelmente mente.",
          effects: [{ t: "gemas", n: 18 }],
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
        detail: "Ganha Gemas, sem risco.",
        outcome: {
          text: "Kão-Woji fareja cada fio. Vinte minutos depois: cofre limpo.",
          effects: [{ t: "gemas", n: 22 }],
        },
      },
      {
        label: "Não mexer",
        detail: "Segue reto. Covardia é uma tática.",
        outcome: {
          text: "O cofre explode sozinho três segundos depois. Boa decisão.",
          effects: [{ t: "frag", n: 2 }],
        },
      },
    ],
  },

  {
    id: "duelo_treino",
    scene: "🥋",
    title: "Desafio de Treino",
    text:
      "Um discípulo do dojo bate o pé: — \"Um duelo. Se eu ganhar, fico com suas Gemas. Se você ganhar...\"",
    choices: [
      {
        label: "Aceitar o duelo",
        detail: "Aposta 15 💎 numa carta de Mácula + o dobro de volta.",
        cost: { gemas: 15 },
        outcome: {
          text: "Três trocas de golpes. Ele cai rindo. — \"Beleza, vocês servem.\"",
          effects: [{ t: "gemas", n: 30 }, { t: "upgrade" }],
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
        label: "Selar a fenda com Gemas",
        detail: "−20 💎, +HP máx permanente.",
        cost: { gemas: 20 },
        outcome: {
          text: "O ki condensado nas Gemas fecha a costura no ar. O grupo respira melhor.",
          effects: [{ t: "maxHp", n: 14 }],
        },
      },
      {
        label: "Contornar",
        detail: "Caminho mais longo, sem susto.",
        outcome: {
          text: "Vocês dão a volta. A fenda implode sozinha. Bob parece decepcionado.",
          effects: [{ t: "gemas", n: 6 }],
        },
      },
    ],
  },

  {
    id: "cela_tordep",
    scene: "⛓️",
    title: "A Cela que Sussurra",
    text:
      "Uma parede da prisão respira. De dentro, uma voz oleosa: — \"Me solte um dedo. Só um. Eu te devolvo em poder o dobro do que você perde.\"",
    choices: [
      {
        label: "Encostar a mão na parede",
        detail: "Relíquia poderosa — mas o esquadrão perde HP máx.",
        outcome: {
          text: "Algo entra pelos seus dedos e não sai mais. Vocês estão mais fortes, e um pouco menos vocês.",
          effects: [{ t: "relic" }, { t: "maxHp", n: -10 }],
        },
      },
      {
        label: "Reforçar as correntes com Gemas",
        detail: "−22 💎, +HP máx permanente.",
        cost: { gemas: 22 },
        outcome: {
          text: "Vocês fundem as Gemas nas algemas divinas. A voz range os dentes e cala.",
          effects: [{ t: "maxHp", n: 14 }],
        },
      },
      {
        label: "Ignorar e passar rápido",
        detail: "Não olhe pra trás.",
        outcome: {
          text: "A voz ri baixinho até vocês saírem do alcance. Ninguém dorme bem essa noite.",
          effects: [{ t: "frag", n: 2 }],
        },
      },
    ],
  },

  {
    id: "trono_vago",
    scene: "⚖️",
    title: "O Trono Momentaneamente Vazio",
    text:
      "No meio da guerra civil, a sala do trono está sem ninguém. A cadeira de Mácula pulsa com poder de quem já sentou nela. Poderoso cruza os braços: — \"Isso é dos deuses. Não da gente.\"",
    choices: [
      {
        label: "Sentar por três segundos",
        detail: "Grande ganho ou grande perda — o trono julga.",
        outcome: {
          text: "O universo inteiro te encara por um instante. Depois te cospe de volta na cadeira comum.",
          effects: [{ t: "gamble" }],
        },
      },
      {
        label: "Recolher o que caiu no chão",
        detail: "Fragmentos e Gemas espalhados pela briga.",
        outcome: {
          text: "Emissários largaram meio arsenal fugindo. Vocês catam sem culpa.",
          effects: [{ t: "frag", n: 5 }, { t: "gemas", n: 16 }],
        },
      },
      {
        label: "Sair rápido dessa sala",
        detail: "Nada bom acontece aqui.",
        outcome: {
          text: "Vocês fecham a porta. Do lado de dentro, o trono continua esperando o dono.",
          effects: [{ t: "healPct", n: 0.15 }],
        },
      },
    ],
  },

  {
    id: "espelho_reverso",
    scene: "🪞",
    title: "O Espelho de Centris",
    text:
      "Um espelho alto fica de pé sozinho no campo. O reflexo do esquadrão está lá — só que sorrindo quando ninguém sorriu.",
    choices: [
      {
        label: "Atravessar o espelho",
        detail: "Cura total e reergue os caídos — ou uma armadilha do clone.",
        outcome: {
          text: "Do outro lado, um instante de descanso roubado da vida que Ivad Reverso queria. Vocês voltam inteiros.",
          effects: [{ t: "reviveAll" }],
        },
      },
      {
        label: "Quebrar o espelho",
        detail: "Sete anos de azar — ou uma carta de Mácula presa no vidro.",
        outcome: {
          text: "Os cacos caem e um deles brilha diferente. Xingzang teria dito algo sobre isso. Xingzang não está aqui.",
          effects: [{ t: "damagePct", n: 0.12 }, { t: "upgrade" }],
        },
      },
    ],
  },

  {
    id: "chave_torneio",
    scene: "🏟️",
    title: "A Chave do Torneio",
    text:
      "Um funcionário mascarado do Mast oferece um envelope: — \"A chave da próxima rodada. Custa. Sempre custa.\"",
    choices: [
      {
        label: "Comprar a chave (25 💎)",
        detail: "Escolhe uma carta de Mácula + descanso curto.",
        cost: { gemas: 25 },
        outcome: {
          text: "O envelope traz um mapa dos próximos oponentes. Conhecimento é vantagem.",
          effects: [{ t: "healPct", n: 0.2 }, { t: "upgrade" }],
        },
      },
      {
        label: "Roubar o envelope",
        detail: "Ganha, mas a organização não gosta.",
        outcome: {
          text: "Joe Pistoleiro distrai, Kão-Woji pega. Alguém vai cobrar isso depois.",
          effects: [{ t: "relic" }, { t: "damagePct", n: 0.15 }],
        },
      },
      {
        label: "Recusar e lutar limpo",
        detail: "Sem vantagem, sem dívida.",
        outcome: {
          text: "— \"Corajosos\", diz o mascarado. \"Corajosos costumam perder cedo.\"",
          effects: [{ t: "frag", n: 3 }],
        },
      },
    ],
  },

  {
    id: "planilha_da_associacao",
    scene: "🗂️",
    title: "A Planilha",
    text:
      "Um terminal da Associação fica aberto. Na tela, uma lista de mundos com uma coluna final: MANTER / APAGAR. O cursor pisca sobre o nome do universo de vocês.",
    choices: [
      {
        label: "Editar a própria linha para MANTER",
        detail: "Relíquia + segurança — mas alarme dispara.",
        outcome: {
          text: "Vocês mudam o veredito. Sirenes. Agora eles sabem que vocês sabem.",
          effects: [{ t: "relic" }, { t: "damagePct", n: 0.16 }],
        },
      },
      {
        label: "Baixar a planilha inteira",
        detail: "Gemas — informação vale dinheiro.",
        outcome: {
          text: "Bob copia tudo antes que trave. — \"Isso aqui é... muita gente na coluna errada.\"",
          effects: [{ t: "gemas", n: 26 }],
        },
      },
      {
        label: "Apagar a planilha",
        detail: "Ninguém decide sozinho quem vive. +HP máx.",
        outcome: {
          text: "Delete. O terminal apita e morre. Não resolve nada — mas parece certo.",
          effects: [{ t: "maxHp", n: 12 }],
        },
      },
    ],
  },

  {
    id: "borda_do_tudo",
    scene: "💥",
    title: "A Borda de Tudo",
    text:
      "O chão termina. Depois dele, não há 'depois' — só a costura branca onde o multiverso acaba. Protetores e Destruidores lutam ao longe como faíscas. Ivad olha demais para a borda.",
    choices: [
      {
        label: "Puxar Ivad de volta e descansar",
        detail: "Cura considerável para o esquadrão.",
        outcome: {
          text: "João segura o ombro dele. — \"Ainda não. Não hoje.\" O grupo respira.",
          effects: [{ t: "healPct", n: 0.35 }],
        },
      },
      {
        label: "Recolher entropia da costura",
        detail: "Grande poder — grande risco.",
        outcome: {
          text: "Vocês raspam um pouco do fim-de-tudo e guardam num pote. Provavelmente péssima ideia.",
          effects: [{ t: "gamble" }],
        },
      },
      {
        label: "Selar a fenda com tudo que têm",
        detail: "−20 💎, relíquia dos Protetores.",
        cost: { gemas: 20 },
        outcome: {
          text: "Um Protetor renegado ajuda em silêncio e some. Deixa uma peça para trás.",
          effects: [{ t: "relic" }],
        },
      },
    ],
  },
];
