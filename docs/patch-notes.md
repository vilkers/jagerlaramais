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
