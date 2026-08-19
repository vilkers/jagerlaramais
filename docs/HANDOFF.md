# HANDOFF — sessão de 17–18/08/2026 (v45 → v47)

> **Para continuar em outra janela do Claude:** cole este arquivo, ou peça para ele
> ler `docs/HANDOFF.md` no repositório. Depois dele, leia `docs/ESTADO.md` (retrato
> do presente) e `docs/DECISOES-PENDENTES.md` (medido e não decidido).

**Repositório:** `vilkers/jagerlaramais` · branch **`claude/jagerlaramais-hero-redesign-4b8qo2`**
**Último commit:** `54e2890` (v47) · **231 testes passando** · árvore limpa

---

## 0. LEIA ISTO PRIMEIRO — o estado que surpreende

**A `main` está na v15, de 11/08. Esta branch está 52 commits à frente dela.**

O handoff anterior dizia que a `main` estava na v23. Estava errado — `git log -1 main`
diz **v15**. A PR #3 (que trouxe v16→v39) foi mergeada, mas **não na `main`**.

Consequência prática: **nada do que está descrito aqui existe em qualquer link
publicado.** Não faça merge nem PR sem o Vilker pedir. O jeito de ele jogar é:

- **zip do site estático** arrastado em `app.netlify.com/drop` — é o que ele usa;
- `teste/JOGAR.html` — arquivo único de ~3,6 MB, tudo embutido, abre offline.

O zip se monta assim:

```
mkdir -p /tmp/site && cp -r index.html .nojekyll jogo guia cartas data arte teste /tmp/site/
cd /tmp/site && zip -qr ~/jagerlaramais.zip . -x '.*'
```

`index.html` tem que ficar **na raiz do zip**, sem pasta por fora.

---

## 1. O QUE ESTA SESSÃO FEZ

Três versões, todas a partir de relato do Vilker.

### v45 — a individualidade dos heróis

Ele disse: *"os heróis ainda parecem parecidos demais durante o gameplay"*. Dezoito
das vinte básicas tinham como regra inteira "causa dano".

- **registro central de 12 condições** (`CONDS`, em `data/catalogo.js`), contra as 2
  que existiam. Uma entrada nova ganha de graça ícone na peça, linha na ficha, aviso
  de aplicação, aviso de fim, tooltip, imunidade por Tenacidade e limpeza na morte;
- **registro de 20 passivas** (`PASSIVAS`, em `jogo/jogo.js`) com barramento de
  eventos, e **6 recursos de personagem**;
- **crítico virou 1,5× e sempre CONDICIONAL** — antes o 6 natural escrevia "CRÍTICO"
  no log e não fazia nada;
- **a tabela dos 20 kits está em `docs/KITS.md`**, feita para revisão herói a herói.

### v46 — seis relatos de playtest

Dois deles (rotação no início da rodada, trava da mesa) **constavam como resolvidos
no handoff anterior e não estavam no repositório.** Lição: handoff descreve
intenção, `grep` descreve o que existe.

1. rotação do Caçador antes dos turnos + **bônus por região**;
2. **`mesaTravada()`** — porta única do gesto humano;
3. o dado extra passou a **caber na barra** (era largura, não regra);
4. **vender item** por 60%;
5. a torre debaixo da própria peça virou alvo;
6. **alcance por habilidade** (`hb.alc`).

### v47 — o defensor passa a contar

Ele disse: *"tá muito fácil ganhar o jogo só empurrando torre"*. **A causa não era
número: o defensor não contava.**

`rotaDaPos` só dava presença a quem tinha **passado** da própria Torre Exterior.
Quem defende tem `idx === exterior`, e o teste pedia estritamente maior:

```
defensor em cima da própria torre exterior  → rota: null
atacante do outro time, na MESMA CASA       → rota: topo
```

Nenhuma posição do mapa fazia o defensor somar. **Defender era impossível, não
difícil.** A correção é uma frase: *quem está encostado na Frente de Onda conta*.

Depois, o relato de fecho: *"essa mudança tem que ocorrer para que quando for
jogador × jogador também faça sentido"* — e ele estava certo, ver §3.

---

## 2. AS REGRAS DO PROJETO QUE NÃO SE NEGOCIAM

Vêm do `CLAUDE.md` e do histórico. Quebrar qualquer uma custou versão inteira antes.

1. **`data/catalogo.js` é a fonte de verdade** do conteúdo. `jogo/`, `guia/` e
   `cartas/` leem de lá. Nunca escreva carta direto no HTML.
2. **Bug relatado vira TESTE antes de virar correção.** Se o teste não falha antes
   do conserto, ele não está testando o bug.
3. **Toda mudança de número vira patch note** em `docs/patch-notes.md`
   (append-only: entrada nova no topo, antiga nunca reescrita).
4. **Uma mudança de cada vez quando for medir** — senão o número não tem endereço.
   *Quebrei esta na v47 e paguei; ver §5.*
5. **`poderTotal`/`armTotal`/`ehAgil` são `const`.** Reatribuir mata o script inteiro
   sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
6. **`visual-lab/` não é o guia** — é a trilha de criação do Vilker com o ChatGPT,
   tem stack própria e **não deve ser apagada** pela regra do "vanilla".
7. **Nomear personagem e definir rota é trilha de CRIAÇÃO, não sua. Pergunte.**
8. **O guia e o jogo são vanilla** — sem framework, sem npm, sem CDN.
9. **Nada de identificador de modelo** em commit, PR, comentário de código ou
   qualquer artefato do repositório.

---

## 3. O QUE APRENDI SOBRE MEDIÇÃO — LEIA ANTES DE MEDIR QUALQUER COISA

### 3.1 Este jogo é HOTSEAT. Medir com a IA esconde o problema.

O erro mais caro da sessão. A v47 foi validada com o agente quase-aleatório e com a
IA, e nos dois a duração mal se moveu. Aí o Vilker perguntou de jogador × jogador:

| | v46 | v47 sem relógio |
|---|---|---|
| PvP, dois defensores competentes | 25,4 | **49,3 rodadas** |
| IA de verdade (mediana) | 24 | 25 |

**A IA compromete; dois humanos cautelosos não.** Nasceu daí o
`node sim/defesa.js 800 estilo=pvp`, que roda a mesma política defensiva dos dois
lados. **Use sempre que mexer em torre, onda, presença ou ritmo.**

### 3.2 Defesa forte demais protege quem está na frente

Contra-intuitivo e medido: *empate segura a torre* e *reparo de torre* foram
escritas, medidas e **descartadas** — as duas alongam a partida **e pioram** a bola
de neve. Quem lidera banca o corpo a mais e continua sitiando; quem está atrás
precisa de ataque.

**Medir sempre os dois eixos juntos: bola de neve E duração.**

### 3.3 O rótulo do script não é a conclusão

A bateria imprime "VANTAGEM REAL" quando `z` passa do limiar. `z` cresce com a raiz
de `n`, então **a mesma porcentagem troca de rótulo só por causa da amostra**:

```
n=2000 → 52,1% (z=1,88)  — dentro do ruído
n=3000 → 52,1% (z=2,34)  ← VANTAGEM REAL
```

A pergunta de desenho é *"mudou em relação à versão anterior?"*, não *"dá para
distinguir de 50%?"*.

### 3.4 250 partidas não bastam

Anunciei "77,6% → 63,6%" com n=250. A 1500 virou "72,8% → 65,5%". Direção certa,
precisão não. **Use n ≥ 800 para bola de neve, n ≥ 1500 para "quem começa".**

### 3.5 Não dá para instrumentar o motor por fora

O motor roda dentro de um `vm` próprio. **Trocar uma função na PONTE não muda quem
as funções internas chamam** — `g.fimDaRodada = wrapper` não pega, e
`g.aplicaCond = wrapper` também não. Os contadores dão **zero em tudo**, que é o
tipo de medição que mente com convicção. Aconteceu duas vezes (v45 e v47).

**O que funciona:** olhar o estado do tabuleiro de fora, no instante certo. Ver
`sim/condicoes.js` e `sim/defesa.js`, que fazem isso e explicam por quê.

### 3.6 A presença é congelada por turno

`J.presenca[t]` é escrita no fim do turno **daquele time**. Fotografar antes de um
turno e comparar depois mede errado para um dos lados. Isso me fez acusar "9,7% de
dano com empate" numa build onde empate não podia causar dano nenhum.

### 3.7 O de sempre

- `times=espelho` é **obrigatório** para mudança que toca herói, habilidade ou item;
- as chaves dos níveis de IA são `facil`/`normal`/`dificil`, não os nomes de
  exibição. `nivelIA="mestre"` cai silenciosamente no `normal`;
- **`sim/niveis.js` e `sim/condicoes.js` dirigem a IA de verdade.** Os outros usam o
  agente quase-aleatório, que NÃO é a IA do jogo;
- o harness **responde sozinho** à rotação do Caçador (senão a partida trava em
  `J.fase==="rotacao"`). Quem testa o **relógio** da rotação chama
  `g.rotacaoDeVerdade()`.

---

## 4. COMANDOS

```
node sim/testes.js                        # 231 testes de regressão
node sim/defesa.js 800 estilo=pvp         # HOTSEAT: defender é viável? a partida fecha?
node sim/defesa.js 800                    # o mesmo, com o agente quase-aleatório
node sim/defesa.js 800 defensor=off       # como era antes da v47
node sim/condicoes.js 200                 # as 12 condições aparecem na mesa?
node sim/bateria.js 3000 times=espelho    # estrutura + ordem  (~570s)
node sim/niveis.js 300                    # os 3 níveis, com a IA DE VERDADE
node sim/habs.js                          # cada habilidade contra a básica do próprio herói
node sim/epicos.js 2500                   # Dragão e Barão
node sim/ouro.js 600                      # economia
node sim/simetria.js                      # o tabuleiro é espelho de si mesmo?
node teste/empacota.js                    # regera teste/JOGAR.html
```

**Variantes da bateria:** `times=espelho` · `defensor=off` · `engrossa=N` ·
`ondamax=N` · `bonusrot=off` · `alchab=off` · `torre=N` · `curabase=N` · `dot=off` ·
`zonas=off` · `mapa=N` · `acao=N` · `mov=EXPR` · `epico=off` · `retomada=off` ·
`revide=off` · `ondas=off` · `dragao=N` · `barao=N` · `vdragao=N` · `heranca=N`

**Chromium está instalado** e Playwright abre o jogo de verdade:
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. **Use.** Vários defeitos desta
sessão só apareceram no clique real — o dado extra que não cabia na barra, o rótulo
que pintava empate de verde, a peça da IA que o humano conseguia mover.

---

## 5. ERROS QUE EU COMETI NESTA SESSÃO

1. **Medi um jogo de hotseat sem simular hotseat.** O maior. Foi o Vilker quem teve
   de apontar que faltava o teste. `estilo=pvp` devia ter nascido antes.
2. **Empilhei três regras de defesa e medi as três juntas.** Mediana de 24 para 41
   rodadas sem saber qual cobrava. Tive de voltar e criar as chaves de isolamento.
3. **Instrumentei o motor por fora, duas vezes, e as duas deram zero.** Ver §3.5.
4. **Pintei o empate de verde** no rótulo da rota. O jogador leria "dá para segurar"
   numa situação em que a torre continua caindo — informação errada na tela é pior
   que informação nenhuma.
5. **Confiei num número de 250 partidas.**
6. **Dei `tu:1` a condição posta em si mesmo.** O prazo cai no fim do turno de quem
   carrega, então `tu:1` no próprio turno nasce e morre antes de o adversário jogar.
   Para si mesmo ou aliado o valor certo é **`tu:2`**.
7. **Deixei a Tenacidade decrementar em vez de sair inteira.** Com `tu:2` ela
   anulava dois controles — na prática, imunidade.
8. **Paguei o bônus de região na virada da rodada**, e `expiraDoTime` o apagava
   antes de o dono jogar. Armadura e Poder eram letra morta; só ouro e cura chegavam
   à mesa. Foi a bateria que denunciou.
9. **Pus a troca de lugar da Zhet depois do dano**, e a passiva dela desfazia a
   troca. As duas metades do kit brigavam.

---

## 6. O QUE ESTÁ ABERTO

**Decisão do Vilker, do Vinicius e do Matheus:**

- **O merge para a `main`.** 52 commits esperando. Nada publicado.
- **Revisar `docs/KITS.md` herói por herói.** A v45 foi implementada sem a aprovação
  kit a kit que o pedido original previa — a tabela existe justamente para isso, e
  cada kit é **uma linha de `data/catalogo.js`**, sem tocar no motor.
- **A duração em hotseat.** Pior caso (dois defensores sempre defendendo) está em
  **40,1 rodadas**; a IA joga em 25. Se na mesa parecer arrastado, a alavanca medida
  é `ONDA_ENGROSSA` (hoje **16**) — mas passo menor **vaza vantagem de ordem**
  (54,4% para quem começa com passo 10, contra 51,6% sem relógio). O câmbio é ~5
  rodadas por ~1,5 ponto de desequilíbrio.
- **A Lentidão está em oito heróis.** Foi de propósito (ela é cola de kit), mas se
  parecer que todo mundo está sempre lento, o corte natural é tirar do Grumo e do
  Caramêlo, que já têm empurrão.
- **O Banimento aparece em ~14% das partidas.** Se parecer raro demais para valer a
  regra, a alavanca é o custo da Ultimate da Zhet (F5), não a duração.
- **A renda de ouro** — herói acumula 61, build de 3 itens mais caro custa 25.
- **Cartas de reação** — 3 cartas declaram `quando:"reacao"` e o motor nunca lê o
  campo. Item 4 de `DECISOES-PENDENTES`.
- **"Quem começa"** continua em ~52–53%. Item 11 de `DECISOES-PENDENTES`.

**Ainda não existe:** Arauto (tem arte, não tem regra) · highlight estilo LoL no
tutorial · comeback · multiplayer em rede (o jogo é hotseat).

---

## 7. ONDE AS COISAS MORAM

```
jogo/jogo.js        motor de regras + interface (~6.280 linhas)
jogo/estilo.css     TODA a aparência — mexer aqui não quebra regra
data/catalogo.js    heróis, itens, deck, classes, CONDS, RECURSOS, textoHab()
arte/herois/web/    retratos 293×440, nomeados pelo id do chassi
sim/motor.js        harness (DOM falso) · a PONTE expõe o que os testes usam
sim/agente.js       o jogador artificial quase-aleatório (NÃO é a IA do jogo)
sim/testes.js       231 testes de regressão
sim/defesa.js       defender é viável? · tem o modo estilo=pvp
sim/condicoes.js    as condições aparecem na mesa?
docs/ESTADO.md      retrato do presente — leia primeiro
docs/KITS.md        a tabela dos 20 kits, para revisão herói a herói
docs/REGRAS.md      regras completas, extraídas do motor
docs/patch-notes.md histórico, append-only
docs/DECISOES-PENDENTES.md   medido e não decidido
docs/DIRECAO-DE-ARTE.md      canon da OUTRA trilha — não é sua, mas não apague
```

**Pontos do motor que vale conhecer antes de mexer:**

| onde | o que é |
|---|---|
| `rotaDaPos` | quem exerce presença numa rota. **Foi aqui que a v47 consertou a defesa** |
| `fimDaRodada` | onda, cerco, renda, respawn, placas — a virada inteira |
| `mesaTravada()` | porta única do gesto humano. **A IA não passa por ela** |
| `aplicaCond` / `processaCondsInicio` / `processaCondsFim` | o ciclo das condições |
| `PASSIVAS` + `dispara()` | o barramento de eventos das passivas |
| `alcDeHab(h,hb)` | alcance da habilidade, não do herói |
| `contaRota(nome)` | a contagem que o rótulo da rota mostra. Obedece à névoa |

---

## 8. COMO O VILKER TRABALHA

- Ele manda **print da tela do celular** quando algo está errado. É a informação
  mais valiosa que chega — peça quando o relato for vago.
- Ele testa no **Netlify Drop**, não no GitHub Pages. Entregue o **zip**.
- Ele fala em português, direto e curto. Responda igual.
- Quando ele diz "tá quebrado", **reproduza antes de consertar**. Nesta sessão os
  três bugs relatados se reproduziram — e um deles (a Marca) revelou um defeito
  mais velho que a versão.
- **Ele pensa no jogo de mesa real.** O relato "isso tem que fazer sentido em
  jogador × jogador" reprovou uma versão inteira que estava verde em todos os
  outros números. Quando ele questionar uma premissa, é porque falta um teste.
