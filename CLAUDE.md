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

- **`data/catalogo.js` é a fonte de verdade** do conteúdo (heróis, **os 22 itens**, deck, classes, `textoHab()`).
  `jogo/`, `guia/` e `cartas/` leem daí. Nunca escreva carta direto no HTML — já criou três catálogos divergentes uma vez.
  `node sim/docs.js` falha se alguma página declarar lista própria.
- **`poderTotal`/`armTotal`/`ehAgil` são `const`** — reatribuir mata o script inteiro sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
- **Guia web é vanilla** — sem framework, sem npm, sem CDN. Abre com duplo clique.
  **Exceção declarada:** `visual-lab/` é a área de criação (universo, personagens, visual, lore),
  tocada pelo Vilker com o ChatGPT, e tem stack própria (Next/React/Vite). Não é o guia, não segue
  esta regra e **não deve ser apagada** por causa dela. O que nasce lá só entra no jogo depois de
  o guide estar fechado, e entra em cima da base mecânica — nunca por cima dela.
- **Nomes e lore são autorais.** Referência mecânica ao LoL é interna e explícita nos docs; nunca no produto.
- **Glossário é lei.** Termo definido não muda de nome. Ver `docs/glossario.md` — termo novo entra
  lá **e** na lista `GLOSS` do guia, na mesma mudança.
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`, dizendo de quanto para quanto.
- **Número do jogo não se escreve à mão em documento.** Escreve-se marcado —
  `<!--n:vidaTorre-->3<!--/n-->` — e o marcador some ao ler. Mudou o jogo, rode:

  ```bash
  node sim/docs.js --escrever   # atualiza os números da documentação
  node sim/docs.js              # confere o resto; sai com 1 se algo divergir
  ```

  Chaves em `node sim/numeros.js`. Regra inteira em `docs/DOCUMENTACAO.md`.
  **Medição** (`55,5% de quem começa`) é exceção: não vem do código, e se escreve à mão
  **sempre com o n e a versão**.
- **Regra desenhada e não implementada leva 🔸** em `docs/02-regras.md`. Documento não anuncia
  mecânica que a mesa não entrega.

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

v0.4 jogável: draft, deck de 46 cartas, **20 heróis (4 por rota, todos com arte)**, 22 itens, tutorial.

**Leia `docs/ESTADO.md` primeiro** — é o retrato do presente e foi feito para gastar pouco contexto.
Histórico em `docs/patch-notes.md`. Desenvolvimento em grupo em `docs/ECOSSISTEMA.md`.

Falta: objetivos épicos no tabuleiro, comeback, highlight do tutorial.
