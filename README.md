# As Aventuras de Ivad — Selo Primordial

Um **gacha tático em grid** (estilo *Fire Emblem Heroes* + roguelike *Slay the Spire*)
ambientado no universo do livro **"As Aventuras de Ivad"**. 100% HTML, CSS e
JavaScript — **sem build, sem dependências, sem framework**.

![feito com HTML/CSS/JS](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-ff4d5e)

---

## ▶️ Como rodar

O jogo usa **ES Modules** (`import`/`export`), então **não abra o `index.html`
com dois cliques** — o navegador bloqueia módulos em `file://`. Precisa de um
servidor local (qualquer um serve). Escolha **uma** opção:

### Opção 1 — VS Code + Live Server (recomendada)
1. Abra a pasta `Ivad_Adventures` no VS Code.
2. Instale a extensão **Live Server** (o VS Code vai sugerir sozinho — veja abaixo).
3. Clique com o botão direito em `index.html` → **"Open with Live Server"**.
4. Abre em `http://127.0.0.1:5500`. Pronto.

### Opção 2 — Python (se tiver instalado)
```bash
cd Ivad_Adventures
python -m http.server 5500
# abra http://localhost:5500
```

### Opção 3 — Node (se tiver instalado)
```bash
cd Ivad_Adventures
npx serve .
```

### Opção 4 — extensão "Preview" / qualquer live-server do seu editor
Serve qualquer coisa que entregue os arquivos por HTTP.

> Testado em Chrome, Edge e Firefox atuais. Guarda o progresso no `localStorage`
> do navegador.

---

## 🧩 Extensões do VS Code

Ao abrir a pasta, o VS Code mostra **"Este workspace tem recomendações de
extensões"** → clique em **Instalar tudo**. São elas (`.vscode/extensions.json`):

| Extensão | ID | Para quê |
|---|---|---|
| **Live Server** | `ritwickdey.liveserver` | rodar o jogo (essencial) |
| **ESLint** | `dbaeumer.vscode-eslint` | apontar erros de JS enquanto edita (opcional) |
| **Prettier** | `esbenp.prettier-vscode` | formatação automática (opcional) |

Só a **Live Server** é obrigatória. As outras são conforto de desenvolvimento.

---

## 🎮 Como se joga

1. **Portal de Invocação** — gaste 🌱 *Sementes Primordiais* para invocar heróis
   (3★/4★/5★, com *pity*). Lote de 5 garante um 4★.
2. **Coleção & Esquadrão** — escale até **4 heróis**.
3. **Nova Jornada** — escolha um capítulo e entre no **mapa de nós ramificados**:
   - ⚔️ Batalha · ☠️ Elite · 🔱 Chefe · ❓ Evento · 🛒 Loja · ⛺ Descanso
4. **Batalha tática** — grade 8×6, terrenos (magma, floresta, rocha, ruínas),
   **triângulo de afinidades** 🔴→🟢→🔵→🔴 (±30%), ataque duplo com +5 de SPD.
5. A cada vitória, escolha **1 de 3 Cartas de Mácula** (buffs da run).
   HP **não** regenera entre batalhas — só em ⛺.
6. Derrote o chefe do capítulo para liberar o próximo.

**Atalho de dev:** abra com `?rico` na URL para ganhar 500 🌱.

---

## 📁 Arquitetura

```
Ivad_Adventures/
├── index.html              # casca: monta #app, carrega css/ e js/main.js
├── README.md
├── .vscode/
│   └── extensions.json     # recomendações (Live Server, ESLint, Prettier)
├── .editorconfig
├── assets/                 # arte/áudio (VAZIO por enquanto — ver assets/README.md)
│   ├── heroes/  enemies/  tiles/  ui/  bg/  audio/
│   └── README.md
├── css/
│   ├── main.css            # tema, variáveis, componentes base, toasts, modal
│   ├── screens.css         # menu, invocação, coleção, mapa, eventos, loja
│   └── battle.css          # grade tática, unidades, HUD de combate
└── js/
    ├── main.js             # boot: init de estado, registro de rotas, topbar
    ├── core/               # infraestrutura, sem regra de jogo
    │   ├── bus.js          #   event bus (pub/sub)
    │   ├── rng.js          #   RNG determinístico (mulberry32) + RNG global
    │   ├── storage.js      #   wrapper de localStorage versionado
    │   └── state.js        #   estado global: meta (permanente) + run (atual)
    ├── data/               # conteúdo puro (dados, sem lógica)
    │   ├── heroes.js       #   11 heróis invocáveis + escala de atributos
    │   ├── enemies.js      #   tropa, Irmãos Demônios, chefes + escala
    │   ├── chapters.js     #   os 4 capítulos da campanha
    │   ├── upgrades.js     #   Cartas de Mácula (buffs temporários da run)
    │   ├── relics.js       #   Relíquias de Mácula (efeitos permanentes na run)
    │   ├── narrative.js    #   eventos aleatórios com escolhas
    │   └── manifest.js     #   ponte ID → arquivo de arte/áudio (+ fallback emoji)
    ├── systems/            # regras de jogo (sem DOM)
    │   ├── gacha.js        #   invocação, taxas, pity
    │   ├── run.js          #   controlador da run: mapa, moedas, relíquias, eventos
    │   ├── mapgen.js       #   geração do mapa de nós ramificados
    │   ├── pathfind.js     #   Dijkstra/BFS no grid, alcances
    │   ├── affinity.js     #   triângulo de energias
    │   ├── battle.js       #   modelo de combate tático (turnos, dano, follow-up)
    │   └── ai.js           #   decisão dos inimigos (rusher/kiter/guard/boss)
    └── ui/                 # camada de tela (só aqui se toca no DOM)
        ├── router.js       #   troca de telas
        ├── toast.js        #   notificações + modal
        ├── components.js   #   helpers de render (ficha de herói, barras, ...)
        ├── menu.js         #   Santuário (tela inicial)
        ├── gacha.js        #   Portal de Invocação
        ├── roster.js       #   Coleção & Esquadrão
        ├── map.js          #   Mapa roguelike
        ├── sites.js        #   nós de Evento / Loja / Descanso
        ├── reward.js       #   espólios + escolha de Carta de Mácula
        └── battle.js       #   tela de combate
```

### Princípios

- **`data/` não importa nada** de `systems/` ou `ui/` — é só conteúdo. Adicionar
  um herói/inimigo/evento/capítulo é editar um arquivo de dados.
- **`systems/` não toca no DOM.** Lógica testável isoladamente.
- **`ui/` é a única camada com `document`.** Cada tela é uma função
  `render(mount, params)` registrada no `router`.
- **`core/bus.js`** desacopla: os sistemas emitem eventos (`roster:changed`,
  `run:changed`, ...) e a UI reage.
- **Estado**: `state.meta` é permanente (salvo sempre); `state.run` é a run atual
  (também salva, para retomar). Um `SAVE_VERSION` invalida saves incompatíveis.

### Quando a arte chegar

Solte os arquivos em `assets/…` e preencha os caminhos em
[`js/data/manifest.js`](js/data/manifest.js). O resto do código já pede a arte por
`portrait()` / `asset()` / `playSfx()` e cai no emoji enquanto o arquivo não
existe. **Nenhuma outra mudança é necessária.**

---

## 🔧 Ajustes rápidos de balanceamento

| O quê | Onde |
|---|---|
| Taxas do gacha / pity / custos | `js/systems/gacha.js` (const `GACHA`) |
| Sementes iniciais | `js/core/state.js` (`STARTING_SEMENTES`) |
| Atributos e habilidades dos heróis | `js/data/heroes.js` |
| Escala de dificuldade dos inimigos | `js/data/enemies.js` (`enemyStats`) |
| Tamanho do grid / dano de magma | `js/systems/battle.js` (topo do arquivo) |
| Nº de linhas e pools de cada capítulo | `js/data/chapters.js` |
| Cartas de upgrade e relíquias | `js/data/upgrades.js`, `js/data/relics.js` |

---

## Lore

Baseado em *As Aventuras de Ivad*: Terra, **Haluho** (planeta demoníaco de céu
rubro), o **Dojo de Xing Zang**, o **Planeta Poder** e **Ariexiet** dos sóis
gêmeos. Heróis como **Ivad**, **Takimatida**, **Xing Zang**, **Poderoso** e
**KetchouEtchou** enfrentam os **Irmãos Demônios**, **Korlok** (o Olho do Caos),
**O Escolhido** e o Rei Demônio **Haluhaluhu**.
