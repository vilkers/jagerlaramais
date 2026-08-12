# JAGERLARAMAIS — regras e dinâmicas

**Versão 20** · regras extraídas do motor (`jogo/jogo.js`), não da memória.

> Este arquivo substitui `docs/02-regras.md`, que ficou na v0.2 e descreve um jogo
> que não existe mais. Quando um número mudar no motor, mude aqui também — e
> registre o porquê em `docs/patch-notes.md`.

| | |
|---|---|
| Tabuleiro | 11×11, 116 casas |
| Conteúdo | 20 heróis · 22 itens · 46 cartas |
| Duração | mediana de 22 rodadas |

---

## 1 · O objetivo

Dois times de **cinco heróis** — **Azul** e **Carmim**. Cada jogador comanda um
time inteiro, e os dois jogam no mesmo aparelho, passando a vez.

**Vence quem levar o Nexus adversário a zero.** O Nexus tem 3 de vida e só fica
exposto depois que **uma rota inteira cai** — as duas torres daquela rota no
chão. A partida termina no instante do golpe: não existe contragolpe.

---

## 2 · O tabuleiro

Hexágonos, 11 por 11. O mapa é simétrico por rotação de 180°, por construção —
tudo que vale para um lado vale para o outro.

| Terreno | O que é |
|---|---|
| **Rotas** | Topo (17 casas), Meio (12), Baixo (17). Onde as ondas andam e onde ficam as torres |
| **Mato** | A selva, dividida em **mato de cima** (14 casas) e **mato de baixo** (14) |
| **Rio** | Faixa central neutra, sempre à vista |
| **Bases** | Uma por time, com o Nexus |
| **Poço** | Casa central onde mora o Dragão, e depois o Barão |

Dois heróis **nunca** ocupam o mesmo hexágono. Uma torre e um herói, sim — herói
em cima da própria torre é jogada normal, e ele continua sendo alvo.

---

## 3 · Turnos e rodadas

**Azul → Carmim → Azul → Carmim.** Quem começa a partida começa todas as rodadas.
Uma **rodada** é um turno de cada.

No **seu turno**:

1. Seus efeitos temporários expiram e sua ação volta a todos os heróis
2. Você rola **1 Dado Mestre** e **3 dados de ação**
3. Compra 1 carta
4. Move, ataca, usa habilidade, compra na loja, joga cartas — na ordem que quiser
5. Encerra. **Sua presença nas rotas é congelada neste instante**

No **fim da rodada**, depois dos dois turnos: as ondas avançam, as torres
apanham, a renda é paga, mortos contam respawn, Placas e Prioridade são apuradas,
e o poço reabre se for a hora.

**Primeiro Passo:** quem começa a partida rola **+1 no Dado Mestre na rodada 1**,
e só nela.

> **Dinâmica — por que a presença é congelada.** Se a contagem de quem domina cada
> rota acontecesse só no fim da rodada, o segundo jogador veria o posicionamento
> do adversário e responderia; o primeiro jogaria às cegas. Medimos: valia **6
> pontos** de taxa de vitória.

---

## 4 · Os dados

### Dado Mestre — o movimento do time

Um d6 por turno. O resultado é o **total de casas que os cinco heróis andam
juntos**. Tirou 4? São quatro casas: quatro com um herói, ou uma com quatro.

### Dados de ação — a Força das habilidades

Três d6 por turno. Cada habilidade exige uma **Força mínima**, e o valor do dado
entra na conta do dano.

**Cada herói gasta no máximo um dado de ação por turno.** Três dados para cinco
heróis: dois sempre ficam de fora — e quem fica de fora **farma 3 de ouro**.

**Todo dado tem saída:** um dado que não serve a ninguém pode virar **movimento**,
somando seu valor ao Dado Mestre.

| Dados a mais | De onde vêm |
|---|---|
| Retomada | +1 ou +2, automático, para quem está atrás |
| Prioridade | +1, gastando uma carga ganha no Meio |
| Adiantar | +1, pela carta |
| Suporte | doa o próprio dado a um aliado, que volta a poder agir |

---

## 5 · Heróis e funções

**20 heróis**, quatro por função. Cada um tem Vida, Poder, Armadura, Alcance e
**três habilidades** — duas básicas e uma Ultimate.

| Função | O que resolve |
|---|---|
| **Topo** | A ilha. Duelo isolado, e ganha **Placas** ao dominar |
| **Selva** | O caçador. Some no mato e aparece onde não era esperado |
| **Meio** | O relógio. Rota curta e central; dominar dá **Prioridade** |
| **Atirador** | O investimento. Escala com ouro e com a proximidade do Suporte |
| **Suporte** | A memória. Escuda, doa o próprio dado, e posta Ward |

As **classes** dizem como o herói se relaciona com o dado: Tanque (qualquer dado
serve), Lutador (médio para entrar, alto para fechar), Assassino (alta
variância), Mago (tudo ou nada), Atirador (depende de ter farmado, não do dado) e
Suporte (faz o outro jogar melhor).

---

## 6 · Combate

**Básica:** `Força × multiplicador da habilidade + Poder`
**Ultimate:** `Força × multiplicador × 1,5 + Poder`

Depois desconta a **Armadura** do alvo; o **Escudo** absorve o que sobrar antes da
vida. O dano nunca é menor que 1.

**Dano garantido:** três Ultimates (Julgamento, Ato Final, Sentença) causam um
número fixo e **ignoram Armadura**. São o melhor golpe do jogo contra tanque.

**Morte:** quem matou leva **4 de ouro**. O morto volta **2 rodadas depois**, na
base, com a vida cheia — e pode comprar na loja enquanto espera.

| Efeito | O que faz |
|---|---|
| Escudo | Absorve dano antes da vida. Não empilha entre rodadas |
| Preso | Não pode se mover |
| Intocável | Não recebe dano nenhum |
| Marca | Soma dano no próximo golpe recebido |
| Área | Respinga nos vizinhos — **inclusive no morador do poço** |

---

## 7 · Duração de efeitos

**Uma regra para todos:** escudo, buff de Poder, buff de Armadura, Ágil,
Intocável e Preso duram **até o início do seu próximo turno**.

> **Dinâmica.** "Até o fim da rodada" punia quem joga em segundo: o escudo dele
> nascia e morria dentro do próprio turno. Agora os dois lados têm exatamente
> **um turno adversário** de exposição.

---

## 8 · Visão e o mato

**Rota, rio e base todo mundo vê. O mato você só enxerga se tiver alguém dentro.**

São dois matos — cima e baixo — enxergados **em separado**. Ter alguém no mato de
cima não revela o de baixo. No tabuleiro, o mato onde você está cego aparece
**mais escuro**.

Um herói escondido **não deixa de existir**: ocupa a casa, bloqueia passagem,
coleta acampamento e **continua empurrando a rota**. Você é que parou de vê-lo.
Ao pisar numa rota, reaparece.

**Emboscada:** quem ataca **vindo do mato sem ter sido visto** ganha **+2 de
Força** no golpe. Vale uma vez, no golpe que sai da sombra.

**Ward:** acende **os dois matos** até o fim da rodada. Vem de habilidade de
Suporte ou de carta.

> **Dinâmica — por que presença e não raio de visão.** O mapa é compacto e quase
> sempre há um herói em cada rota; névoa por raio revelaria o tabuleiro quase
> inteiro o tempo todo. Amarrada à presença, a informação custa **uma peça** — e
> aí vira decisão: vigiar o mato, ou deixar essa peça pressionando a rota?

---

## 9 · Torres e Nexus

| Estrutura | Vida | Como cai |
|---|---|---|
| **Torre** | 3 | A onda tira 1 por rodada. O golpe de herói tira **1** — qualquer habilidade ofensiva |
| **Nexus** | 3 | Igual, mas só depois que uma rota inteira do lado dele cai |

**Torre exposta:** numa rota, só a **torre mais avançada ainda de pé** aceita
golpe. Enquanto ela vive, a de trás está protegida.

**Revide:** a torre devolve **2 de dano** a cada golpe, e o revide nunca mata.
**Não há limite de golpes por rodada** — o teto é dado na mesa e herói que ainda
não agiu. O que mede quanto você quer a torre é o pedágio, não uma trava.

---

## 10 · As ondas

Cada rota tem uma **Frente de Onda**. No fim de cada rodada, para cada rota:

- O time com **mais heróis presentes** empurra a frente 1 casa a seu favor
- Empate não move nada
- A onda **não passa por uma torre viva**
- Se a frente encosta numa torre, a torre perde 1 de vida

**O que conta como presença:** estar **a até 1 hexágono** da rota *e* ter
**passado da sua própria torre exterior**. Antes dela é desenvolvimento; depois
dela é rota ativa.

---

## 11 · Objetivos neutros

### Acampamentos

Três: um seu, um do adversário e um **neutro** — este sorteado entre duas
posições a cada partida, sempre equidistante das duas bases. Coleta-se **pisando
na casa**. Reaparecem 3 rodadas depois.

| Acampamento | Ouro |
|---|---|
| Seu | 3 |
| Neutro | 4 |
| Do adversário (invasão) | +1 a mais |

### O poço — Dragão e Barão

Bater no poço é como bater na torre, mas **sem dono**: qualquer um bate, e **quem
dá o último golpe leva o prêmio inteiro**. Básica tira **1**, Ultimate tira **2**,
respingo de área tira 1.

| Morador | Desce | Vida | Revide | Prêmio |
|---|---|---|---|---|
| **Dragão** | rodada 5 | 4 | 1 | **+1 de Poder** no time, permanente e acumulativo |
| **Barão** | rodada 12 | 4 | 2 | Escolha **1 de 3 dádivas**, por 2 rodadas |

Na rodada 12 o **Barão toma o poço mesmo com o Dragão vivo** — o que dá ao Dragão
um prazo de validade.

**As três dádivas do Barão:**

- **Ondas de Ferro** — as suas três ondas avançam sozinhas, mesmo sem herói nas rotas
- **Égide do Barão** — todos os seus heróis ganham 4 de escudo no início de cada turno seu
- **Aríete** — os seus golpes de herói em torre e Nexus causam 2 em vez de 1

> **Dinâmica — por que nenhuma dádiva dá Poder.** O Barão deixou de ser "seu time
> bate mais forte" e virou **pressão de mapa**. É o que o torna útil para quem
> está atrás sem o jogo entregar vantagem a quem perde. Medimos: a taxa de vitória
> de quem leva o Barão caiu de **70% para 51%** — ele parou de ganhar a partida
> sozinho.

---

## 12 · Ouro e loja

| Fonte | Quanto |
|---|---|
| Fim de rodada, herói que **não** agiu | 3 |
| Fim de rodada, herói que agiu | 1 |
| Matar um herói | 4 |
| Acampamento | 3 a 5 |

**22 itens.** Cada herói carrega **3** — ou 4, com a carta Relicário. Só compra
quem está **na própria base ou morto**.

### Gastar o ouro que sobra

| Gasto | Preço | O que faz |
|---|---|---|
| **Reforço** | 6, **+2 por compra** | +1 de Poder permanente neste herói |
| **Requisição** | 5 | Compra 1 carta do baralho |
| **Leva de Ferro** | 4, **+1 a cada 3 rodadas** (teto 12) | A sua onda de uma rota avança 1 casa |

> **Dinâmica — duas curvas de preço.** Reforço encarece conforme *você* compra, e
> por isso nunca vira renda infinita. Leva de Ferro encarece conforme a *partida*
> anda, porque compra território — cedo, empurrar uma rota é barato e rende pouco;
> tarde, é caro e pode fechar a partida.

---

## 13 · Cartas e feitiços

### Deck de Comando

**46 cartas**, 22 tipos, 7 famílias. Compra-se **1 no início de cada turno**, mão
máxima de **3** — passou disso, a mais antiga é descartada.

Famílias: **dado** (conserta rolagem ruim) · **tempo** (ação ou dado a mais) ·
**reação** · **mapa** (ward, recall, onda) · **economia** · **buff** · **item**.

### Feitiços de invocador

O time inteiro divide **uma carga**, gasta em Lampejo *ou* em Retorno, e ela leva
**3 rodadas** para voltar.

- **Lampejo** — salta até 2 casas, ignorando movimento e prisão
- **Retorno** — volta à base e recupera 3 de vida. Interrompido se houver inimigo colado

> **Dinâmica.** Com um feitiço por herói, a pergunta é "posso?" e a resposta é
> sempre sim. Com uma carga por time, vira **"quem merece?"** — e o adversário
> conta junto: feitiço gasto é informação.

---

## 14 · Placas, Prioridade, Retomada

| Vantagem | Como se ganha | Para que serve |
|---|---|---|
| **Placas** | Dominar o Topo no fim da rodada | 1 placa: ±1 num dado. 2 placas: re-rolar |
| **Prioridade** | Dominar o Meio (guarda até 2) | Rolar **1 dado de ação a mais** |
| **Retomada** | Automática, para quem está atrás | **+1 ou +2 dados de ação**, toda rodada |

A Retomada mede perigo por **torres perdidas** (cada uma vale por duas) somadas à
**invasão** — quantos hexágonos de onda inimiga estão do seu lado. Ela **some
sozinha** quando a diferença fecha: é freio, não presente permanente.

---

## 15 · Draft

Cada jogador **bane 1 herói**, e **uma rota só pode perder um herói** para
banimentos — com quatro heróis por rota, dois bans na mesma zerariam o
counterpick dela.

As escolhas acontecem **rota por rota**, alternando quem escolhe primeiro: Topo,
Selva, Meio, Atirador, Suporte. Quem escolhe primeiro no Topo escolhe por último
na Selva.

---

## 16 · As dinâmicas

As regras dizem o que é permitido. Esta seção diz **onde estão as decisões**.

**Três dados, cinco heróis.** A tensão de base. Todo turno dois heróis ficam sem
agir — e ganham 3 de ouro por isso. A pergunta nunca é "o que faço?", é **"quais
três?"**. E o herói que você deixa de fora hoje é o que estará mais rico amanhã.

**O Dado Mestre é um bolso comum.** Movimento é do time, não do herói. Aproximar
o assassino custa literalmente o recuo do atirador.

**Informação custa uma peça.** O mato só se enxerga com alguém dentro. Mandar um
herói vigiar é tirá-lo da rota; não vigiar é jogar sem saber de onde vem o
próximo golpe.

**Torre ou objetivo.** O revide de 2 torna a torre uma **conta**: bater três vezes
custa 6 de vida ao time. Quando o poço abre, a mesma ação que derrubaria uma
torre pode fechar um Dragão. O jogo não diz qual escolher — só garante que você
não tem dado para as duas.

**A Ultimate é um pico, não um botão.** Rende 1,5× o dado, mas exige 5 ou 6.
Guardar o dado alto para ela é abrir mão de três ações pequenas. E ela vale 2 no
poço contra 1 da básica: às vezes o melhor uso da Ultimate não é num herói.

**Quem está atrás recebe dado, não perdão.** A Retomada dá **ação**, que é o que
falta a quem está apanhando, e some quando a diferença fecha. O Barão dá
território, não dano. As duas existem para que a virada seja **possível**, não
automática.

**O relógio da partida.** Rodada 5 o Dragão desce. Rodada 12 o Barão toma o poço.
A partida mediana dura 22 rodadas. Cedo você desenvolve, no meio briga pelo
Dragão, e depois da 12 tudo é sobre fechar.
