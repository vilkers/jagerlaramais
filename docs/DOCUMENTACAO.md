# Como a documentação se mantém sozinha

> Leia antes de mexer em qualquer número do jogo.

## O problema, com nome e sobrenome

Os números do jogo moram em `jogo/jogo.js` e `data/catalogo.js`. Até a v0.6.2 eles eram
**copiados à mão** para o README, para as regras e para o ESTADO. Copiar à mão funciona
uma vez. Na terceira versão, a documentação anuncia um jogo que não existe.

O que estava errado no dia em que este sistema nasceu — nada disso é hipótese:

| Onde | Dizia | O jogo fazia |
|---|---|---|
| `README.md` | Nexus com 5 de vida, v0.4, ~15 rodadas | <!--n:vidaNexus-->3<!--/n--> de vida, <!--n:versao-->v0.6.3<!--/n-->, ~19 rodadas |
| `docs/02-regras.md` | torre só apanha com a onda em cima | herói cerca sozinho desde a v0.6.1 |
| `docs/ESTADO.md` | poço na casa `[4,4]` | `[8,8]` — o `[4,4]` só vale em tabuleiro 8×8 |
| `guia/index.html` | "Ampulheta Rachada: re-rolar 1 dado" | +1 no Dado Mestre |
| `guia/` e `cartas/` | rótulo v0.4 | três versões atrás |

O padrão é sempre o mesmo: **o jogo anda, o documento fica.** E ninguém percebe, porque
documento errado tem exatamente a mesma cara de documento certo.

---

## A regra

> **Número que sai do código não se escreve à mão em documento. Escreve-se marcado.**

```
A torre tem <!--n:vidaTorre-->3<!--/n--> de vida.
```

O marcador é comentário HTML: **some** no GitHub e no navegador. O leitor vê só "3".
Quem confere é `node sim/docs.js`; quem atualiza é `node sim/docs.js --escrever`.

A lista de chaves disponíveis sai de `node sim/numeros.js`, e cobre mapa, estruturas,
poço, épicos, Retomada, conteúdo do catálogo e economia da rodada.

---

## A rotina, em três linhas

Mudou número do jogo (vida de torre, tamanho do mapa, preço de item, herói novo):

```bash
node sim/docs.js --escrever    # a documentação se ajusta
node sim/docs.js               # confere o resto (glossário, fonte única, efeitos)
# e então: escreva o patch note, dizendo DE QUANTO PARA QUANTO
```

O patch note continua sendo escrito à mão, e isso é de propósito: ele guarda a **razão**
da mudança, e razão nenhum script deduz.

---

## O que o `sim/docs.js` confere

| # | Verificação | Falha? |
|---|---|---|
| 1 | Todo marcador bate com o valor real no código | sim |
| 2 | A versão do `ESTADO.md` é a mesma da primeira entrada do patch note | sim |
| 3 | O glossário do guia e o `docs/glossario.md` definem os mesmos termos de mesa | sim |
| 4 | `guia/` e `cartas/` **não** declaram lista própria de herói ou item | sim |
| 5 | Todo efeito usado no catálogo existe no motor | sim |
| 6 | Todo herói tem retrato em `arte/imagens.js` | sim |
| 7 | Pendências conhecidas (mapa do guia, cartas de reação, `ref. de kit`) | **não**, avisa |

A verificação 4 é a que mais importa. É a lei nº 1 do projeto — *conteúdo mora no
catálogo* — e ela já foi quebrada três vezes: três catálogos de herói na v0.3, e a lista
de itens do guia, que sobreviveu até a v0.6.3 anunciando efeitos de outra versão. O teste
existe para que a quarta vez não passe.

A verificação 5 pega o erro mais silencioso do projeto: efeito com nome errado em
`data/catalogo.js` não quebra nada — a habilidade simplesmente **não faz nada**, e isso
só aparece em playtest.

---

## O que ele NÃO faz — e não deve fingir que faz

**Não confere prosa.** "A onda tira 1 por rodada" continua sendo responsabilidade de
quem escreve. O marcador cobre o número; a frase em volta dele é sua.

**Não confere medição.** `55,5% para quem começa`, `mediana de 19 rodadas` — isso não sai
do código, sai de `sim/bateria.js`, e muda quando a build muda. Medição se escreve à mão,
**sempre com o n e a versão**: `55,5% (z=15,41, n=20000, v0.6.2)`. Número de medição sem
n é boato.

**Não toca em `docs/patch-notes.md`.** Patch note é histórico append-only: os números dele
**são** o passado ("de 9×9 para 11×11"), e reescrevê-los apagaria a memória do projeto. O
script recusa marcador ali.

**Não sabe se o jogo ficou melhor.** Ele só garante que a documentação descreve o jogo
que existe — não que o jogo que existe presta. Isso é playtest.

---

## Quando o marcador vale a pena, e quando não

Marque quando o número **é derivado do código** e aparece em documento que alguém lê para
decidir: vida de estrutura, tamanho de mapa, contagem de conteúdo, rodada de épico.

Não marque:

- número dentro de patch note (é histórico);
- número de medição (não vem do código);
- número que só existe na prosa como exemplo ("tirou 4? são 4 casas");
- número de tela, CSS, pixel — esses vivem no `estilo.css` e não têm fonte única.

Marcador demais deixa o texto difícil de editar à mão para quem não usa o script. Marque
o que envelhece.

---

## Termo novo, herói novo, item novo

| Você fez | Faça também |
|---|---|
| Herói novo | `data/catalogo.js` + `arte/herois/web/<id>.jpg` + entrada em `arte/imagens.js`. O draft, o guia e as cartas o pegam sozinhos |
| Item novo | Só `data/catalogo.js`, em `ITENS_NOVOS`. Loja e guia leem de lá |
| Termo novo | `docs/glossario.md` **e** a lista `GLOSS` do guia, na mesma mudança |
| Número mudado | `node sim/docs.js --escrever` + patch note |
| Regra desenhada e não implementada | marque com 🔸 em `docs/02-regras.md`. Regra que a mesa não entrega não pode aparecer como vigente |

---

## Se o script quebrar

`sim/numeros.js` lê alguns números direto do **texto** de `jogo/jogo.js`, por expressão
regular — o ouro de quem farma, o respawn, a mão máxima. Não têm nome de constante para
segurar. Se você reescrever uma dessas linhas, o script **derruba o processo com o nome
do número que sumiu**, de propósito: número que some em silêncio vira documentação errada
com cara de certa.

Quando isso acontecer, atualize o padrão em `sim/numeros.js` — não apague a linha.
