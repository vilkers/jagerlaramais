# MOBA TCG — projeto

Jogo de cartas/tabuleiro com mecânica de MOBA (base de referência: League of Legends).
Time: Vilker, Vinicius, Matheus.

## Estrutura

```
jogo/       o jogo (index.html + estilo.css + jogo.js) — motor de regras e interface
data/       catalogo.js — heróis, itens, deck, classes. Fonte única de verdade
guia/       guia web navegável (HTML/CSS/JS vanilla, sem build) — o glossário mora aqui, seção 09
cartas/     visualizador das cartas de herói
sim/        scripts de balanceamento e simulação (bateria, simetria, motor headless)
teste/      JOGAR.html — o jogo inteiro em arquivo único, para mandar pra alguém testar
docs/       regras, design, decisões
arte/       assets gerados
visual-lab/ trilha de criação (ver exceção declarada abaixo)
```

## Regras do projeto

- **`data/catalogo.js` é a fonte de verdade** do conteúdo (heróis, itens, deck, classes, `textoHab()`).
  `jogo/`, `guia/` e `cartas/` leem daí. Nunca escreva carta direto no HTML — já criou três catálogos divergentes uma vez.
- **`poderTotal`/`armTotal`/`ehAgil` são `const`** — reatribuir mata o script inteiro sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
- **Guia web é vanilla** — sem framework, sem npm, sem CDN. Abre com duplo clique.
  **Exceção declarada:** `visual-lab/` é a área de criação (universo, personagens, visual, lore),
  tocada pelo Vilker com o ChatGPT, e tem stack própria (Next/React/Vite). Não é o guia, não segue
  esta regra e **não deve ser apagada** por causa dela. O que nasce lá só entra no jogo depois de
  o guide estar fechado, e entra em cima da base mecânica — nunca por cima dela.
- **Nomes e lore são autorais.** Referência mecânica ao LoL é interna e explícita nos docs; nunca no produto.
- **Glossário é lei.** Termo definido não muda de nome. Ele vive na seção 09 do `guia/index.html`
  (não existe `docs/glossario.md` — os termos candidatos a entrar estão em `docs/lore.md`).
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`, dizendo de X para Y.
- **Número no doc se tira do código, não da memória.** `sim/motor.js` carrega o jogo em Node;
  dá para ler qualquer `const` por ponte, como o `sim/simetria.js` faz. Doc que contradiz o
  código é bug de doc.

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

**v0.6.2**, na `main`. Draft com ban, deck de 46 cartas (22 tipos), **20 heróis (4 por rota, todos
com arte)**, 22 itens, tutorial de 9 passos. Tabuleiro **11×11** (116 casas), simétrico por
construção e verificado por teste. Poço épico com Dragão e Barão, Retomada como freio de bola de
neve, herói derruba torre e Nexus sozinho, ergonomia de toque auditada.

**Leia `docs/ESTADO.md` primeiro** — é o retrato do presente e foi feito para gastar pouco contexto.
Histórico em `docs/patch-notes.md`. Desenvolvimento em grupo em `docs/ECOSSISTEMA.md`.
Fila de trabalho em `README.md`, seção "Próximos passos".

**O gargalo hoje não é código, é playtest.** Épico, Retomada e loja estão no jogo e nunca foram
avaliados por gente. `sim/bateria.js` **é cega a mecânica de escolha** — ela mede estrutura
(geometria, onda, torre, ritmo) e não mede decisão; medido, dar 6 dados extras à Retomada não moveu
o número. Antes de propor ajuste nessas três coisas, leia o cabeçalho de `sim/bateria.js`.

Falta: acampamentos de selva (as 30 casas existem e estão vazias), reavaliar o tabuleiro em tela
pequena depois do salto para 11×11, Arauto, zona de armadilha, highlight do tutorial.
