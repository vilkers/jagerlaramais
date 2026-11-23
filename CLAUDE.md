# MOBA TCG — projeto

Jogo de cartas/tabuleiro com mecânica de MOBA (base de referência: League of Legends).
Time: Vilker, Vinicius, Matheus.

## Estrutura

```
docs/       regras, design, decisões
data/       conteúdo do jogo em JSON (campeões, itens, monstros) — fonte única de verdade
guia/       guia web (HTML/CSS/JS vanilla, sem build)
sim/        scripts de balanceamento e simulação
arte/       assets gerados
```

## Regras do projeto

- **`data/catalogo.js` é a fonte de verdade** do conteúdo (heróis, itens, deck, classes, `textoHab()`).
  `jogo/`, `guia/` e `cartas/` leem daí. Nunca escreva carta direto no HTML — já criou três catálogos divergentes uma vez.
- **`poderTotal`/`armTotal`/`ehAgil` são `const`** — reatribuir mata o script inteiro sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
- **Guia web é vanilla** — sem framework, sem npm, sem CDN. Abre com duplo clique.
  **Exceção declarada:** `visual-lab/` é a área de criação (universo, personagens, visual, lore),
  tocada pelo Vilker com o ChatGPT, e preserva o snapshot anterior (Next/React/Vite), mas o guia publicado agora é estático.
  **Não deve ser apagada** por causa de diferenças de stack. O que nasce lá só entra no jogo depois de
  o guide estar fechado, e entra em cima da base mecânica — nunca por cima dela.
- **Nomes e lore são autorais.** Referência mecânica ao LoL é interna e explícita nos docs; nunca no produto.
- **Glossário é lei.** Termo definido não muda de nome. Ver `docs/glossario.md`.
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`.

## Quem mexe em quê

| Trilha | Onde | Quem |
|---|---|---|
| **Mecânica** — motor, regras, balanceamento, bugs | `jogo/` `data/` `sim/` `docs/` | Claude Code |
| **Criação** — universo, personagens, visual, lore, carta | `visual-lab/` | Vilker + ChatGPT |

As duas rodam em paralelo e não se cruzam. `docs/lore.md` é rascunho arquivado da trilha de
mecânica e **não é canon** — o canon criativo mora em `visual-lab/`.

## Agentes do projeto

| Agente | Para quê |
|---|---|
| `@game-director` | Escopo, o que entra e o que corta, roadmap |
| `@moba-analyst` | Como funciona no LoL e como traduzir pra mesa |
| `@systems-designer` | Mecânicas, loop de turno, economia |
| `@balance-math` | Probabilidade, TTK, curvas, simulação |
| `@card-smith` | Texto e nome de cartas, templating |
| `@web-prototyper` | Guia web |
| `@playtester` | Quebrar o jogo antes dos jogadores |
| `@ux-game` | Onde o jogador trava, tutorial, clareza de tela |

Agentes globais úteis: `@designer` (layout/tipografia), `@criativo` (QA de identidade), `@prompteiro` (arte das cartas).

## Estado atual

Base mecânica v55.1; estado e plano vigentes em docs/ESTADO.md e docs/PIPELINE.md. Não repetir o resumo antigo v0.4: Dragão, Barão, Retomada e protótipo de salas já existem.

A criação publicada vem de visual-lab/content/, ui/ e tools/build-visual-guide.mjs. O app/ React recuperado do ChatGPT é snapshot histórico. O pipeline vigente tem cinco etapas e três personagens ativos. Manifest de preservação em visual-lab/archive/sites-v8/manifest.json.

Após editar a criação, rodar node tools/build-visual-guide.mjs e node tools/check-visual-guide.mjs. Não mudar números do jogo por inferência de lore ou desenho. A interface atual do Visual Guide é estática e mantém a trilha criativa separada do catálogo mecânico.
