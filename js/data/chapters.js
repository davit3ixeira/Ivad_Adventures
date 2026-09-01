/**
 * chapters.js — a campanha roguelike de "As Aventuras de Ivad".
 *
 * rows     : quantas linhas o mapa de nós tem
 * grunts   : pool de tropa comum para nós ⚔️
 * elites   : pool para nós ☠️
 * boss     : inimigo do nó final 🔱
 * terrains : pesos de terreno usados na geração do grid de batalha
 * scene    : emoji-símbolo do capítulo (intro, nó, epílogo)
 * bg       : id do tema visual do mapa/arena (ver css/screens.css [data-ch] e css/battle.css)
 *
 * Capítulos 1–4 seguem o livro; 5–10 expandem a saga (Tordep, guerra dos
 * deuses, Ivad Reverso, o Torneio do Mast, a Associação e os Destruidores).
 */

export const CHAPTERS = [
  {
    id: 1,
    name: "A Sombra de Haluho",
    locale: "Terra ⟶ Haluho",
    scene: "🌋",
    bg: "haluho",
    rows: 8,
    grunts: ["haluhu", "haluhu_osso", "espectro"],
    elites: ["huluhuluhu", "holoholoho", "helehelehe"],
    boss: "halahalaha",
    terrains: { plain: 60, magma: 16, wall: 14, forest: 6, ruin: 4 },
    intro:
      "Haluho tem um céu rubro que parece chorar sangue, e a Semente Primordial pulsa no seu centro como um coração maligno — faminta. Haluhaluhu quer a Terra pelas almas que ela abriga. Takimatida ensinou o Super Soco e o Super Chute; agora é atravessar o portal e enfrentar os cinco Irmãos Demônios. O último a cair será Halahalaha.",
    outro:
      "Halahalaha tomba no platô, ainda sorrindo. Os cinco irmãos caíram — mas do fundo de Haluho, o riso de Haluhaluhu sobe pelas rochas. Isto foi apenas o começo.",
    reward: { frag: 12 },
  },
  {
    id: 2,
    name: "O Treinamento com Xing Zang",
    locale: "Dojo nas Montanhas",
    scene: "⛩️",
    bg: "dojo",
    rows: 9,
    grunts: ["discipulo_caido", "espectro", "projecao_hostil", "guerreiro_poder"],
    elites: ["hilihilihi", "colosso_projecao", "huluhuluhu"],
    boss: "poderoso_rival",
    terrains: { plain: 52, forest: 28, wall: 12, ruin: 6, magma: 2 },
    intro:
      "No dojo de Xing Zang — um templo entre árvores altas e um rio cristalino — aprende-se que poder sem controle é tempestade sem direção. Meditação, Soco Forte, Soco da Natureza. Quando o treino termina, uma sombra pesada desce a trilha: Poderoso, o exilado do Planeta Poder, cruzou meio universo para medir o que Ivad aprendeu. — \"Se vocês não me segurarem, não seguram nada do que vem depois.\"",
    outro:
      "Poderoso limpa o sangue do lábio e ri baixo. — \"Serve.\" Ele senta na pedra e cruza os braços. Um aliado a mais — e uma dúvida a menos sobre o que Ivad é capaz de aguentar.",
    reward: { frag: 15 },
  },
  {
    id: 3,
    name: "A Dimensão Alfa",
    locale: "Entre realidades",
    scene: "🌌",
    bg: "alfa",
    rows: 10,
    grunts: ["guerreiro_alfa", "projecao_lamina", "projecao_hostil", "espectro"],
    elites: ["guardiao_alfa", "sentinela_alfa", "colosso_projecao"],
    boss: "alkor_guardiao",
    terrains: { plain: 46, ruin: 26, wall: 20, forest: 4, magma: 4 },
    intro:
      "Torres de luz sólida flutuam sobre um chão que pulsa como algo vivo. A Dimensão Alfa é um ponto de convergência entre realidades, e quem vive nela respira energia primordial. Al-Kor, o Guardião, ergue a mão: — \"Aqui a força bruta não basta. Vocês vão aprender Projeção — ou vão ficar.\" A técnica é uma extensão da alma. O último teste é o próprio Al-Kor.",
    outro:
      "Al-Kor recolhe as lâminas de energia e entrega um portal cristalino. — \"O Escolhido é só uma fração do perigo real. Aprendam rápido.\" A porta se abre para casa — e para a guerra que espera.",
    reward: { frag: 18 },
  },
  {
    id: 4,
    name: "O Escolhido",
    locale: "Centris, campo púrpura",
    scene: "🕳️",
    bg: "escolhido",
    rows: 11,
    grunts: ["sombra_escolhido", "discipulo_caido", "corrompido_macula", "projecao_hostil", "espectro"],
    elites: ["korlok", "colosso_projecao", "sentinela_alfa", "helehelehe"],
    boss: "takimatida_sombrio",
    terrains: { plain: 48, ruin: 24, wall: 16, magma: 8, forest: 4 },
    intro:
      "Takimatida mergulhou nas trevas e virou O Escolhido — não quer governar o universo, quer remodelá-lo, apagá-lo e desenhar outro. Xing Zang foi enfrentá-lo sozinho num planeta de rochas quebradas sob um céu púrpura. A armadura negra do Escolhido está viva, e cresce a cada golpe que apara. É preciso chegar antes que reste alguém para salvar.",
    outro:
      "A armadura racha e O Escolhido se desfaz em fumaça. O preço foi Xing Zang — ele deu tudo. Ivad ajoelha no chão rachado. Lá longe, algo que absorveu essa morte já se agita numa prisão que ninguém deveria abrir.",
    reward: { frag: 24 },
  },
  {
    id: 5,
    name: "A Prisão de Tordep",
    locale: "Fenda-cofre do multiverso",
    scene: "⛓️",
    bg: "tordep",
    rows: 11,
    grunts: ["sombra_faminta", "casulo_trevas", "eco_absorvido", "projecao_lamina"],
    elites: ["carcereiro_deus", "guardiao_alfa", "colosso_projecao", "korlok"],
    boss: "tordep",
    terrains: { plain: 40, wall: 30, ruin: 22, magma: 6, forest: 2 },
    intro:
      "Existe um lugar sem nome, dobrado entre universos, onde os deuses trancaram o que não conseguiram matar. Tordep é uma criatura das trevas que come poder — o alheio vira dele. Foi aprisionado não pelo que fez, mas pelo que poderia fazer. As correntes divinas estão cedendo, e cada eco de batalha que chega aqui o alimenta um pouco mais.",
    outro:
      "Tordep se dissolve de volta na escuridão da cela, mas não some. — \"Vocês me deram um gosto\", ele sussurra, e o gosto tinha nome: Ivad. As correntes se refazem sozinhas. Por enquanto.",
    reward: { frag: 28 },
  },
  {
    id: 6,
    name: "Guerra Civil dos Deuses",
    locale: "O Trono de Mácula",
    scene: "⚖️",
    bg: "deuses",
    rows: 12,
    grunts: ["acolito_divino", "emissario_ordep", "sentinela_do_trono", "espectro"],
    elites: ["general_civil", "sentinela_alfa", "carcereiro_deus", "colosso_projecao"],
    boss: "ordep_odranoel",
    terrains: { plain: 54, ruin: 24, wall: 14, forest: 6, magma: 2 },
    intro:
      "O mundo dos deuses está em chamas por uma cadeira. Ordep quer o trono de Mácula e não quer esperar a eternidade por ele — então se fundiu ao próprio irmão, Odranoel, o Deus do Equilíbrio, e virou Ordep Odranoel: metade ambição, metade lei. É guerra civil entre imortais, e os mortais que atravessarem esse campo vão ter que escolher um lado com os punhos.",
    outro:
      "A fusão se rasga ao meio. Odranoel cai de um lado, exausto; Ordep some pelo outro, jurando voltar. Mácula observa do trono sem se levantar: — \"Interessante. Vocês servem para alguma coisa.\"",
    reward: { frag: 32 },
  },
  {
    id: 7,
    name: "Ivad Reverso",
    locale: "Centris, espelhada",
    scene: "🩸",
    bg: "reverso",
    rows: 12,
    grunts: ["clone_reverso", "fragmento_ivad", "sombra_faminta", "corrompido_macula"],
    elites: ["sombra_de_ivad", "general_civil", "carcereiro_deus", "korlok"],
    boss: "ivad_reverso",
    terrains: { plain: 46, ruin: 22, wall: 18, magma: 10, forest: 4 },
    intro:
      "Tordep voltou, e voltou esperto. Levou consigo um pedaço de Ivad — só um pedaço — e em cima dele construiu um corpo. O que anda por Centris agora tem o rosto de Ivad, os golpes de Ivad, a memória de Ivad, e nada da alma dele. Ivad Reverso não quer destruir o universo. Quer substituir o original e viver a vida que roubou.",
    outro:
      "O clone se ajoelha e olha as próprias mãos se apagando. — \"Eu me lembro de tudo... só não sinto nada.\" Ele se desfaz. Ivad fica olhando o lugar onde estava, por muito tempo, sem dizer nada.",
    reward: { frag: 36 },
  },
  {
    id: 8,
    name: "O Torneio do Mast",
    locale: "Arena entre dez universos",
    scene: "🏟️",
    bg: "torneio",
    rows: 12,
    grunts: ["gladiador_mascarado", "campeao_universo", "clone_reverso", "guerreiro_alfa"],
    elites: ["finalista_torneio", "sombra_de_ivad", "general_civil", "sentinela_alfa"],
    boss: "mast",
    terrains: { plain: 66, wall: 18, ruin: 12, forest: 2, magma: 2 },
    intro:
      "Mast apareceu em dez universos ao mesmo tempo com a mesma frase: — \"Um torneio. Dez universos entram, um sai. Os perdedores... bem. Vocês entenderam.\" Ninguém sabe quem é Mast, nem que organização o manda. Só que a arena é real, as regras são reais, e a única saída é o pódio.",
    outro:
      "Mast aplaude, devagar, sozinho. — \"Vocês venceram. O seu universo fica.\" Ele tira a máscara por meio segundo — tempo suficiente para Ivad ver que não há rosto — e desaparece. O torneio nunca foi o objetivo. Era uma peneira.",
    reward: { frag: 40 },
  },
  {
    id: 9,
    name: "A Associação",
    locale: "Sede fora do tempo",
    scene: "🕵️",
    bg: "associacao",
    rows: 12,
    grunts: ["agente_associacao", "executor_equilibrio", "gladiador_mascarado", "sentinela_do_trono"],
    elites: ["diretor_associacao", "finalista_torneio", "general_civil", "carcereiro_deus"],
    boss: "xingzang_associacao",
    terrains: { plain: 58, wall: 22, ruin: 14, forest: 4, magma: 2 },
    intro:
      "A Associação diz que protege o equilíbrio do multiverso. O método: escolher quem vive e quem morre, com uma planilha. Eles salvaram mundos. Também apagaram mundos inteiros por 'risco projetado'. E no comando de uma das alas está um rosto conhecido — Xing Zang, vivo, ou algo com a cara dele, convencido de que o cálculo é mais importante que o coração.",
    outro:
      "— \"Você teria feito o mesmo\", diz Xing Zang, caído. Ivad estende a mão. — \"Não. E é por isso que a gente não é vocês.\" A Associação recua para fora do tempo. Não foi destruída. Só... contestada, pela primeira vez.",
    reward: { frag: 44 },
  },
  {
    id: 10,
    name: "Destruidores de Multiverso",
    locale: "A borda de tudo",
    scene: "💥",
    bg: "destruidores",
    rows: 12,
    grunts: ["arauto_destruidor", "entropia_viva", "protetor_renegado", "eco_absorvido"],
    elites: ["destruidor_menor", "protetor_multiverso", "diretor_associacao", "sombra_de_ivad"],
    boss: "cosmic_ivad",
    terrains: { plain: 44, ruin: 20, wall: 18, magma: 14, forest: 4 },
    intro:
      "Quando a poeira da Associação assenta, os dois lados finais aparecem: os Destruidores de Multiverso, que querem zerar tudo, e os Protetores, que querem segurar tudo. Os heróis ficam com os Protetores. Mas Ivad — cansado de deuses, torneios, clones e planilhas — para no meio do campo, olha para os aliados, e decide que só o próprio multiverso dele importa. Ele vira algo novo. Algo Cósmico.",
    outro:
      "Cosmic Ivad recua um passo. A aura de fim-de-tudo hesita. Do outro lado, os amigos não baixaram a guarda — mas também não atacaram. — \"...Eu quase fiz.\" A voz é dele de novo. \"Me tirem daqui antes que eu tente de novo.\"",
    reward: { frag: 60 },
  },
];

export function getChapter(id) {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}
