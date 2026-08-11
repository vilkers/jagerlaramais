# Patch notes — JAGERLARAMAIS

Histórico de mudanças. **Append-only**: entrada nova vai no topo, entrada antiga nunca é reescrita.
Regra do projeto: *toda mudança de número vira patch note.*

Como escrever uma entrada:

```
## vX.Y — título curto · AAAA-MM-DD
### O que mudou
### Por quê
### O que isso quebra
```

Se você mudou um número, a linha tem que dizer **de quanto para quanto**.

---

## v0.6.2-docs — a documentação alcança o código · 2026-08-11

> Nenhum número do jogo mudou. Esta entrada é **só de documentação** — e da auditoria
> que a produziu. A v0.6.2 passa a ser **a build corrente**: foi revisada, mergeada
> (PR #1 + os commits seguintes) e o aviso de "em teste, não aprovado" das entradas
> abaixo está vencido. Elas ficam como estão: patch note é append-only.

### O que mudou

Os docs foram conferidos **contra o código**, não contra a memória — as constantes
foram lidas em tempo de execução por ponte no `sim/motor.js`, do mesmo jeito que o
`sim/simetria.js` faz. Sete divergências encontradas e corrigidas:

| Onde | Dizia | É |
|---|---|---|
| `ESTADO.md`, `README.md` | Poço épico na casa **[4,4]** | **[8,8]** — a casa é derivada de `N` e mudou junto com o tabuleiro |
| `02-regras.md` | Nexus com **5 de vida** | **3** |
| `02-regras.md` | Respawn de **3 rodadas** para quem tem o dobro de ouro | Não existe: **2 rodadas fixas** para todo mundo |
| `02-regras.md` | Dupla dá **+2 de Poder e +2 de Armadura** | Só **+2 de Poder** |
| `ESTADO.md` | Corredor com **2 de largura nas três rotas** | O meio sim; **topo e baixo têm um passo de 1 casa** |
| `teste/LEIA.md` | Selva de **38 casas** | **30** |
| `CLAUDE.md` | Glossário em `docs/glossario.md` | O arquivo nunca existiu — o glossário é a seção 09 do `guia/index.html` |

Além disso: `CLAUDE.md` e `README.md` saíram de **v0.4** para **v0.6.2**; o
`PLANO-v05.md` foi **encerrado** (o próprio cabeçalho mandava que ele morresse quando
a v0.5 fechasse); `02-regras.md` ganhou as seções do **poço épico** e da **Retomada**,
que estavam no jogo e não estavam nas regras; e a lista "o que ainda não está definido"
perdeu loja, draft e comeback, que já entraram.

Numeração das armadilhas do `ESTADO.md` corrigida — estava 1, 2, 3, 4, 6, 5.

### Medição

Segunda medição independente da mesma build, para conferir o número publicado:

```
n=20000 · mediana 19 rodadas · quem começa 55,6% (z=15,74)
```

Contra os **55,5% (z=15,41)** que a v0.6.2 registrou. As duas concordam — a diferença
é ruído entre execuções, não mudança de build. O número está honesto.

`node sim/simetria.js` continua saindo com código 0.

### Por quê

Doc que contradiz o código é pior que doc que falta: quem lê acredita. O poço em [4,4]
e o Nexus com 5 de vida eram números que alguém usaria para balancear e chegaria à
conclusão errada.

### O que isso quebra

Nada no jogo. Duas regras ficaram **marcadas como decisão pendente** em `02-regras.md`,
porque estavam escritas no design e nunca chegaram ao motor: o respawn mais longo para
quem está rico, e a Armadura da Dupla. Não foram implementadas nem removidas do
documento — foram marcadas com 🔸 para o grupo decidir.

### Regra nova no `CLAUDE.md`

> **Número no doc se tira do código, não da memória.** `sim/motor.js` carrega o jogo em
> Node; dá para ler qualquer `const` por ponte. Doc que contradiz o código é bug de doc.

---

## v0.6.2 — selva de verdade, e o placar vira gaveta · 2026-08-10

> **Em teste. Não aprovado.** Muda tamanho do tabuleiro.

### O que mudou

**Tabuleiro 9×9 → 11×11.** Casas jogáveis **77 → 116** (5 saem da grade por não
terem par no espelho, contra 4 antes).

| | 9×9 (antes) | 11×11 |
|---|---|---|
| **Selva** | 16 casas | **30 casas** |
| Rota (corredor) | 57 | **82** |
| Espinha topo/meio/baixo | 13/9/13 | 17/12/17 |

**Nenhuma casa de rota foi perdida — as rotas cresceram junto.** A selva é o
*interior* do mapa e cresce ao quadrado; a rota é o *perímetro* e cresce linear,
então aumentar o lado engorda a selva quase o dobro sem tirar nada das rotas.

> A selva chegou a marcar 38 casas numa medição intermediária desta mesma leva.
> Não valia: naquele momento a rota do meio ainda estava fina e partida (ver
> abaixo). Consertá-la devolveu 8 casas para a rota, e é assim que fica.

**O placar de estruturas saiu do painel e virou gaveta**, no botão **⌂** do
cabeçalho. Com o tabuleiro maior quem precisa do espaço vertical é o mapa, e
vida de torre é *consulta*, não HUD — olha-se de vez em quando. Na gaveta cabe
mais do que cabia no painel: **torre por torre**, não só o total da rota, com a
que aceita golpe agora marcada **ALVO**.

O que fica sempre à vista é só o aviso no botão: **vermelho** quando é a sua
rota que abriu, **dourado** quando foi a do adversário. Ninguém perde uma rota
abrindo sem perceber.

### Por que 11 e não 10

Medido, 2500 partidas por caso:

| | 9×9 (antes) | 10×10 | **11×11** |
|---|---|---|---|
| Quem começa | 57,1% | **59,7%** | **55,0%** |
| Dragões por partida | 0,76 | **0,21** | 0,55 |
| Mediana | 15 rodadas | 16 | **18** |

**10×10 foi medido e descartado**: piora a assimetria e o poço quase nunca é
disputado — 0,21 Dragão por partida, contra 0,55 em 11×11. A casa do poço é
deduzida quando `N` muda, e em 10 a dedução cai num lugar ruim.

**11×11 derruba a vantagem de quem começa de 57,1% para 55,0%**, que era a
regressão aberta desde a v0.6.

### O número final, no n que o projeto exige

Confirmado em **n=20000**, já com a rota do meio consertada:

| Build | Quem começa | Mediana |
|---|---|---|
| v0.5.8 (base da leva) | 53,5% (z=9,8) | 15 rodadas |
| v0.6.1 (9×9) | 57,1% (z=20,1) | 15 |
| **v0.6.2 (11×11)** | **55,5% (z=15,41)** | **19** |

O tabuleiro maior **devolveu 1,6 ponto** dos 3,6 que a leva tinha custado. Ainda
sobram **+2,0 pontos** sobre a v0.5.8, e o z=15,41 diz que não é ruído — o freio
continua sendo o comeback, que não existe.

**A partida alongou 4 rodadas**, de 15 para 19 de mediana. É o preço do mapa
maior, e é mais do que as 3 estimadas em n=2500. Quatro rodadas a mais numa
partida de mesa não é detalhe: **precisa de playtest para dizer se cansa.**

### O que a rota do meio escondia

Alargar a rota destapou dois defeitos nela, os dois só visíveis em 11×11:

**1. A espinha do meio estava PARTIDA em duas.** Entre os passos 4 e 5 havia um
vão de **3 casas** — `(4,6)` e `(6,4)` não são vizinhas. Como `frentes` guarda um
índice da espinha e a onda anda de um índice para o seguinte, **a onda
atravessava o buraco como se nada fosse**.

A causa: o eixo da rotação em N=11 cai *entre* casas (não existe hexágono
central), e a metade escrita parava na linha do centro em vez de avançar uma
linha além dela. Em 9×9 o defeito não aparecia porque lá existe casa fixa, que
fechava a emenda sozinha. A metade agora desce uma linha a mais — aí a última
casa dela e o espelho dessa casa são vizinhas — e a costura de emergência
caminha até fechar o vão, em vez de tentar uma casa só.

**2. A rota do meio era mais fina que as outras duas.** Tinha **6 casas extras
para 10 de espinha**, contra 12 para 17 do topo. O estreitamento do meio da rota
era calculado sobre a *metade* da lista — o meio é escrito pela metade e
espelhado — então caía no lugar errado. O estreitamento do meio saiu; só a
**boca da base** continua com uma casa. Agora o meio tem **10 extras para 12 de
espinha** e seção mínima **2 em todo o percurso**.

`sim/simetria.js` ganhou a verificação **4b — espinha contínua**, que compara
cada passo com o seguinte. Era o teste que faltava: o de largura reportava
`min=2` e passava, porque uma casa extra pode servir a dois passos vizinhos.
Rodado em N=9, 10, 11, 12 e 13: contínua nas três rotas.

### Duas ressalvas honestas

**1. A selva cresceu, mas continua vazia.** Não existem acampamentos — os buffs
Azul e Vermelho seguem na lista de *o que NÃO existe*. As 30 casas valem por
espaço tático (flanco, gank, rota de fuga), não por conteúdo. Quem esperava
"mais o que fazer na selva" vai encontrar mais chão para andar, e só.

**2. O hexágono encolheu para ~33px** numa tela de 390px de largura, contra os
**44px** de referência de toque do projeto. A peça do mapa vale o hexágono
inteiro, então dá para jogar, mas é o menor alvo já medido. Foi por isso que o
placar saiu do painel — devolveu altura ao mapa. **Precisa de olho humano numa
tela pequena antes de aprovar.**

---

## v0.6.1 — o herói cerca sozinho, e dá para ler a vida das estruturas · 2026-08-10

> **Em teste. Não aprovado.** Muda condição de vitória.

### O que mudou

**A torre deixou de depender da onda.** Estava assim:

```js
if(J.frentes[tr.rota]!==tr.i) return false;   // só com a ONDA em cima da torre
```

O herói só podia bater na torre se o creep já tivesse chegado nela. Na prática
ninguém cercava: esperava. Agora quem decide é a **posição do herói**, e a onda
voltou a ser o que devia ser — pressão constante, não permissão.

**No lugar do portão da onda entrou a torre exposta.** Só aceita golpe a torre
**mais avançada que ainda está de pé** naquela rota. Enquanto ela vive, a de trás
está protegida — senão dava para passar por fora da linha de frente e bater direto
na porta da base. Uma torre continua aguentando **um golpe de herói por rodada**,
e o revide de 2 continua sendo o preço de encostar.

**O Nexus passou a ter caminho de dano por herói**, que não existia: até aqui só a
onda o derrubava, e a partida terminava sem ninguém dar o golpe final.

| | Regra |
|---|---|
| Quando | Só depois que uma **rota inteira** daquele lado cai — as duas torres no chão |
| Alcance | O herói precisa alcançar a base inimiga |
| Dano | **1** por golpe, **um golpe por rodada** (`J.nexusBatido`) |
| Revide | **Nenhum** — quem chegou até aqui já pagou o pedágio das duas torres |

**Placar de estruturas abaixo do mapa.** Os números já existiam desenhados dentro
da torre e do Nexus, com ~6px de altura em tela — ninguém lia. Agora há uma coluna
por lado, uma linha por rota, vida em bolinha cheia/vazia, aviso de **rota aberta**
e de **Nexus exposto**, e marca de torre **já batida** nesta rodada.

### O que isso muda no ritmo

Medido, n=3000:

| | Antes (v0.6) | Agora |
|---|---|---|
| Golpes de herói em torre, por partida | 1,4 | **4,8** |
| Golpes de herói no Nexus | — | **0,3** |
| Torres caídas | 5,5/12 | 5,8/12 |
| Duração (mediana) | 16 | **14** rodadas |
| Quem começa | 56,4% | **56,1%** (z=6,65) |

O herói virou fonte real de pressão em estrutura — era o buraco — e a partida
encurtou duas rodadas.

### O custo acumulado da leva, medido no tamanho que o projeto exige

`ESTADO.md` manda medir assimetria com **n=20000**, porque a n=3000 a banda de
ruído é ±1,8 ponto a 2σ. Rodado:

| Build | Quem começa |
|---|---|
| v0.5.8 (base desta branch) | 53,5% (z=9,8) |
| v0.5.9 + v0.6 + v0.6.1 | **57,1%** (z=20,1) |

**+3,6 pontos**, e o z não deixa dúvida. Não é ruído: as três mudanças juntas
pioraram a vantagem de quem abre. O mapa simétrico responde por boa parte —
ele tirou do caminho a assimetria que empurrava para o outro lado e mascarava
o problema. Mediana da partida: 15 rodadas, igual à de antes.

**Isto é assunto de aprovação, não de conserto silencioso.** O freio continua
sendo o comeback, que segue sem existir. Enquanto ele não entra, quem abre leva
57 partidas em 100 contra um adversário que joga igual.

### Duas coisas que este trabalho encontrou

**1. O agente da bateria não sabia atacar o Nexus.** `sim/agente.js` só olhava
épico, torre e herói. Sem o ramo novo, a bateria mediria um jogo que não é o que
está no arquivo — regra nova com zero cobertura. Ele agora ataca o Nexus com
prioridade máxima (é condição de vitória) e `sim/motor.js` expõe `alvoNexus` na
ponte, que é `let` e não vira propriedade do global sozinha.

**2. `--pos` nunca foi declarada na paleta do CSS.** É usada em quatro lugares;
três são anteriores a este trabalho (`.fic`, `.fic .ps`, e a borda da linha 436).
Variável indefinida invalida a declaração inteira, então a cor simplesmente não
pinta. O placar novo usa `--vivo`, que existe. **As outras três continuam lá** —
conserto separado, para não misturar aparência com regra nesta leva.

---

## v0.6 — o tabuleiro vira 9×9, simétrico, e a rota cabe em dois · 2026-08-10

> **Em teste. Não aprovado.** Muda geometria e posição de torre.

### O que mudou

**Tabuleiro 8×8 → 9×9.** Casas jogáveis: 64 → **77**. Quatro casas da última coluna
(linhas ímpares) **saíram do tabuleiro** por não terem contraparte no espelho — eram
casas que só existiam para um dos lados.

**A rota passou a ter 2 hexágonos de largura.** Separou-se o que estava junto:

| | O que é | Largura |
|---|---|---|
| **Espinha** (`ROTAS`) | indexa torre e onda — `frentes` guarda índice dela | 1 casa |
| **Corredor** (`LANE`) | por onde os heróis andam | **2 casas** |

Corredor por rota: topo **13 → 22** casas, baixo **13 → 22**, meio **9 → 13**.
Seção mínima de topo e baixo = **2** em todo o percurso. O meio mantém **2
estreitamentos de propósito**, nas bocas de base, para que ainda exista onde
segurar avanço. Era a queixa registrada em `ESTADO.md`: suporte e atirador não
cabiam na mesma rota.

**Comprimento da espinha:** topo 12 → **13**, baixo 11 → **13**, meio 8 → **9**.
Topo e baixo agora têm o mesmo comprimento — antes diferiam em uma casa.

**Torres.** As duas fórmulas diferentes por lado viraram uma só, medida a partir da
própria base: distâncias **1** e **round(n×0,28)**, espelhadas por construção.

### Por quê

O espelho era `(COLS-1-c, LINS-1-r)`, que **parece** rotação e não é numa grade
offset odd-r: as linhas ímpares andam meio hexágono, então a fórmula quebra a
vizinhança justamente nelas. O estrago era medível — rotas de comprimentos
diferentes, bases fora do espelho e torres a distâncias diferentes da própria base.

Agora a rotação passa por **coordenada cúbica** e o mapa é **gerado por metade**:
escreve-se topo e meia rota do meio, o resto é o espelho. Assimetria deixa de ser
coisa para consertar e passa a ser impossível de escrever.

O eixo da rotação fica nos **cantos opostos**, não no "hexágono central": em lado
par o centro cai entre casas e o cubo sairia fracionário. Por isso `N` continua
valendo par e ímpar — `mapa=8` e `mapa=10` seguem rodando na bateria.

### O aviso que este trabalho encostou

O código trazia um aviso para **não** "consertar" o desencontro das torres: fazê-lo
sozinho jogava a vitória de quem começa de 51,1% para 40,8%, porque o desencontro
compensava a assimetria do mapa. O aviso pedia medir os dois lados juntos, e foi o
que se fez. Medido, 1500 partidas por caso:

| Variante | Quem começa |
|---|---|
| 9×9 simétrico + **torre simétrica** | **58,7%** (z=6,7) |
| 9×9 simétrico + torre antiga (assimétrica) | 73,5% (z=18,2) |

No mapa simétrico a compensação virou o problema. Ela sai, e o aviso sai com ela.

### O que isso custa

**Vantagem de quem começa: 55,0% → 56,4%** (z=6,97, n=3000). **Duração: mediana
15 → 16 rodadas.** O mapa simétrico não conserta a bola de neve — nunca prometeu.
Ele tira do caminho a assimetria que mascarava parte dela; o freio continua sendo
o comeback, que segue sendo a próxima coisa.

### Ferramenta nova

`node sim/simetria.js` (aceita `mapa=N`) percorre o tabuleiro e compara cada casa
com o espelho: casas sem par, comprimento e espelhamento das rotas, bases, distância
das torres e largura da rota. Sai com código 1 se algo falhar — serve de teste.

### Três bugs que a mudança revelou

Casa fora do tabuleiro precisava sumir de todo lugar que varre a grade. Estavam
faltando: o **destino de movimento** (dava para andar até uma casa inexistente), o
**alvo do toque** (`hexSob` mirava casa removida) e a **escolha do poço**. O
`viewBox` do SVG, que estava fixo no HTML para 8×8, passou a ser derivado da
geometria — trocar `N` redesenha sem ninguém lembrar de ajustar à mão.

---

## v0.5.9 — dois acertos para matar · 2026-08-10

> **Em teste. Não aprovado.** Muda regra de combate e precisa de partida de teste
> antes de virar oficial.

### O que mudou

**Piso de vida em 10.** Nenhum herói entra em partida com menos:

| Herói | Vida |
|---|---|
| Nyx | 9 → **10** |
| Solenne | 9 → **10** |
| Zhet | 9 → **10** |
| Cael | 9 → **10** |
| Corvo | 9 → **10** |
| Nessa | 8 → **10** |
| Vesper | 9 → **11** |

**Poder.** Os assassinos de alcance longo desceram, os tanques subiram:

| Herói | Poder |
|---|---|
| Nyx | 4 → **3** |
| Kurr | 4 → **3** |
| Corvo | 4 → **3** |
| Vharn | 2 → **3** |
| Grumo | 2 → **3** |
| Gorm | 2 → **3** |
| Torvald | 2 → **3** |

**Ultimates de dano fixo, todas cortadas:**

| Habilidade | Dano fixo | Alcance |
|---|---|---|
| Solenne · Julgamento | 11 → **8** | inalterado |
| Corvo · Ato Final | 10 → **7** | ilimitado → **alcance normal (4)** |
| Cael · Sentença | 9 → **6** | ilimitado → **alcance normal (3)** |

**Nyx · Caçada** deixa de aplicar o dano duas vezes (`dano:2` → **`dano:1`**).
**Kurr · Salto Mortal**: bônus de dano 4 → **2**.

**Mirrha vira a única curandeira do jogo.** Poder 1 → **2**, alcance 2 → **3**.
Sopro passa a curar **3** além do escudo de 2. Eco devolve o aliado com **4 de vida
e 3 de escudo**, em vez de só levantar.
Em troca, **Vidra · Vento Contrário perde o revive** — mantém o escudo de 5.

### Por quê

O dano ia de 4 a 12 contra vidas de 8 a 9: um golpe matava, e a partida virava quem
age primeiro. Com o teto de dano em 9 e o piso de vida em 10, **abate exige dois
acertos** e existe janela para reagir, curar ou recuar.

O Corvo era o único herói com alcance 4 e a ultimate ignorava alcance — ou seja,
matava de qualquer casa do mapa, sem exposição. Perdeu o alcance ilimitado e um de Poder.

A Mirrha era dominada pela Vidra em todos os eixos: menos alcance, menos poder, e a
Vidra ainda revivia com escudo maior. Em vez de inflar a Mirrha, o revive saiu da
Vidra — cura vira identidade de uma heroína só.

Tanques ganharam +1 de Poder porque eram ignoráveis: sem ameaça de dano, ninguém
precisava respeitar o corpo deles.

### O que isso quebra

Nada no motor — só `data/catalogo.js`. Guia e visualizador de cartas leem daqui e
acompanham sozinhos.

**Três habilidades ainda matam um alvo de vida cheia** (verificado por script, com
Força 6 contra armadura 1): Nyx · Bote, Cael · Armadilha e Kurr · Salto Mortal
chegam a **10** por causa do bônus fixo de +2, contra o piso de vida de 10.
Baixar esse bônus de 2 para 1 nas três levaria o golpe a 9 e fecharia a meta.
**Não aplicado** — decisão pendente.

---

## v0.5.8 — arrastar para andar · 2026-08-10

### O que mudou

**Arrastar o herói move.** Encosta, puxa, solta. As casas ao alcance acendem durante o gesto e a
casa sob o dedo fica marcada. O caminho antigo continua inteiro — tocar, abrir o comando, tocar
MOVER, tocar a casa: o arrasto só nasce depois que o dedo anda **7px**, e abaixo disso tudo é
toque normal. Ao soltar, o herói fica selecionado, para você já agir com ele.

**Segurar uma habilidade por meio segundo abre a ficha dela:** Força mínima, alvo, alcance, a
regra por extenso e **o resultado de cada um dos dados que estão na mesa naquela rodada** — que é
a pergunta real do jogador ("com o 4 que eu tenho, isso mata?"). Vale nas habilidades apagadas
também, que é justamente quando mais se quer saber. Para isso as habilidades deixaram de usar
`disabled` (que engole evento de ponteiro) e passaram a usar a classe `.naoPode`; tocar numa
apagada continua explicando por que ela não serve, como já explicava.

**A tela de campeão virou placar.** Antes só dizia quem venceu. Agora mostra Nexus, torres
derrubadas e ouro acumulado dos dois lados, e o motivo da vitória. `J.motivoFim` já está plumbado
para o dia em que o limite de rodadas entrar.

### Duas armadilhas que este trabalho encontrou

**1. Arrasto não pode repintar a tela.** A primeira versão chamava `pinta()` ao começar o gesto,
para acender as casas. Só que selecionar o herói faz o painel de comando crescer, o palco encolher
e **o mapa inteiro se redimensionar — com o dedo encostado nele**. Medido: a casa sob o dedo
pulava de `[0,5]` para `[0,7]` só por causa disso, e o herói ia parar no lugar errado.
Agora o alcance é calculado sem tocar na tela e as casas são realçadas direto nos polígonos que já
estão no DOM. O `pinta()` só acontece depois de soltar.

**2. Os eventos moram no `<svg>`, nunca na peça.** `pinta()` reconstrói o mapa a todo momento, e
um handler preso à peça morreria junto com ela no meio do arrasto — inclusive o
`setPointerCapture`, que é o que garante receber o `pointerup` se o dedo sair de cima do elemento.

Também precisou de `touch-action:none` na peça: sem isso o navegador entende o arrasto como
rolagem e engole os `pointermove`. E de uma trava de clique de 350ms depois de soltar — o
navegador ainda dispara um `click` no fim do gesto, que sem a trava movia o herói duas vezes.

### O que não mudou

Nenhuma regra. A bateria dá os mesmos números, e a auditoria de toque continua sem estouro
horizontal e sem corte vertical nos quatro tamanhos.

---

## v0.5.7 — a loja abre · 2026-08-10

### O que mudou

Vieram de fora, na revisão do Vinicius e do Matheus (documento escrito contra a v0.4.1).
São as três correções da seção 1 que ainda valiam contra o código de hoje. **Nenhuma muda regra.**

**`ARTE_ITEM` nunca existiu.** `jogo/jogo.js` pedia esse índice em três lugares e
`arte/imagens.js` só definia `ARTE`, `ARTE_CARTA`, `ARTE_MAPA` e `ARTE_MONSTRO`. No instante em
que a loja montava os cards, o JavaScript parava com `ARTE_ITEM is not defined` e a gaveta abria
vazia. As imagens estavam lá o tempo todo, em `arte/itens/web/` — faltava o índice.
Só **12 dos 22** itens têm arte, então os 10 de `ITENS_NOVOS` caem num selo de latão com a
inicial, desenhado por `itemProv()`. Quem lê usa `RETRATO_ITEM(id)`, nunca o índice direto.

**Ninguém era reconhecido na base.** `naBase` comparava o hexágono exato, e a base tem dois
hexágonos para cinco heróis: `desempilha()` empurra três deles para as casas vizinhas já na
largada. Medido — na rodada 1 de toda partida, **zero dos cinco** contavam como estando na base,
e a loja abria dizendo "Loja fechada". Agora vale a base e o entorno imediato (`dist<=1`), o que
dá **3 dos 5** na largada.

**A barra de ações ficava morta com qualquer gaveta aberta.** O véu (z-index 19) e a gaveta (20)
cobriam a barra, que não tinha camada. `elementFromPoint` no botão TIME devolvia a gaveta. O
código sempre foi escrito para alternar de gaveta com um toque — `sheetAberto==="Time" ?
fechaSheet() : abreTime()` — e essa intenção estava anulada. A barra foi para z-index 21, com
fundo próprio (invisível quando não há gaveta) e o corpo da gaveta reservando a altura dela.

### O que veio no documento e NÃO entrou

Duas correções da mesma seção **já estavam feitas** e o documento não sabia:

- **Herói morto não comprava** — corrigido na v0.5.1. O filtro é `h.morto||naBase(h)` desde então.
- **Botões saindo da tela** — corrigido na v0.5.6, com o teto e a rolagem da lista de comando.

E uma da seção 5: **Doar Dado deixando agir duas vezes** — o filtro `hb.ef.doar&&o.agiu` já
existe. Doar hoje é a suporte gastando a ação dela para dar ação a um aliado que ainda não agiu.

As seções 2, 3 e 4 do documento (tabuleiro 9×9, rotas largas, santuário, cerco por herói, limite
de rodadas, painel de cerco, ficha por toque longo) **não entraram nesta versão** — mudam regra
ou conflitam com medição registrada. A análise item a item está em `docs/REVISAO-EXTERNA.md`.

### O que isso quebra

O equilíbrio da loja mudou de fato, e para mais fácil: voltar para comprar custa menos movimento
do que custava, porque não é mais preciso pisar na casa exata. Somado à compra durante o respawn
(que já valia desde a v0.5.1), a loja pesa menos na decisão. **A bateria não mede isso** — o
agente não faz compras — então é item de playtest.

---

## v0.5.6 — o dedo não mira no desenho · 2026-08-10

### O que mudou

Auditoria de toque em quatro tamanhos de celular, com o navegador de verdade medindo cada
alvo. A referência é **44px** (Apple HIG; Material pede 48dp). **Antes, os 27 alvos da tela
estavam todos abaixo disso** — o menor tinha 22,5px, e a peça do herói, que é o gesto mais
repetido do jogo, tinha 25px no iPhone 12 e **12,4px** num aparelho de 568 de altura.

**O alvo da peça passou a valer o hexágono inteiro.** Um círculo invisível de raio 15,5 leva
o toque até a borda do hexágono sem mudar uma linha do desenho. 15,5 é o teto: os centros
vizinhos ficam a `sqrt(3)·R ≈ 32,9`, então raio 16,45 já roubaria o toque do vizinho.
Vale para herói, para torre sob mira e para o poço.

| Alvo | 390×844 | 360×800 | 375×667 | 320×568 |
|---|---|---|---|---|
| peça do herói | 25,1 → **40,4** | 21,9 → **35,3** | 14,6 → **32,7** | 12,4 → **27,9** |
| poço / torre sob mira | 22,1 → **40,2** | 19,3 → 36 | 12,9 → 33 | 10,9 → 28 |

**Os botões subiram para 44px** (40 em tela de até 760 de altura, senão o painel não cabe):
ícones do HUD e o ✕ do comando de 32, o ✕ do bottom sheet de 30, a barra de ações de 39,
as linhas de comando de 42, o dado de 42.

**Os três mini-botões do dado eram o pior alvo da tela**, 65×22,5, empilhados. Viraram uma
linha de três com altura de alvo de verdade — e **somem quando nenhum dos três serve**, o que
devolve ~45px ao mapa e tira três botões apagados da frente do jogador.

**Dois estouros reais, corrigidos.** O painel empurrava a tela para fora nos quatro tamanhos
(no iPhone SE sobravam 14px). Agora a lista de comando é a única coisa que rola por dentro, e
é ela que cede altura ao mapa — dados e ações ficam sempre à vista. E com Prioridade e
Retomada juntas dá para ter **seis dados** na linha, que estourava a largura em todos os
aparelhos: em vez de encolher o dado, a linha rola de lado nesse caso raro.

### O que era falso positivo

O medidor acusava corte vertical nos quatro tamanhos mesmo quando a soma batia exata. Era o
**bottom sheet estacionado fora da tela** com `translateY(101%)`: ele conta no `scrollHeight`
e não é corte, porque `body` é `overflow:hidden`. As pílulas do HUD e as torres fora de mira
também apareciam como "alvo pequeno" — não são tocáveis, são leitura. O medidor foi corrigido
para olhar a soma hud + palco + painel contra a janela, e só o que tem `onclick`.

### O limite que não dá para consertar com CSS

Num aparelho de 568 de altura, um tabuleiro 8×8 em 266px de palco dá hexágono de ~28px.
Chegar a 44 exigiria menos hexágonos ou mapa com deslocar-e-ampliar. **27,9px já é 2,2× o que
era**, e nesse tamanho a lista de comando mostra uma linha por vez e rola — a última desbota
para indicar que há mais. É o preço, e está escolhido de propósito: o mapa é o gesto principal.

### O que isso quebra

`jogo/index.html` mudou de estrutura em dois pontos: `#extraBts` saiu de dentro de `#dados` e
virou linha própria, e `#dadosAcao` perdeu o `style` inline para a regra ir ao CSS.
Nenhuma regra de jogo foi tocada — `sim/bateria.js` dá os mesmos números.

---

## v0.5.5 — o poço, a Retomada, e a descoberta de que a bateria é cega · 2026-08-10

### O que mudou

**Existe um poço no meio do mapa, e ele muda de morador.** Casa `[4,4]`, terreno de ninguém.
Até a rodada 8 quem desce é o **Dragão** (3 de vida, revida 1, volta 3 rodadas depois de cair);
da rodada 8 em diante é o **Barão** (5 de vida, revida 2, volta em 4). Poço vazio mostra na tela
a rodada em que o próximo desce — o relógio da partida ficou visível.

Bater no poço usa a mesma porta da torre: mira vermelha, um toque, 1 de dano. Duas diferenças,
as duas de propósito: **não tem limite por rodada** e **não tem dono**. Quem dá o último golpe leva
o prêmio inteiro, e é essa janela que faz do objetivo uma briga em vez de uma fila.

| Prêmio | O quê | Dura |
|---|---|---|
| **Herança do Dragão** | +1 de Poder em todo o time, **acumula** a cada Dragão | para sempre |
| **Fúria do Barão** | +2 de Poder no time e as **três ondas avançam sozinhas**, com herói na rota ou sem | 2 rodadas |

**A Retomada entrou como freio de bola de neve.** O jogo conta o perigo de cada lado: cada torre
sua caída vale 2, cada hexágono de onda inimiga do seu lado do vão vale 1. Passou a conta do
adversário em **2**, você rola **+1 dado de ação**; em **4**, também ganha **+1 no Dado Mestre**.
Automático, aparece no HUD, e some sozinho quando a diferença fecha.

### O achado que vale mais que os dois recursos: a bateria é cega a agência

Dando à Retomada 1, 2 e 3 dados extras **por grau de atraso** — até 6 dados a mais num turno —
a vitória de quem começa ficou em 52,2%, 53,0% e 52,9%, contra 52,9% sem Retomada nenhuma.
**Resposta-dose completamente plana.** 10 000 partidas por dose.

O motivo é o agente: ele escolhe herói e habilidade quase ao acaso. Dado a mais só vira vitória
na mão de quem escolhe bem. Então `sim/bateria.js` mede muito bem **estrutura** — geometria,
regra de onda, posição de torre, ritmo — e **não enxerga nada** que dependa de escolha:
Retomada, Prioridade, Placas, itens, cartas e o prêmio do épico.

O sintoma aparece cru na medição do poço: **o time que levava 62% dos épicos perdia a partida.**
A bateria via o custo (dado gasto, revide levado) e não via o prêmio (Poder). Quem confiar no
número de `quem começa` para julgar essas mecânicas vai otimizar na direção errada — o ótimo,
por esse número, é tornar o objetivo irrelevante. O aviso está agora no cabeçalho de
`sim/bateria.js`. **Épico e Retomada se validam em playtest humano, não aqui.**

### Correção de um número que estava no ESTADO

A vantagem de quem começa na v0.5.4 estava registrada como **52,4% (z=3,4)**, medida com 5 000
partidas. Com 20 000, a mesma build dá **50,5% a 51,0%**. A n=5 000 a banda de ruído é ±1,4 ponto
a 2σ, e boa parte daqueles 2,4 pontos era ruído. Medições de assimetria deste projeto passam a
querer 20 000.

| | v0.5.4 | v0.5.5 |
|---|---|---|
| quem começa, sem épico e sem Retomada | 50,5% (z=1,4) | 50,5% (z=1,4) |
| quem começa, build completa | — | **53,5% (z=9,8)** |
| mediana da partida | 15 | 15 |
| média da partida | 16,5 | 17,0 |

20 000 partidas por medição. Os 3 pontos que o poço acrescenta são, em boa parte, o custo que a
bateria enxerga sem o prêmio que ela não enxerga — mas **não** são zero: sobra um resto real de
acesso desigual, medido em 48,0% contra 52,0% de encontros.

### Três desenhos que a medição matou antes de virarem regra

**1. Dois poços, um por metade do mapa.** Colocados "à mesma distância das duas bases", que parecia
o critério justo. Não é: herói não mora na base, mora na rota. O time 1 ficava ao alcance do poço
**43% mais vezes** que o time 0. Um poço central resolveu.

**2. A casa do poço por fórmula.** Distância no papel não prevê encontro no tabuleiro. `[3,3]` e
`[4,4]` têm acesso teórico praticamente igual (19-19 contra 17-19) e dão 45,4% e 48,0% de encontros;
`[4,4]` e `[5,5]` têm acesso teórico idêntico e dão 48,0% contra 35,6%. Nenhuma fórmula estática
separa esses casos. `[4,4]` foi escolhida **medindo**: a mais parelha das seis testadas, e a que
mais gera disputa — 43% mais encontros que `[3,3]`.

**3. Espelhar as torres.** As duas fórmulas de `TORRES_DEF` não batem por índice: no topo o time 0
fica em `[1,3]` e o time 1 em `[9,10]`, quando o espelho de `[1,3]` seria `[8,10]`. Trocar a segunda
por `n-1-i` parece o conserto óbvio e **joga a vitória de quem começa de 51,1% para 40,8%**. O
desencontro compensa outra assimetria do sistema. Está revertido, com o experimento anotado no
código para ninguém "consertar" de novo.

E uma quarta, que era só o medidor errado: a Retomada media atraso **só em torre caída** e
disparava na **rodada 12,9** de uma partida que acaba na 15 — chegava depois de a partida estar
decidida. Somar hexágono de onda invadida trouxe para a 12,1, e o divisor teve que ser o meio do
vão **sem arredondar**: com `centroRota` o freio socorria o líder (37,4% dos turnos do time 0
contra 28,8% do time 1), e com o meio da rota o time 1 nascia com Retomada de graça (25,1% × 53,3%).
Com o divisor certo, 30,6% × 37,1% — dispara para quem está atrás, e não para quem está na frente.

### O que isso quebra

`sim/agente.js` mudou: ele agora bate no poço, mas **só quando consegue terminar o serviço na
rodada**. A versão que batia sempre gastava ~11 golpes por partida para levar 0,4 Dragão e inflava
a vantagem de quem começa de 52% para 55,6% — ralo de dado, não disputa.

Quem tiver medição antiga anotada: números de antes da v0.5.5 medidos com n=5 000 têm ±1,4 ponto
de ruído e não dá para comparar de perto com os novos.

---

## v0.5.4 — mapa 8x8 · 2026-08-09

### O que mudou

**O tabuleiro foi de 7x7 para 8x8.** Rota de **10 para 12 hexágonos**. Como a geometria virou regra
na v0.5.3, foi trocar `const N=7` por `const N=8` — rotas, bases, rio e posição das torres se
recalculam sozinhos.

| | 7x7 | 8x8 |
|---|---|---|
| rota | 10 hex | **12 hex** |
| mediana da partida | 13 rodadas | **15 rodadas** |
| vantagem de quem começa | 55,9% (z=8,3) | **52,4% (z=3,4)** |

5000 partidas por medição.

### Correção de uma coisa que eu disse na v0.5.3

Eu tinha escrito que aumentar o mapa **não** mexia na vantagem de quem começa. Estava medindo mapa
maior **sem** a iniciativa alternada. Os dois se somam: com a alternância, o 8x8 leva de 55,9% para
52,4%. Sozinho, nenhum dos dois resolvia.

Ainda sobra 2,4 pontos acima do justo — é o que o comeback tem que fechar.

---

## v0.5.3 — a iniciativa alterna, e o mapa virou parâmetro · 2026-08-09

### O que mudou

**A iniciativa alterna a cada rodada.** `J.primeiro` era 0 e **nunca mudava**: o mesmo time jogava
primeiro nas ~12 rodadas de uma partida inteira. Agora troca no fim de cada rodada, e o log diz
quem começa. **De 60,3% para 56,8% de vitórias de quem abre a partida** (3000 partidas por medição).

**O tabuleiro virou parâmetro.** `L_TOPO`, `L_BOT`, `BASE` e `RIO` eram listas de coordenadas
escritas à mão para um 7×7. Agora saem de regra a partir de `const N=7`, e em N=7 a regra reproduz
as listas antigas **hexágono por hexágono** — verificado antes de trocar. Mudar N muda mapa, rotas,
bases e posição das torres de uma vez. Nenhuma mudança de comportamento nesta versão: continua 7.

**`sim/` ganhou variantes e um experimento.** `node sim/bateria.js 3000 mapa=9 mov=2d10` roda a
variante sem sujar `jogo/jogo.js`. `node sim/ordem-vs-time.js` separa vantagem de ordem de vantagem
de elenco.

### Três hipóteses minhas que a medição derrubou

Registro porque duas quase viraram decisão de design.

**1. "O mapa pequeno causa a vantagem de quem começa."** Eu tinha escrito na v0.5.2 que a raiz era
`6+4=10` — Dado Mestre até 6 mais alcance 4 cobrindo a rota inteira de 10 hexágonos. **Falso.**
Mapa 9 (rota de 14) dá **60,6%**, o mesmo do mapa 7. Mapa 11 dá **65,1%**, pior. Aumentar o mapa é
defensável pelo motivo que o Matheus deu — espaço para o suporte e o atirador dividirem rota — mas
não conserta a assimetria, e cobra caro: a mediana vai de **12 para 18 rodadas** em N=9 e **22** em
N=11.

**2. "Compensar o segundo jogador com ouro resolve."** Testei +3, +6 e +10 de ouro por herói.
Deu 60,7%, 59,7% e 60,3%. **Não move nada** — e +10 por herói é mais que um item inteiro.

**3. "Pode ser o elenco, não a ordem."** Em partida sem draft os times são fixos, então ordem e
composição estavam grudados na mesma medição. Rodei metade das partidas com os elencos trocados:
**ordem 60,6% (z=13,3), elenco 50,1% (z=0,1).** A ordem é real e os dois times padrão estão
notavelmente equilibrados. O confundimento existia, mas não era a explicação.

O que sobra dos 56,5% é o tempo de abertura, e isso é trabalho de **comeback** — que já está na
lista de buracos conhecidos desde a v0.4.

### E o pacote de dados fica esperando

O Matheus e o Vinicius pediram d20/2d10 no movimento e d8 na ação com ultimate em 7–8. Medido, cada
dado maior **piora** a assimetria: d8 leva a 62,6%, 2d10 a 66,1%, os dois juntos a 68,1%, e mapa 11
com 2d10 chega a **74,6%**. Dado maior no mesmo tabuleiro é mais alcance, e mais alcance é mais
primeiro golpe. O pacote continua de pé, mas depois do comeback — não antes.

---

## v0.5.2 — um dado de ação por herói · 2026-08-09

### O que mudou

**Um herói recebe no máximo um dado de ação por rodada.** Dava para empilhar os três dados no mesmo
herói e atacar três vezes seguidas — o Matheus e o Vinicius acharam roubado em playtest, e estavam
certos: **o manual do próprio jogo já prometia isso** desde a v0.2. "Você tem 3 dados de ação e 5
heróis. Nunca dá para todos... quem não recebe dado farma 3." A economia inteira depende de dois
heróis ficarem de fora todo turno. O motor marcava `h.agiu=1` e nunca usava para bloquear.

Consequências que já estavam escritas nas cartas e agora valem:

- A carta **Segunda Chance** (`reativar`, limpa o `agiu`) não fazia nada, porque não havia limite
  para contornar. Agora é a única forma de um herói agir duas vezes na mesma rodada.
- **Doar Dado** parou de aceitar aliado que já agiu — antes era jogar o dado no lixo.
- Movimento continua livre: sai do Dado Mestre, que é do time. Só a ação é limitada.

**Ritmo:** 140 partidas simuladas, 69 concluídas, **mediana de 16 rodadas** (era ~15 documentado).
Dentro da faixa.

### Sobre a vantagem de quem começa

O Matheus levantou que quem joga primeiro leva vantagem. **Ele está certo, e é grande:
58,3% de vitórias para quem começa — 1748 contra 1252 em 3000 partidas, z = 9,06.**

Registro o erro porque ele quase virou decisão: minha primeira medição deu 52,2% em 69 partidas
(z = 0,36) e eu escrevi aqui que não havia vantagem estrutural. Amostra pequena demais para enxergar
um efeito desse tamanho. Foi a chegada do simulador headless — 3000 partidas em 5 segundos, contra
69 em 20 no navegador — que mostrou o número real.

O mecanismo é aritmético: `L_TOPO` tem **10 hexágonos**, o Dado Mestre chega a **6** e o Corvo tem
alcance **4**. **6 + 4 = 10 = a rota inteira.** Dá para sair da base e acertar alguém do outro lado
antes de o adversário jogar. Quem começa usa isso primeiro.

Fica para a v0.5.3, junto com o tamanho do mapa — e **antes** de qualquer mudança de dado.

---

## v0.5.1 — a torre virou alvo, e sete habilidades voltaram a funcionar · 2026-08-09

### O que mudou

**Herói agora derruba torre.** Era o gesto central de MOBA que não existia: as torres estavam no
motor desde a v0.1, mas a lista de alvos só era preenchida com heróis, então o jogador empurrava
onda e esperava. Agora:

- Torre vira alvo de qualquer habilidade de dano contra inimigo — mira vermelha, um toque.
- **Só se a sua Frente de Onda já estiver encostada nela.** Sem isso um assassino sozinho derrubaria
  a base pelas costas. Quem derruba torre é a onda; o herói acelera.
- Golpe de herói tira **1 fixo** — a Força não entra. Torre não tem armadura, escudo nem status.
- **Uma torre aceita um golpe de herói por rodada.** Zera no fim da rodada.
- A torre **revida 2** em quem encostou. O revide **nunca mata**: para no último ponto de vida.
  É pedágio, não morte sem autor — `mata()` precisa de alguém para creditar o ouro.
- O golpe que derruba a torre não leva revide.

**Vida da torre: de 2 para 3.** Com o herói somando dano, 2 fazia a torre evaporar. Simulei partidas
por configuração com jogador aleatório: com **2** a mediana era **10 rodadas**, com **4** passava de
**18**, com **3** deu **13** — perto do alvo de ~15, e ainda sobra espaço para o herói cortar o
cerco pela metade.

### Bugs corrigidos

**`desloca()` estava com a direção invertida e ignorava a distância.** Puxar afastava e empurrar
aproximava, e todo deslocamento era de 1 casa independente do valor da habilidade — o Gancho do
Torvald (`puxar:3`) arrastava 1 casa, para o lado errado. Sete habilidades voltaram a funcionar:
Provocar, Puxada, Investida, Gancho, Investir, Puxada Funda e Empurrão.

**Item de alcance não valia para habilidade.** A mira usava `h.alc` cru em vez de `alcTotal(h)`.
O Cetro Cinéreo diz "+1 de Alcance", a carta do herói mostrava 4, e o motor mirava com 3.

**Gank ignorava os itens do Caçador.** O dano usava `cac.poder` em vez de `poderTotal(cac)` — os
itens e a aura ficavam de fora justo na jogada principal da selva.

**"Nova partida" não reiniciava o baralho.** A tela de fim chamava `novo()`, que reseta o tabuleiro
mas não o Deck de Comando: a partida seguinte começava com as mãos e o cemitério da anterior.
Agora chama `partida()`.

**Carta "avance a Frente de Onda" empurrava sem limite.** Não passava por trava nenhuma, e a frente
podia sair da rota. Agora usa a mesma regra do fim de rodada — torre viva trava o avanço.

**A loja estava fechada a partida inteira.** O filtro era `!h.morto && naBase(h)`, mas a regra
escrita na própria tela sempre disse "na própria base **ou morto**" — o herói morto, que é justamente
quem deveria comprar enquanto espera o respawn, estava **excluído**. E como desde a v0.1 todo mundo
começa na entrada da rota e não na base, ninguém nunca cumpria a condição. Agora é
`h.morto || naBase(h)`. Reportado pelo Matheus em playtest.

### Faxina

Quatro funções tinham duas definições no mesmo arquivo, com a segunda sobrescrevendo a primeira em
silêncio: `calcula`, `perguntaCaca`, `abreLoja` e a órfã `alocaDado`. Quem editasse a cópia de cima
não veria efeito nenhum — o mesmo tipo de armadilha que os três catálogos de herói já criaram uma
vez. **78 linhas mortas a menos.**

### O que isso quebra

Quem tinha decorado que Provocar afastava vai levar um susto: agora puxa, que é o que a carta sempre
disse. Nenhum número de herói ou item mudou.

### Ressalva honesta

A calibragem da torre veio de jogador **aleatório**, que quase nunca usa o golpe em torre — mede o
ritmo só-onda. Amostra pequena e muitas partidas nem fecharam dentro do orçamento de tempo. Serve
para escolher entre 2, 3 e 4; **não** substitui playtest humano.

---

## v0.4 — corte de pool, arte completa e fonte única · 2026-08-08

### O que mudou

**Pool de heróis: 45 → 20.** Quatro por rota, um arquétipo distinto cada.

| Rota | Heróis |
|---|---|
| Topo | Vharn (tanque de controle) · Kaross (executor) · Ilva (mago de rota) · Xhera (bruiser com dreno) |
| Selva | Nyx (assassino) · Grumo (tanque que farma) · Kurr (rastreador à distância) · Pyk (gancho e execução) |
| Meio | Solenne (artilharia) · Zhet (assassino) · Nira (controlador) · Arden (dreno em área) |
| Atirador | Vesper (sustentado) · Cael (armadilheiro) · Nessa (móvel, executa) · Corvo (sniper alcance 4) |
| Suporte | Mirrha (curandeira) · Torvald (gancho com visão) · Gorm (escudo e engage) · Vidra (visão e doação de dado) |

Saíram 25: Draska, Orbek, Sarn, Thane, Vixa, Morgo, Vysh, Sombro, Lumen, Vok, Astra, Lyra, Bruk,
Rhia, Duno, Wren, Elna, Iseu, Vera, Ondi, Grald, Brann, Umbro, Skarn, Ygra.
Ficam em `docs/herois-aposentados.md`, prontos para colar de volta — nenhum foi perdido.

**Nenhum número de herói foi alterado.** Os 20 que ficaram mantêm vida, poder, armadura, alcance
e Força mínima exatamente como estavam.

**Banimento agora respeita a rota.** Antes: dois bans livres. Agora: **uma rota só pode perder um herói**.
Com 4 por rota, dois bans na mesma rota deixariam exatamente 2 heróis para 2 escolhas — counterpick zero.

**Arte:** 10 → 20 retratos. Todo herói do pool tem retrato pintado. O retrato provisório
(inicial sobre a cor da rota) virou só rede de segurança para id novo sem imagem.

**Deck de Comando ganhou face ilustrada.** As 22 cartas têm arte própria. Quando você compra no início
do turno, a carta **vira na tela** em tamanho grande, com a ilustração. Na mão, cada carta traz miniatura.
Nenhum efeito de carta mudou.

**Mapa ilustrado.** Entrou em `arte/mapa/mapa.jpg` e aparece no guia, seção 05. É referência de ficção —
o tabuleiro hexagonal continua sendo o que se joga.

**Peso dos arquivos.** `arte/imagens.js` era 275 KB de base64; virou índice de caminhos, 1,5 KB.
As ilustrações de monstro foram de ~23 MB (PNG) para 636 KB (JPG). O repositório inteiro de arte
fecha em ~9 MB.

### Por quê

O pool de 45 tinha 35 heróis sem arte, com retrato de letra. O draft ficava longo, feio e sem
identidade, e ninguém decorava 45 nomes. 20 com arte vale mais que 45 sem.

### O que isso quebra

Time salvo com herói aposentado não carrega mais. Como não existe save, não quebra nada em jogo.

---

## v0.4 — fonte única de verdade (mesmo patch, mudança estrutural) · 2026-08-08

### O que mudou

O jogo tinha **três catálogos de heróis** vivendo em paralelo:

| Onde | O que tinha | Estava |
|---|---|---|
| `jogo/index.html` | os 10 originais, formato do motor | correto |
| `guia/index.html` | os mesmos 10, formato próprio | **números da v0.1** — Vharn com 8 de vida em vez de 14 |
| `cartas/index.html` | os mesmos 10, terceiro formato | textos divergindo do motor |

Agora **`data/catalogo.js` é o único lugar** com conteúdo. Ele exporta:

- `HEROIS_BASE` — os 10 originais (vieram de dentro do `jogo/index.html`)
- `HEROIS_NOVOS` — os 10 da expansão
- `HEROIS` — os dois juntos, o catálogo de verdade
- `CLASSES` — a tabela de personalidade por classe
- `textoHab(hab)` — traduz o objeto de efeito do motor para português de manual
- `ITENS_NOVOS`, `DECK`, `montaDeck()`, `ORDEM_DRAFT`, `BANS`

`jogo/`, `guia/` e `cartas/` passaram a carregar `../data/catalogo.js` e a renderizar a partir dele.

### Por quê

Mexer no número de um herói exigia lembrar de três arquivos. Ninguém lembra de três arquivos.
Com três pessoas mexendo ao mesmo tempo, isso vira conflito toda semana.

### O que isso quebra

Quem tinha edições locais na lista de heróis do guia ou do visualizador de cartas perde essas
edições — o conteúdo agora vem do catálogo. Refaça em `data/catalogo.js` e as três telas pegam juntas.

---

## v0.3 — draft e Deck de Comando · 2026-08-08

- **Draft** com 2 banimentos e escolha alternada por rota (counterpick).
- **Deck de Comando**: 46 cartas em 22 tipos, 7 famílias (dado, tempo, reação, mapa, economia, buff, item).
  Compra 1 no início do turno, mão máxima 3, usadas vão para o cemitério.
- Buffs temporários (`aplicaBuff`/`limpaBuffs`) duram até o fim da rodada.
- Pool foi para 45 heróis e a loja para 22 itens.
- Partida completa passou a fechar em ~15 rodadas (era ~30 sem deck).

## v0.2 — jogabilidade e tutorial · 2026-08-08

- Seis conflitos de interface corrigidos (ver `docs/03-jogabilidade.md`): painel de comando explícito,
  cancelamento antes de gastar o dado, aviso de "ninguém no alcance", confirmação em dois toques,
  estado de seleção unificado, descrição calculada do efeito.
- Tutorial guiado de 9 passos.
- `<meta viewport>` — sem ele o celular renderizava a 980px e o jogo saía minúsculo.

## v0.1 — protótipo jogável · 2026-08-08

- Motor: mapa hexagonal, movimento, combate, morte, respawn, torres, ondas, Nexus.
- Dado Mestre de movimento + 3 dados de ação.
- Caçador com comando oculto. Placas do Topo, Prioridade do Meio.
- 10 heróis, 12 itens, loja.
