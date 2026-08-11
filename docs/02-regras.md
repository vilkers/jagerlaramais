# JAGERLARAMAIS — regras completas

Versão <!--n:versao-->v0.6.3<!--/n--> · para quem nunca jogou. Leia na ordem.

> **Este documento descreve o jogo que o motor executa hoje.** Onde houver regra
> desenhada mas ainda **não implementada**, está marcado com 🔸 — nada de anunciar
> mecânica que a mesa não entrega. Os números vêm do código (`node sim/docs.js`).

---

## O que você está fazendo aqui

Dois jogadores. Cada um comanda **cinco heróis** — um em cada posição. Você não é nenhum deles: você é o técnico, olhando o mapa inteiro e decidindo onde intervir.

**Você vence destruindo o Nexus do adversário.**

Para chegar lá você precisa empurrar uma rota até o fim, derrubando as torres do caminho. Empurrar rota é o caminho da vitória — brigar é só o meio.

---

## OS DADOS: 1 DE MOVIMENTO + 3 DE AÇÃO

Toda rodada você rola **quatro dados**, e eles fazem coisas diferentes:

### 🎲 O Dado Mestre de Movimento — um só, para o time inteiro

> **O valor dele é o total de casas que os seus CINCO heróis podem andar juntos nesta rodada.**

Tirou 4? São 4 casas no total. Pode gastar as 4 com um herói só, ou 1 casa com quatro heróis diferentes.

**É aqui que o jogo mora.** Aproximar o assassino custa o recuo do atirador. Você nunca consegue colocar todo mundo onde queria — e é exatamente isso que faz o mapa importar.

### 🎲🎲🎲 Os três Dados de Ação — um por herói

> **Cada dado de ação alocado num herói vira a FORÇA da habilidade dele.**

Cada habilidade exige uma **Força mínima**, e é isso que dá personalidade a cada herói:

| Exigência | O que significa |
|---|---|
| `Força 1+` | Quase sempre dá pra usar. Heróis consistentes. |
| `Força 3+` | Precisa de um dado médio. Comprometimento. |
| `Força 5+` ou `6` | **Ultimates.** Só saem com dado alto — e dado alto é raro. |

**Um dado por herói, por rodada.** Não dá para empilhar os três no mesmo herói.

### A ponte entre os dois

Precisa de mais mobilidade numa rodada específica? **Você pode virar um dado de ação em movimento** — ele soma seu valor ao total de casas. Você troca uma jogada por posição.

---

## A OUTRA REGRA QUE DECIDE TUDO

> **Você tem 3 dados de ação e 5 heróis.**
> **O herói que NÃO recebe dado FARMA — e ganha mais ouro do que quem age.**

| Situação | Ouro no fim da rodada |
|---|---|
| Herói recebeu dado (agiu) | **<!--n:ouroAgiu-->1<!--/n-->** |
| Herói não recebeu dado (**farmou**) | **<!--n:ouroFarmou-->3<!--/n-->** |
| Herói morto | **0** |

Agir custa dinheiro. Toda rodada você decide: intervir agora, ou ficar rico e intervir melhor depois. Isso é a tensão econômica do MOBA inteiro em uma linha de regra.

---

## A RODADA, PASSO A PASSO

### 1 · Comando Oculto
Os dois jogadores, **ao mesmo tempo e em segredo**, escolhem para onde o próprio **Caçador** (o herói da selva) vai: rota de cima, meio, baixo, ou ficar na selva. A escolha fica virada para baixo.

### 2 · Turno do primeiro jogador
Compra 1 carta do Deck de Comando. Rola o Dado Mestre e 3d6 de ação. Aloca. Age. Encerra.
**No fim deste turno, a carta do Caçador do OUTRO jogador é revelada** e resolve.

### 3 · Turno do segundo jogador
Mesma coisa.
**No fim deste turno, a carta do Caçador do PRIMEIRO jogador é revelada** e resolve.

> Por que assim: você esconde o Caçador antes de saber o que o adversário vai fazer, e ele só aparece depois que o adversário já se comprometeu. É o blefe do gank, inteiro, em uma carta virada.

### 4 · Ondas
Em cada rota, a **Frente de Onda** desliza 1 casa para o lado de quem tem mais heróis vivos naquela rota. Empate: não anda. **Torre viva trava o avanço** — a onda não passa por cima dela.
Onde a Frente encosta numa torre, ela tira **1 de vida** daquela torre.

### 5 · Renda
Cada herói ganha ouro pela tabela acima. Placas e Prioridade são apuradas.

### 6 · Respawn
Timers de morte descem 1. Quem chega a zero volta à base.

### 7 · A iniciativa troca de lado
Quem jogou primeiro nesta rodada joga por último na próxima. **Isso é regra, não detalhe:**
com a iniciativa fixa, o mesmo time abria as ~12 rodadas seguidas e isso valia 60,3% de
vitórias; alternando, cai para 56,8% (medido, ver patch notes).

---

## COMO SE MOVE

Cada herói começa na entrada da própria rota. Mover 1 casa custa 1 ponto do **Dado Mestre**, que é comum ao time.

- Você pode andar por **qualquer terreno** — rota, selva, rio. O rio é pintura: não custa nada a mais.
- Você **não pode** parar numa casa ocupada por outro herói.
- Mover e agir são independentes: um herói pode andar e também receber um dado de ação, ou fazer só um dos dois.

**Ágil** (alguns heróis têm): a primeira casa de movimento não custa nada.

---

## COMO SE BRIGA

Sem rolagem extra. O dado já foi rolado.

```
DANO = FORÇA + PODER do herói − ARMADURA do alvo   (mínimo 1)
```

**Alcance** diz de quão longe você atinge:
- Alcance 1 → só casa vizinha (corpo a corpo)
- Alcance 3 → até 3 casas de distância (à distância)

**Crítico:** se o dado alocado era um **6 natural**, a habilidade dispara o efeito extra escrito na carta.

**Morte:** vida em 0, o herói sai do mapa e volta à base depois de **<!--n:respawn-->2<!--/n--> rodadas**. Quem matou ganha **<!--n:ouroAbate-->4<!--/n--> de ouro**.

> 🔸 **Respawn crescente para quem está na frente** (3 rodadas com o dobro do ouro do
> adversário) está desenhado e **não existe no motor** — hoje todo mundo volta em <!--n:respawn-->2<!--/n-->.

---

## AS CINCO POSIÇÕES

Cada uma joga um jogo diferente. Leia esta seção com atenção — é o que separa este jogo de um jogo de escaramuça qualquer.

### 🔼 TOPO — "A Ilha"
Fica sozinho na rota de cima, longe de tudo. Não espere ajuda e não vá ajudar.

**Placas.** No fim de cada rodada, se o seu Topo estiver na rota de cima e mais avançado que o Topo inimigo, você ganha **1 Placa**.

**Placa é moeda de dado** — e é assim que a ilha influencia o mapa inteiro:

| Custo | O que faz |
|---|---|
| 1 Placa | **Ajusta um dado em ±1** (transforma um 5 em 6 e destrava uma ultimate) |
| 2 Placas | **Re-rola um dado** |
| 🔸 3 Placas | **Teleporte** — desenhado, **não existe no motor** |

O Topo é a única fonte de controle sobre a sorte que você mesmo constrói. Ganhar de lado no topo é o que faz seu meio conseguir a ultimate na hora certa.

### 🌑 SELVA — "O Caçador"
O único herói cuja ação é **decidida em segredo**.

Toda rodada você escolhe uma de quatro zonas com a carta virada:
- **Selva** → ganha <!--n:cacaFarm-->3<!--/n--> de ouro
- **Uma rota** → **gank**: aparece lá e ataca com **+<!--n:gankForca-->2<!--/n--> de Força**

A carta revela no fim do turno do adversário. Ele já se comprometeu quando você aparece.

**O blefe é metade do valor.** Virar a carta no topo e ver o adversário jogar defensivo lá enquanto era só farm já ganha a rota de baixo de graça.

> 🔸 O **buff de acampamento** por ficar na selva está desenhado e não existe: hoje a
> selva rende ouro e posição, não modificador de dado.

### ⏱️ MEIO — "O Relógio"
A rota do meio é a mais curta do mapa. Quem domina ela chega primeiro em qualquer lugar.

**Prioridade.** No fim da rodada, se o seu Meio estiver mais avançado que o Meio inimigo, você ganha **1 Prioridade** (acumula até <!--n:prioMax-->2<!--/n-->).

> **Gastar 1 Prioridade = rolar um dado de ação a mais**, na hora que você quiser dentro do seu turno.

Ou seja: dominar o meio te dá **uma jogada a mais que o adversário**. E como você decide *quando* gastar, dá pra segurar até ver que os três dados vieram ruins — e aí puxar mais um.

O Meio não é o mais forte. Ele é quem **te dá mais opções**.

> **As duas rotas que mexem nos dados são o Topo e o Meio.** O Topo compra controle sobre a sorte (ajusta e re-rola); o Meio compra quantidade de jogadas. Ganhar de lado nessas duas rotas é o que faz o resto do time funcionar na hora certa.

### 🎯 ATIRADOR — "O Investimento"
Frágil e caro. É o único que fica mais forte com o tempo.

**Patamares:** a cada **<!--n:patamarOuro-->10<!--/n--> de ouro** que o Atirador acumular, ele ganha **+<!--n:patamarPoder-->2<!--/n--> de Poder**, para sempre. Até <!--n:patamarMax-->3<!--/n--> vezes.

**Dupla:** enquanto o seu Suporte estiver vivo e a até 2 casas dele, o Atirador ganha **+2 de Poder** no golpe.

Isso instala o relógio da partida: um lado joga para fechar antes do Atirador ficar pronto, o outro joga para segurar até lá.

### ♻️ SUPORTE — "A Memória"
Não tem número grande. Tem influência.

- **Escuda** aliados
- **Doa o próprio dado** para outro herói usar — mas não para quem já agiu
- **Ward** — revela a carta do Caçador inimigo antes dela virar
- **Eco** — reduz o respawn de um aliado em 1 rodada

O Suporte é o único herói cujo poder é medido inteiramente pelo que os outros conseguem fazer.

---

## O MAPA

Tabuleiro hexagonal **<!--n:tabuleiro-->11×11<!--/n-->**, <!--n:casas-->116<!--/n--> casas. Três rotas ligam as duas bases; a selva é o interior, com <!--n:casasSelva-->30<!--/n--> casas; o rio corta a diagonal e é só pintura.

As rotas têm **duas casas de largura** — suporte e atirador cabem lado a lado — estreitando para uma só na **boca da base**, que é onde ainda dá para segurar avanço.

O mapa é **gerado e espelhado**: tudo que um time tem, o outro tem na posição girada em 180°. Não existe lado bom.

**Frente de Onda** — cada rota tem um marcador que mostra onde as duas ondas de tropas se encontram. Ele desliza para o lado de quem tem mais heróis vivos naquela rota, 1 casa por rodada, e **para na primeira torre viva**.

**Torres** — duas por rota, de cada lado, <!--n:torres-->12<!--/n--> ao todo. Cada uma tem **<!--n:vidaTorre-->3<!--/n--> de vida**.

| Quem bate | Quanto | Com que frequência |
|---|---|---|
| A Frente de Onda encostada | 1 | toda rodada |
| Um herói, com uma habilidade de dano | <!--n:danoTorre-->1<!--/n--> | **uma vez por rodada, por torre** |

**O herói não depende da onda para cercar.** Basta alcançar a torre. Mas só a **torre exposta** — a mais avançada que ainda está de pé naquela rota — aceita golpe; enquanto ela viver, a de trás está protegida. E a torre **revida <!--n:revideTorre-->2<!--/n-->** em quem encostou (o revide nunca mata).

**Nexus** — tem **<!--n:vidaNexus-->3<!--/n--> de vida** e só fica exposto quando as **duas torres** de uma rota caem. Aí a Frente de Onda passa a bater nele, e um herói que alcance a base inimiga também: <!--n:danoTorre-->1<!--/n--> de dano, **um golpe por rodada**, sem revide — quem chegou até aqui já pagou o pedágio das duas torres.

**Zerou o Nexus, acabou o jogo.**

---

## O POÇO — DRAGÃO E BARÃO

Há **um poço** no meio do mapa, na casa <!--n:poco-->[8,8]<!--/n-->, em terreno de ninguém — e ele **muda de morador**. Vazio, mostra a rodada em que o próximo desce: esse é o relógio da partida.

| | Dragão | Barão |
|---|---|---|
| Desce a partir da rodada | <!--n:rodadaDragao-->5<!--/n--> | <!--n:rodadaBarao-->8<!--/n--> |
| Vida | <!--n:vidaDragao-->3<!--/n--> | <!--n:vidaBarao-->5<!--/n--> |
| Revida | <!--n:revideDragao-->1<!--/n--> | <!--n:revideBarao-->2<!--/n--> |
| Volta depois de cair em | <!--n:voltaDragao-->3<!--/n--> rodadas | <!--n:voltaBarao-->4<!--/n--> rodadas |
| Prêmio | **Herança**: +<!--n:herancaPoder-->1<!--/n--> de Poder no time, **para sempre**, e acumula | **Fúria**, por <!--n:furiaRodadas-->2<!--/n--> rodadas: +<!--n:furiaPoder-->2<!--/n--> de Poder e as três ondas avançam sozinhas |

Bater no poço é como bater na torre — 1 de dano por golpe — **só que sem limite por rodada e sem dono**. Quem dá o **último golpe** leva o prêmio inteiro. É por isso que ninguém deixa o poço sozinho: a janela do roubo existe até o fim.

Dragão **compõe**; Barão **vira a mesa**. É a distinção do MOBA, e é de propósito.

---

## RETOMADA — O FREIO DA BOLA DE NEVE

O jogo mede automaticamente o quanto você está apanhando:

- cada **torre sua caída** conta <!--n:pesoTorre-->2<!--/n-->
- cada **hexágono de onda inimiga do seu lado** do vão conta 1

Se a sua conta passar a do adversário em **<!--n:retomada1-->2<!--/n-->**, você rola **+1 dado de ação**.
Em **<!--n:retomada2-->4<!--/n-->**, também ganha **+1 no Dado Mestre**.

É automático e **some sozinho** quando a diferença fecha. Estar atrás não devolve a partida — devolve **ação** para brigar por ela.

---

## O QUE VEM ANTES E DURANTE

**Draft** — <!--n:bans-->1<!--/n--> banimento por jogador (uma rota só pode perder um herói), depois escolha rota a rota, alternando quem escolhe primeiro. Quem escolhe depois vê a escolha do adversário: é o counterpick. Detalhe em `docs/04-draft-e-deck.md`.

**Deck de Comando** — <!--n:cartas-->46<!--/n--> cartas em <!--n:tiposCarta-->22<!--/n--> tipos, baralho comum. Compre 1 no início do seu turno, mão máxima <!--n:maoMaxima-->3<!--/n-->, usadas vão para o cemitério.

> 🔸 As cartas de **Reação** ainda não são jogáveis no turno do adversário: o catálogo
> declara `quando:"reacao"` e o motor não lê esse campo. Hoje elas funcionam como
> escudo antecipado no seu próprio turno.

**Loja** — abre para herói que está **na própria base ou morto**. Até 3 itens por herói.

---

## RESUMO EM UMA PÁGINA

1. Escondam a carta do Caçador
2. Compre 1 carta de Comando
3. Role **1 Dado Mestre + 3 dados de ação**
4. Gaste o movimento entre os cinco heróis — é um bolo só
5. Aloque os dados de ação: o valor vira a **Força** da habilidade, um dado por herói
6. Quem ficou sem dado de ação **farma <!--n:ouroFarmou-->3<!--/n--> de ouro**
7. Encerre; a carta do adversário revela
8. Ondas deslizam, torres apanham, ouro entra, mortos contam o tempo
9. A iniciativa troca de lado
10. Repita até o Nexus cair

---

## O QUE AINDA NÃO EXISTE 🔸

| # | Falta | Por que importa |
|---|---|---|
| 1 | **Acampamentos de selva** | Os buffs Azul e Vermelho, que mexem nos dados. A selva tem <!--n:casasSelva-->30<!--/n--> casas e nada dentro |
| 2 | **Zona de armadilha** | As cartas de Reação não funcionam no turno do adversário |
| 3 | **Feitiços de invocador** | 5 cartas que geram as melhores histórias da partida |
| 4 | **Limite de rodadas** | O que acontece se ninguém fechar? A contraproposta medida é 30 rodadas, com desempate por Nexus → torres → ouro |
| 5 | **Arauto** | Tem arte, não tem regra — e o poço já sabe trocar de morador |
| 6 | **Teleporte do Topo e respawn crescente** | Desenhados nas regras desde a v0, nunca implementados |

Loja, draft, comeback e objetivos épicos **saíram desta lista** — entraram entre a v0.5.1 e a v0.5.5.
