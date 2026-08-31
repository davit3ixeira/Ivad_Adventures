/**
 * chapters.js — os quatro capítulos da campanha roguelike.
 * Ambientação e nomes seguem "As Aventuras de Ivad".
 *
 * rows     : quantas linhas o mapa de nós tem
 * grunts   : pool de tropa comum para nós ⚔️
 * elites   : pool para nós ☠️ (Irmãos Demônios / comandantes)
 * boss     : inimigo do nó final 🔱
 * terrains : pesos de terreno usados na geração do grid de batalha
 */

export const CHAPTERS = [
  {
    id: 1,
    name: "A Sombra de Haluho",
    locale: "Terra ⟶ Haluho",
    scene: "🌋",
    rows: 8,
    grunts: ["haluhu", "haluhu_osso", "espectro"],
    elites: ["huluhuluhu", "holoholoho", "helehelehe"],
    boss: "halahalaha",
    terrains: { plain: 60, magma: 16, wall: 14, forest: 6, ruin: 4 },
    intro:
      "Haluho tem um céu rubro que parece chorar sangue, e a Semente Primordial pulsa no seu centro como um coração maligno — faminta. Haluhaluhu quer a Terra pelas almas que ela abriga. Takimatida ensinou o Super Soco e o Super Chute; agora é atravessar o portal e enfrentar os cinco Irmãos Demônios. O último a cair será Halahalaha.",
    outro:
      "Halahalaha tomba no platô, ainda sorrindo. Os cinco irmãos caíram — mas do fundo de Haluho, o riso de Haluhaluhu sobe pelas rochas. Isto foi apenas o começo.",
    reward: { frag: 22 },
  },
  {
    id: 2,
    name: "O Treinamento com Xing Zang",
    locale: "Dojo nas Montanhas",
    scene: "⛩️",
    rows: 9,
    grunts: ["discipulo_caido", "sombra_escolhido", "espectro", "projecao_hostil"],
    elites: ["hilihilihi", "colosso_projecao", "huluhuluhu"],
    boss: "takimatida_sombrio",
    terrains: { plain: 52, forest: 26, wall: 14, ruin: 6, magma: 2 },
    intro:
      "No dojo de Xing Zang — um templo entre árvores altas e um rio cristalino — aprende-se que poder sem controle é tempestade sem direção. Meditação, Soco Forte, Soco da Natureza. Mas uma sombra cósmica já se move: Takimatida caiu nas trevas e virou O Escolhido, decidido a remodelar o universo. Xing Zang partiu para enfrentá-lo sozinho. É preciso alcançá-lo.",
    outro:
      "A armadura negra racha e O Escolhido se dissipa em fumaça — por ora. O preço foi alto: Xing Zang deu tudo o que tinha. O que Takimatida virou ainda está lá fora, se fortalecendo.",
    reward: { frag: 26 },
  },
  {
    id: 3,
    name: "A Ameaça de Korlok",
    locale: "Planeta Poder",
    scene: "👁️",
    rows: 10,
    grunts: ["guerreiro_poder", "corrompido_macula", "bruto_magma", "projecao_hostil"],
    elites: ["colosso_projecao", "helehelehe", "holoholoho", "sentinela_alfa"],
    boss: "korlok",
    terrains: { plain: 58, wall: 22, ruin: 12, magma: 6, forest: 2 },
    intro:
      "Korlok tem três metros de altura e uma agilidade que não deveria caber num corpo daquele tamanho. Cravado no seu peito gira o Olho do Caos — uma Relíquia de Mácula que não deveria existir na Terra. Cada turno que passa, ele fica mais forte. É preciso arrancá-la dele antes que a fome do caos alcance a Semente.",
    outro:
      "O Olho do Caos se apaga. Korlok cai de joelhos, o corpo tremendo. O Poderoso se aproxima devagar: — \"Segurar isso não é uma vitória. É um fardo.\" E aponta para cima.",
    reward: { frag: 30 },
  },
  {
    id: 4,
    name: "O Despertar Universal",
    locale: "Centris, sob os sóis gêmeos",
    scene: "🌟",
    rows: 11,
    grunts: ["sombra_escolhido", "corrompido_macula", "guerreiro_poder", "projecao_hostil", "espectro"],
    elites: ["halahalaha", "sentinela_alfa", "colosso_projecao", "huluhuluhu", "helehelehe"],
    boss: "haluhaluhu",
    terrains: { plain: 50, ruin: 20, wall: 18, magma: 10, forest: 2 },
    intro:
      "No trono de ossos e magma, Haluhaluhu abre os olhos. Ele não é só o rei dos demônios — é a extensão da Semente Primordial, e quanto mais ela se alimenta, mais forte ele fica. As planícies douradas de Centris, sob os dois sóis, são a última linha. Que a lenda de Ivad se decida aqui.",
    outro:
      "O silêncio depois de Haluhaluhu é ensurdecedor. A Semente se aquieta. Os mundos voltam a respirar — e as planícies de Centris seguem douradas sob os sóis gêmeos.",
    reward: { frag: 40 },
  },
];

export function getChapter(id) {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}
