# PLANO v0.5 — "o salto"  ·  ENCERRADO

> ⛔ **Documento fechado. Não é mais roteiro — é registro histórico.**
> A leva v0.5 terminou e a v0.6 veio por cima. O que valia como plano virou patch note:
> o histórico completo está em `docs/patch-notes.md`, e o retrato do presente em `docs/ESTADO.md`.
> **Não planeje a partir daqui.** A fila atual está no `README.md`, em "Próximos passos".

**Aberto em:** 2026-08-09 · **Base:** v0.4.1 · **Encerrado em:** 2026-08-11, na v0.6.2

## O que dessa leva chegou, e o que não chegou

| Previsto no plano | Onde parou |
|---|---|
| Torre atacável | ✅ v0.5.1 — e a v0.6.1 completou: o herói cerca sem a onda, e o Nexus virou alvo |
| Objetivos épicos + comeback | ✅ v0.5.5 — poço, Dragão/Barão, Retomada. **Seguem sem validação:** a bateria é cega a escolha |
| Tipografia, paleta, arte dos 20, lore | ✅ v0.5.0 – v0.5.3 |
| Tamanho do mapa ("só cresce se pedirem espaço") | ✅ pediram — 8×8 → 9×9 na v0.6 → **11×11** na v0.6.2 |
| Acampamentos de selva | ❌ **não entrou.** A v0.6.2 abriu as 30 casas e deixou vazias — é o item 2 da fila hoje |
| Carta premium + página de campeões | ❌ não entrou |
| Camada de juice | ❌ não entrou |

---

<details>
<summary>Conteúdo original do plano, preservado como registro</summary>

---

## O diagnóstico que abriu a leva

Três achados no código, na ordem em que doem:

**1. Herói nenhum consegue atacar torre.** As torres existem no motor — `TORRES_DEF` em
`jogo/jogo.js:93`, vida 2, cerco em `jogo/jogo.js:234`. Mas a lista `alvos` só é preenchida com
`todos()` (`jogo.js:305` e `jogo.js:636`), que devolve heróis. O jogador empurra onda e espera.
O gesto central de MOBA — *eu derrubei essa torre* — não existe no jogo.

**2. A torre é um quadrado de 12px girado 45°** com um número dentro (`jogo.js:734`).
Mesmo depois de atacável, ela não lê como torre.

**3. Não existe webfont no projeto.** `--display` é `"Avenir Next Condensed"`, `--carto` é
`"Copperplate"`, `--body` é `"Iowan Old Style"` — fontes de sistema da Apple, em
`cartas/index.html:3-14`, `guia/index.html` e `jogo/estilo.css`. No Windows e no Android isso cai
para Arial Narrow e Georgia. **O jogo publicado nunca foi visto como foi desenhado.** É a causa
raiz do "está genérico" e o conserto mais barato da leva.

---

## Decisões travadas

| Questão | Decisão | Consequência |
|---|---|---|
| Trocar de engine? | **Não.** Vanilla + camada de juice (CSS animation, Web Animations API, canvas pontual) | Zero build sobrevive. Os três continuam editando arquivo direto. Pages continua funcionando. |
| Paleta | **Repaginar do zero.** Paleta nova, mais cor | ~45 imagens regeradas em lotes + CSS dos três arquivos reescrito |
| Primeiro lote de arte | **3 heróis de teste** antes dos outros 17 | Se a receita errar a mão, erra em 3 imagens |
| Fontes | Self-hosted em woff2 no repo, licença OFL | Sem CDN, sem npm — a regra do projeto continua de pé |

---

## As duas frentes

Rodam em paralelo porque quase não se cruzam.

### Frente A — Sistemas · branch `v05-sistemas`
Toca `jogo/jogo.js` e `data/catalogo.js`.

1. Torre atacável — o gesto que falta
2. Objetivos épicos (Dragão e Barão) — pressão de tempo
3. Comeback — freio da bola de neve *(desenhado junto com o 2: épico dá recurso pra quem já está na frente)*
4. Acampamentos de selva (Azul e Vermelho) — válvula contra dado ruim
5. Tamanho do mapa — só cresce se 2 e 4 pedirem espaço

### Frente B — Identidade · branch `v05-visual`
Toca `jogo/estilo.css`, `cartas/`, `guia/`, `arte/` e as fontes novas.

1. Tipografia self-hosted — conserta o bug de fonte e dá cara ao jogo
2. Lore, facções e os 20 heróis reidentificados — personagem com contradição, não arquétipo
3. Direção de arte e paleta nova — a receita que garante unidade
4. Lote de teste de 3 heróis → validação → os 17 restantes → cartas, itens, monstros, mapa
5. Carta premium — moldura, materiais, hierarquia
6. Página de campeões — substitui `cartas/index.html`
7. Camada de juice — dado, impacto, torre caindo, morte, virada de turno

**Único ponto de encontro:** `data/catalogo.js`. Lore mexe em nome e texto, sistemas mexem em
número. Quem for encostar nele avisa antes.

---

## Como isso vira versão

`v0.5` é o guarda-chuva da leva inteira. Cada bloco que entra na `main` sai como `v0.5.x` com
patch note próprio — a regra do projeto continua valendo: **mudou número, virou patch note, com
"de X para Y"**.

| Versão | O que fecha |
|---|---|
| v0.5.0 | Tipografia self-hosted + paleta nova aplicada no CSS |
| v0.5.1 | Torre atacável |
| v0.5.2 | Lore e facções em `data/catalogo.js` |
| v0.5.3 | Arte nova dos 20 heróis |
| ~~v0.5.4~~ v0.5.5 | ✅ Objetivos épicos + comeback *(entraram juntos, como previsto)* — poço único em [4,4], Dragão/Barão, Retomada. Ficaram **sem validação**: a bateria é cega a mecânica de escolha, ver patch note |
| v0.5.5 | Carta premium + página de campeões |
| v0.5.6 | Acampamentos de selva |
| v0.5.7 | Camada de juice |

Ordem pode mudar; o que não muda é que **épicos e comeback entram no mesmo patch**.

## Regras que continuam valendo nesta leva

- `data/catalogo.js` é a fonte de verdade. Nunca escrever carta direto no HTML.
- `poderTotal` / `armTotal` / `ehAgil` são `const`. Reatribuir mata o script inteiro sem erro no
  console. Use `aplicaBuff` / `limpaBuffs`.
- Glossário é lei. A lore pode criar termo novo, mas termo antigo não muda de nome.
- Sem build, sem npm, sem CDN. Abre com duplo clique.
- Nomes e lore são autorais. Referência ao LoL é interna e só aparece nos docs.

</details>
