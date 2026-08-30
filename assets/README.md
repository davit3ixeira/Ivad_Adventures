# Assets

Ainda **não temos arte final**. O jogo roda 100% com emoji + CSS por enquanto.
Quando os assets chegarem, é só soltar os arquivos nas pastas abaixo e apontar o
caminho em [`js/data/manifest.js`](../js/data/manifest.js). Nenhum outro arquivo
precisa mudar — todo o resto do código pede a arte por `asset(id)`.

```
assets/
├── heroes/      retratos e sprites dos heróis   (ex: ivad.png, ivad_full.png)
├── enemies/     retratos e sprites de inimigos/chefes
├── tiles/       texturas de terreno do grid      (magma.png, floresta.png, ...)
├── ui/          ícones de moeda, molduras de raridade, botões
├── bg/          fundos de tela (santuário, Haluho, dojo, ...)
└── audio/
    ├── bgm/     músicas
    └── sfx/     efeitos (invocação, soco, vitória, ...)
```

## Formatos sugeridos

| Uso            | Formato          | Tamanho alvo         |
|----------------|------------------|----------------------|
| Retrato herói  | PNG/WebP quadrado| 256×256              |
| Sprite de grid | PNG transparente | 96×96                |
| Fundo de tela  | WebP/JPG         | 1920×1080            |
| BGM            | OGG/MP3 loop     | —                    |
| SFX            | OGG/WAV curto    | —                    |

Enquanto as pastas estiverem vazias, `asset()` devolve `null` e a UI cai
automaticamente no emoji definido em cada ficha de herói/inimigo.
