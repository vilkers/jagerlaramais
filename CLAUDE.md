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
  tocada pelo Vilker com o ChatGPT, e tem stack própria (Next/React/Vite). Não é o guia, não segue
  esta regra e **não deve ser apagada** por causa dela. O que nasce lá só entra no jogo depois de
  o guide estar fechado, e entra em cima da base mecânica — nunca por cima dela.
- **Nomes e lore são autorais.** Referência mecânica ao LoL é interna e explícita nos docs; nunca no produto.
- **Glossário é lei.** Termo definido não muda de nome. Ver `docs/glossario.md`.
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`.
- **Arquivo autocontido é saída, não fonte.** `teste/JOGAR.html` é gerado por `teste/empacota.js`.
  Nunca substituir `jogo/index.html` por esse pacote. Seguir `docs/UPDATE-PROTOCOL.md`.

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

v15.1 pós-playtest, em validação: draft hotseat, deck de 46 cartas, **20 heróis (4 por rota, todos com arte)**,
22 itens, tutorial, três acampamentos, Plano de Caça, feitiço compartilhado e objetivos épicos.

**Leia `docs/ESTADO.md` primeiro** — é o retrato do presente e foi feito para gastar pouco contexto.
Histórico em `docs/patch-notes.md`. Desenvolvimento em grupo em `docs/ECOSSISTEMA.md`.
Registro da integração atual em `docs/versions/v15.1/README.md`.

Falta: playtest de confirmação da v15.1, decisão sobre os números não documentados, Arauto e highlight do tutorial.
