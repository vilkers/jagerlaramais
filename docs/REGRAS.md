# JAGERLARAMAIS — regras e dinâmicas

**Versão 28** · regras extraídas do motor (`jogo/jogo.js`), não da memória.

> Este arquivo substitui `docs/02-regras.md`, que ficou na v0.2 e descreve um jogo
> que não existe mais. Quando um número mudar no motor, mude aqui também — e
> registre o porquê em `docs/patch-notes.md`.

| | |
|---|---|
| Tabuleiro | 11×11, 116 casas |
| Conteúdo | 20 heróis · 22 itens · 46 cartas |
| Duração | mediana de 23 rodadas |

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
| **Mato** | A selva, **27 casas**. Bloqueia visão: só se enxerga de dentro (§8) |
| **Rio** | Faixa central neutra. Não bloqueia visão nem movimento |
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

### Movimento máximo — o teto de cada herói

O bolso é do time, mas **nenhum herói atravessa mais do que o próprio teto de
casas por turno**, por mais movimento que sobre na mesa.

| Perfil | Teto | Quem |
|---|---|---|
| Pesado | **3** | Taxista, Grumo, Caramêlo, Torvald — Armadura 3+ e alcance 1 |
| Normal | **4** | os onze do meio |
| Ágil | **5** | Pombo, Valti, Pyk, Zhet, Catarino — os cinco com `agil` |

**Ninguém tem 6**, e é escolha: 6 é o vão inteiro entre as duas torres
exteriores de uma rota.

**O teto é em CASAS, não em pontos de movimento.** Um herói com 20 no bolso do
time anda no máximo o teto dele; o custo do caminho continua saindo do bolso
comum. E o teto entra **depois** do piso de 1 da Lentidão — senão a Lentidão
devolveria movimento a quem já tinha andado tudo.

**Não contam para o teto:** Lampejo, Retorno, Puff de Emergência, o recuo do
Passo de Sombra, a carta Recuo e qualquer puxão, empurrão ou troca de lugar.
Nenhum é caminhada, todos já têm limite e custo próprios — é o que preserva a
identidade de quem é móvel.

**Item de movimento sobe o TETO**, e não devolve movimento: Passos do Vento,
Botas Rúnicas, Ampulheta Rachada e Ampulheta Dourada dão **+1 casa** cada, com
teto absoluto de **6**.

> **Por quê.** Medido em `sim/movimento.js`: o Dado Mestre somado a todos os
> dados de ação convertidos dá um bolso de **mediana 15 e máximo 21**, e de base
> a base são **15 casas**. Sem teto, um herói atravessava o mapa inteiro numa
> jogada — e posicionamento, rota, Caçador e emboscada deixavam de importar.

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
| Suporte | doa o próprio dado a um aliado, que volta a poder agir. O dado doado tem **dono** e **sai antes dos outros**: só serve àquela peça e morre no fim do turno |

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
**Habilidade do meio:** `Força × multiplicador × 1,2 + Poder`
**Ultimate:** `Força × multiplicador × 1,25 + Poder`

> **Dinâmica — por que a do meio escala.** Ela exige dado **3 ou mais**; a básica
> sai com qualquer um. Sem escala própria, as duas davam o mesmo número e o
> jogador pagava um dado mais raro pelo mesmo dano — o efeito (prender, puxar)
> vinha como se fosse grátis, e não é: vem em vez da liberdade de gastar aquele 3
> em outro herói. Medido em `sim/habs.js`.

Depois desconta a **Armadura** do alvo; o **Escudo** absorve o que sobrar antes da
vida. O dano nunca é menor que 1.

**Defender junto da torre:** herói colado (distância ≤ 1) numa torre **viva do
próprio time** ganha **+1 de Armadura**. A torre do adversário não protege quem
está mergulhando nela, e o bônus **cai junto com a torre**. É a diferença entre
brigar em casa e brigar no vão da rota.

**Dano perfurante:** três Ultimates (Julgamento, Ato Final, Sentença) **ignoram
Armadura**. Elas escalam como qualquer outra (`Força × 0,8 × 1,25 + Poder`), mas
com multiplicador reduzido — é o preço do dano que passa por dentro. Contra alvo
sem armadura rendem menos que uma Ultimate comum; contra tanque, mais. Até a v26
eram número fixo e não cresciam com nada.

**Dois alvos no mesmo hexágono:** herói e estrutura dividem casa o tempo todo
(defensor em cima do Nexus, herói em cima da própria torre). O toque abre uma
**janela perguntando em quem bater**. Com um alvo só, resolve direto.

**Morte:** quem matou leva **8 de ouro**. O morto volta na base, com a vida
cheia, e pode comprar na loja enquanto espera. **O tempo cresce com a partida:**

| Rodada | Volta em |
|---|---|
| 1 a 8 | 2 rodadas |
| 9 a 16 | 3 rodadas |
| 17 em diante | 4 rodadas |

> **Dinâmica.** Com preço fixo de 2, segurar o próprio Nexus morrendo de propósito
> saía de graça. Cedo, morrer é lição; tarde, morrer é a partida. Até a v25 o
> respawn era também a única forma de recuperar vida cheia — morrer era a cura
> mais barata do jogo, que é o incentivo errado. A **cura de base** (adiante)
> desfez isso.

| Efeito | O que faz |
|---|---|
| Escudo | Absorve dano antes da vida. Não empilha entre rodadas. Aparece como **ESCUDO** na peça |
| Sangramento / veneno | Dano por rodada com prazo, **ignora armadura e escudo** (adiante) |
| Preso | Não pode se mover |
| Intocável | Não recebe dano nenhum |
| Marca | Soma dano no próximo golpe recebido |
| Área | Respinga nos vizinhos — **inclusive no morador do poço** |

---

## 6.1 · Rotação do Caçador

No **início de cada rodada** os dois jogadores escolhem, **escondido um do
outro**, para que **região** o próprio Caçador vai. Ele é **reposicionado na
hora** — não gasta o Dado Mestre nem a ação dele.

**Ele reaparece sempre dentro da selva**, na parte dela colada à região
escolhida, e **nunca dentro da rota**.

| Escolha | Onde ele reaparece | Bônus, no turno dele |
|---|---|---|
| **Topo** | a casa de selva colada à rota de cima, do próprio lado | +2 de Armadura |
| **Meio** | a casa de selva colada à rota do meio, do próprio lado | +2 de Poder |
| **Baixo** | a casa de selva colada à rota de baixo, do próprio lado | +6 de ouro |
| **Selva** | o centro da própria selva | cura 4 e +1 no Dado Mestre |
| **Continuar onde está** | **em lugar nenhum — ele não sai da casa em que parou** | nenhum |

**A quinta opção não é uma região.** Ela não é a Selva, não é voltar para a
Selva, não é ir para o centro e não é reescolher a região atual: é **não mexer
no Caçador**. Vale quando a casa em que ele parou já vale mais do que qualquer
reposicionamento — em cima do acampamento, colado no poço, ou de tocaia. O preço
é abrir mão do bônus da região.

**A IA também escolhe entre as cinco.** Ela mede ficar com a mesma régua das
regiões, só que a partir de onde o Caçador está: inimigo exposto ao alcance,
aliado por perto para fechar o gank, poço colado, acampamento maduro. Gank já
**encostado** vale mais que gank que ainda pede deslocamento. Sem nada em volta,
ficar vale zero e qualquer região ganha.

As quatro casas são **derivadas da planta do mapa**, não escritas à mão, e as do
time 1 são o **espelho** das do time 0 — `gira` leva a rota de cima na de baixo,
então o espelho de "Topo" é "Baixo".

**Casa ocupada ou inválida:** pousa na casa de selva válida mais próxima, dentro
da mesma região. Nunca em rota, nunca em base, nunca em cima de outra peça,
nunca fora do tabuleiro.

**10 segundos para decidir.** Sem escolha, vai sozinho para a **Selva** — a
regra do timeout **não mudou** com a entrada da quinta opção, e a partida nunca
fica parada esperando.

**A escolha é secreta.** O adversário não recebe aviso nenhum de qual região foi
escolhida, e nada vai para o log. Para saber onde o Caçador caiu ele precisa ter
**visão daquele mato** — de olho ou de ward. A informação está presa à
**posição**, nunca ao botão.

> **História.** A v18 teve uma rotação em que o Caçador **saía do tabuleiro** e
> reaparecia noutra entrada de selva; a v19 desfez, por correção do Vinicius. Da
> v28 à v37 a rotação era **andar** até 3 casas de graça, interceptável. A v38
> voltou ao reposicionamento imediato, a pedido do Vilker. A metade da correção
> do Vinicius que **continua de pé**: o Caçador nunca deixa de estar num lugar
> real do tabuleiro. O que ele deixou de ser é interceptável no caminho.
>
> Os bônus de destino (+3 de ouro, +1 de Poder, +4 roubados, +1 no golpe do poço)
> **saíram junto** com os destinos que os davam. O Caçador ainda coleta
> acampamento **por ocupação**, como qualquer herói.


---

## 6.2 · Hexágonos bloqueados

Algumas casas da **selva** são fisicamente bloqueadas. **Herói não entra e não
atravessa.** Elas existem para a selva deixar de ser campo aberto e virar
**corredor** — entrada, atalho, caminho de Caçador, lugar de emboscada.

**O obstáculo é o próprio hexágono**, e ele conta a história do mundo: ônibus
abandonado, carros empilhados, caixa-d'água. Nunca pedra genérica.

| | |
|---|---|
| Quantas | **6** — 3 pares espelhados, de 27 casas de selva |
| Onde | **só na selva** — rota, base, rio e poço nunca bloqueiam |
| Nunca em | acampamento, ponto de pouso do Caçador, vizinha do poço |
| Visão | **bloqueiam**, como todo mato |
| Empurrão/puxão | não jogam ninguém para dentro |
| Ward | não se planta dentro |
| Lampejo | **passa por cima**, mas não pousa dentro — é salto |

**Andar passa a ter duas réguas.** `distância` continua sendo a linha reta e
continua valendo para **alcance de habilidade** — o ônibus para o pé, não o tiro.
Para **andar**, a régua é o caminho que contorna o obstáculo: a casa atrás do
ônibus pode estar a 2 de distância e a 4 de caminhada, e o herói paga 4.

**Herói não bloqueia caminho** — só o obstáculo. Continua valendo passar por cima
de aliado e de inimigo, como sempre foi.

**A planta não mudou.** Nenhum hexágono nasceu, sumiu ou trocou de lugar; o que
mudou é quais casas são caminháveis. São 116 hexágonos, como antes.

**As seis são derivadas da planta, não escritas à mão**, e passam por duas
travas: o tabuleiro continua inteiro (toda casa alcança toda casa) e a selva
continua com as **mesmas duas regiões** que já tinha. Bloquear a casa errada
partia a selva em ilhas e prendia o Caçador no próprio quintal — aconteceu na
primeira tentativa, com `[2,5]`.

---

## 7 · Duração de efeitos

**Uma regra para todos:** escudo, buff de Poder, buff de Armadura, Ágil,
Intocável e Preso duram **até o início do seu próximo turno**.

> **Dinâmica.** "Até o fim da rodada" punia quem joga em segundo: o escudo dele
> nascia e morria dentro do próprio turno. Agora os dois lados têm exatamente
> **um turno adversário** de exposição.

---

## 8 · Visão e o mato

**Você enxerga o que as suas peças enxergam.** O resto do tabuleiro é escuridão —
inclusive pedaço de rota. Herói dentro da escuridão **não aparece na tela** e
**não pode ser mirado**.

| Fonte de visão | Raio |
|---|---|
| Herói vivo | 2 |
| Torre viva | 2 |
| Base | 2 |
| Frente de Onda (o creep) | 2 |
| **Ward** | **3** |

**E o mato bloqueia: dentro do mato só se enxerga de dentro do mato.** Estar
colado nele pela rota não adianta. Ward plantada na rota também não vê lá dentro
— para vigiar o mato é preciso **entrar** ou **plantar a ward dentro**. Fora do
mato, raio é raio.

*No início da partida: 61 dos 116 hexágonos visíveis, os três acampamentos
escuros para os dois lados.*

Um herói escondido **não deixa de existir**: ocupa a casa, bloqueia passagem,
coleta acampamento e **continua empurrando a rota**. Você é que parou de vê-lo.

**Emboscada:** quem ataca **sem ter sido visto** ganha **+2 de Força** no golpe.

**Mas quem ataca fica revelado.** Golpe em herói inimigo entrega a posição: o
atacante fica visível para o adversário **até sair da casa de onde bateu**. A
emboscada é uma troca — dano agora, esconderijo depois.

**Ward:** peça no mapa, com posição e **3 rodadas** de prazo. Vem de habilidade
de Suporte, da carta Sinalizador, ou da **Sentinela** comprada na loja (§12).

> **Dinâmica — por que o mato é terreno e não pintura.** A versão anterior tinha
> só o raio, e ela foi medida: no início da partida o time já enxergava **78 dos
> 116** hexágonos. Com seis torres, três ondas, a base e cinco heróis acendendo 2
> de raio, sobrava escuro onde ninguém ia — e o mato, o único lugar em que
> esconder-se é jogada, vinha aceso de graça. Diminuir os raios escureceria o
> mapa inteiro por igual. Fazer o mato **bloquear** escurece exatamente o pedaço
> que precisa de decisão: vigiar o mato custa **uma peça ou uma ward**.

---

## 9 · Torres e Nexus

| Estrutura | Vida | Armadura | Como cai |
|---|---|---|---|
| **Torre** | **20** | **5** | A onda tira **7** por rodada (um terço de torre). O golpe de herói é **calculado** — ver abaixo |
| **Nexus** | 3 | — | O golpe de herói tira 1, e só depois que uma rota inteira do lado dele cai — o **último ponto é de herói** |

### O golpe de herói em estrutura

```
dano = round(dado × dano da habilidade × escala do slot) + Poder + Carregado
       − Armadura da estrutura        (mínimo 1)
```

**Perfurante ignora a Armadura da estrutura**, como ignora a de um herói e a do
Barão — é o que dá às três Ultimates de dano garantido um papel contra
construção, sem nenhuma exceção escrita por nome de herói.

**O que NÃO existe contra concreto:** crítico, emboscada, drenar, execução e
qualquer condição — Sangramento, Veneno, Atordoamento, Silêncio, Marca. A
classificação mora num lugar só (`podeAtingirEstrutura` e `multEstrutura`), e um
herói novo entra declarando `estrutura` na habilidade.

> **Por que 20, e por que a onda tira 7.** A escala foi escolhida para **não
> mudar o relógio da onda**: continuam sendo 3 rodadas de cerco para derrubar
> uma torre cheia, 2 com a onda grossa e 1 no terceiro degrau — a cadência
> medida e escolhida na v47. O que mudou é o golpe de HERÓI, que era 1 fixo
> para todo mundo: o tanque com dado 1 e o atirador com Ultimate e três itens
> derrubavam torre na mesma velocidade, e investir não valia nada contra
> estrutura.

### A torre atira em quem mergulha sozinho

```
CREEP PRESENTE  → o herói pressiona à vontade
SEM CREEP       → a torre pune o herói
```

No **fim do turno** de quem se expôs — antes de a presença ser congelada, para
que quem cair já conte como morto na conta da rota:

| | |
|---|---|
| **Perto** | **1 hexágono**. A mesma régua do +1 de Armadura de quem defende junto da própria torre: a zona de proteção e a de ameaça são a mesma casa |
| **Creep aliado** | a **Frente de Onda daquela rota, dentro da zona da torre** — não em qualquer lugar da rota |
| **Alvo** | **um por torre**: quem bateu nela neste turno, depois o mais ferido, distância desempata |
| **Dano** | **5**, e **não mata** — deixa em 1 |
| **Custo** | nenhum: não gasta dado, ação, carta nem recurso de ninguém |
| **Torre caída** | não atira |

> **Por que não mata.** `mata()` precisa de um autor para creditar o ouro, e
> morte sem autor é buraco de motor. Na prática a torre não rouba o abate, ela
> **arma** o abate: quem mergulhou sozinho termina o turno em 1 de vida, à mão
> de qualquer inimigo.

**A última muralha.** Com o Nexus em **1**, a onda só passa se **não houver herói
inimigo defendendo** — a 1 hexágono do Nexus. Base abandonada cai sozinha; base
defendida exige matar quem está lá.

> **Dinâmica — por que o creep não fecha.** Medido na v22, em 1500 partidas:
> **97,3% terminavam com a onda dando o golpe final.** Quem derrubava a rota
> depois só assistia — três rodadas de contagem regressiva em que nenhuma escolha
> mudava nada. A regra devolve a última luta ao fim de partida, e dá função ao
> **Aríete** do Barão (o golpe de herói em torre vale o dobro).
>
> Ela é condicional de propósito. Um piso duro (a onda para em 1, sempre) foi
> testado e morreu na medição: sem ninguém obrigado a ir fechar, **1200 partidas
> não terminaram nenhuma**.

**Torre exposta:** numa rota, só a **torre mais avançada ainda de pé** aceita
golpe. Enquanto ela vive, a de trás está protegida.

**Revide:** a torre devolve **4 de dano** a cada golpe, e o revide nunca mata.
**Não há limite de golpes por rodada** — o teto é dado na mesa e herói que ainda
não agiu. O que mede quanto você quer a torre é o pedágio, não uma trava.

---

## 10 · As ondas

Cada rota tem uma **Frente de Onda**. No fim de cada rodada, para cada rota:

- O time com **mais heróis presentes** empurra a frente 1 casa a seu favor
- Empate não move nada
- A onda **não passa por uma torre viva**
- Se a frente encosta numa torre, a torre perde **7 de vida** (um degrau de onda)

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

### Efeito com prazo — sangramento e veneno

Algumas habilidades de **controle** (dado 3+) e algumas Ultimates deixam um efeito
que continua trabalhando depois do turno.

| | |
|---|---|
| Quando cobra | no **início do turno de quem está marcado**, uma vez por rodada |
| Quanto | o número da habilidade, fixo — não escala com o dado |
| Passa por | **ignora armadura e escudo**. É o golpe que já chegou, cobrando depois |
| Reaplicar | **renova o prazo e fica com o maior dano**. Nunca empilha um segundo |
| Morte | limpa tudo — o respawn devolve o herói inteiro |

**Nunca na habilidade básica.** Efeito com prazo custa dado médio ou alto, e é por
isso que pode ser forte: ele é escolha, não passiva de todo golpe.

Quem aplicou leva o **ouro da morte**, mesmo que já tenha morrido desde então.

### Zona — controle de área

A zona é o mesmo efeito posto no **chão**. Quem **começa o turno dentro** dela
recebe o efeito.

| | |
|---|---|
| Prazo | os **2 próximos turnos do adversário** — contado em turnos, **nunca em rodadas** |
| Raio | 1 (a casa e as seis vizinhas) |
| A sua zona | **não** machuca você |
| No mapa | a sua em verde tracejado, a do adversário em vermelho pulsante |

O prazo é medido em turnos do adversário porque a zona cobra no início do turno de
quem está dentro: em rodadas, a zona de quem joga **primeiro** vigiaria dois turnos
adversários e a do segundo apenas um. É o mesmo erro que a v20 corrigiu nas ondas.

### Cura de base

Herói ferido na **própria base** recupera **3 de vida por rodada**. Voltar custa
movimento — é esse o preço.

**Com inimigo a 2 casas ou menos, ele se trata UMA vez e para.** A cura só volta
quando o cerco sair de perto. É o que impede a base de virar poço de vida infinito
e mantém o mergulho como decisão.

Quem está **SEM CURA** não é tratado pela base.

### O poço — Dragão e Barão

O poço é **sem dono**: qualquer um bate, e **quem dá o último golpe leva o prêmio
inteiro**.

**Os dois moradores contam coisas diferentes, de propósito.**

| Morador | Desce | Vida | Armadura | Como apanha | Revide | Prêmio |
|---|---|---|---|---|---|---|
| **Dragão** | rodada 5 | **3** | — | **conta GOLPES**: básica 1, Ultimate 2, respingo 1. O dado não entra | 2 | **+1 de Poder** no time, permanente e acumulativo |
| **Barão** | rodada 12 | **16** | **3** | **conta DANO**, pela regra dos heróis: `Força + Poder − Armadura`, respingo pela metade, `danoFixo` ignora a armadura | 4 | Escolha **1 de 3 dádivas**, por 2 rodadas |

**Por que os dois não são iguais.** Contar golpes achata o dado: contra o Dragão o
1 e o 6 de uma básica valem o mesmo. Isso é aceitável num alvo de 3 que cai em dois
dados, na rodada 5, quando ninguém tem item. Num alvo grande, achatar apagaria a
decisão inteira — por isso o Barão premia o dado que você comprometeu nele, e as
três Ultimates de dano garantido ganham no poço o mesmo papel que já têm contra
tanque.

**O que faz o Barão exigir um grupo é a ARMADURA, não a vida.** Ele tem **16**, que
é menos que a vida de qualquer um dos 20 heróis — o objetivo não é o saco de pancada
mais gordo da mesa. Mas com **3 de armadura** e Poder 3, uma básica de dado 2 tira
**2** e uma Ultimate de dado 6 tira **8**: quatro vezes mais. Cutucar com dado ruim
quase não anda, e fechar num turno pede **4 dos 5 heróis**.

O Dragão cai em **dois dados** — uma Ultimate (2) e uma básica (1) — e nunca em
um só. É o preço que o faz caber na janela curta dele sem virar farm: com 4 de
vida ele exigia duas Ultimates no mesmo poço e morria em 21,5% das partidas em
que aparecia. O Barão continua em 4, e com o dobro de pedágio: o Dragão se
acumula, o Barão se conquista.

Na rodada 12 o **Barão toma o poço mesmo com o Dragão vivo** — o que dá ao Dragão
um prazo de validade.

**As três dádivas do Barão:**

- **Ondas de Ferro** — as suas três ondas avançam sozinhas, mesmo sem herói nas rotas
- **Égide do Barão** — todos os seus heróis ganham 4 de escudo no início de cada turno seu
- **Aríete** — o seu golpe de herói em **torre vale o dobro**; no Nexus causa 2 em vez de 1

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
| **Matar um herói** | **8** |
| **Acampamento próprio** | **6** |
| **Acampamento neutro** (o do meio) | **8** |
| **Invadir o acampamento do adversário** | **+2** sobre o valor dele |
| Região **Baixo**, na rotação do Caçador | 6 |
| Torre, Nexus, Dragão e Barão | **nada** — os objetivos pagam em mapa, não em ouro |

**22 itens, em três faixas de investimento.** Cada herói carrega **3** — ou 4,
com a carta Relicário. Só compra quem está **na própria base ou morto**.

| Faixa | Preço | O que é |
|---|---|---|
| **Simples** | **12** | um atributo, efeito pequeno |
| **Intermediário** | **18** | dois atributos, ou um efeito de verdade |
| **Forte** | **24** | o item que define a build |

**Vender** devolve **60%** do preço (arredondado para baixo, mínimo 1), na mesma
janela da compra.

> **Dinâmica — o preço é o relógio da progressão.** Medido em `sim/ouro.js`: com
> o catálogo antigo (4 a 9 de ouro) o herói mediano cruzava o preço do **primeiro
> item na rodada 4**, do **segundo na 6** e fechava **os três slots na rodada 8**
> — de uma partida que dura ~34. O build inteiro acontecia no primeiro quarto do
> jogo, e o resto da partida era ouro sem destino.
>
> Com as três faixas: **1º item na rodada 7, 2º na 14, três slots na 20**. E as
> recompensas de EVENTO subiram junto (abate, acampamento, invasão) enquanto a
> gota por rodada ficou parada — sem isso, subir o preço cobraria **paciência**
> em vez de jogo.

### Gastar o ouro que sobra

| Gasto | Preço | O que faz |
|---|---|---|
| **Reforço** | 10, **+4 por compra** | +1 de Poder permanente neste herói |
| **Requisição** | 5 | Compra 1 carta do baralho |
| **Leva de Ferro** | 4, **+1 a cada 3 rodadas** (teto 12) | A sua onda de uma rota avança 1 casa |
| **Sentinela** | 4, **+2 por compra** | 1 ward na mochila (máximo 2) |

A **Sentinela** não vira ward na hora: vira **carga**. Plantar é de graça — nem
dado, nem movimento — pelo botão `◉ plantar ward`, que aparece no painel quando o
herói selecionado tem carga. A ward nasce **na casa onde ele está**, com o raio 3
e as 3 rodadas de sempre.

> **Dinâmica — três curvas de preço.** Reforço e Sentinela encarecem conforme
> *você* compra, e por isso nunca viram renda infinita. Leva de Ferro encarece
> conforme a *partida* anda, porque compra território — cedo, empurrar uma rota é
> barato e rende pouco; tarde, é caro e pode fechar a partida. E a Sentinela
> compra a terceira coisa que o ouro tardio pode querer: **informação**, que só
> passou a ter preço quando o mato virou terreno de verdade (§8).

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
- **Retorno** — volta à base e recupera 5 de vida. Interrompido se houver inimigo colado

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

### Como a IA drafta

Nota ponderada, e **sorteio dentro do grupo dos melhores** — nunca o maior score
absoluto, e nunca sorteio puro:

| Parcela | O que ela lê |
|---|---|
| **Chassi** | vida, Poder, Armadura, alcance, ágil e movimento máximo |
| **Ameaça do kit** | lida das habilidades: atordoamento, silêncio, invisibilidade, execução, revive, perfurante, prende, zona, cura grande, área |
| **Composição** | a terceira peça da mesma classe pesa; time sem linha de frente valoriza quem segura; time sem alcance valoriza quem atira |
| **Matchup** | **devolve 0 hoje** — a rede de anti-picks está em `docs/MATCHUPS.md`, esperando aprovação do grupo |

O tamanho do grupo é personalidade de nível: o **Aprendiz** sorteia liso entre
quatro, o **Veterano** e o **Mestre** entre três, e o Mestre pende forte para os
dois primeiros. **No ban o grupo é três maior**, porque o pool é o catálogo
inteiro em vez dos quatro de uma rota.

> Medido em `sim/draft.js`, 200 drafts com a IA dos dois lados: **20/20 heróis**
> apareceram em algum time, **199 composições distintas**, e o herói mais
> escolhido ficou em **39%** dos slots da rota dele.

---

## 16 · As dinâmicas

As regras dizem o que é permitido. Esta seção diz **onde estão as decisões**.

**Três dados, cinco heróis.** A tensão de base. Todo turno dois heróis ficam sem
agir — e ganham 3 de ouro por isso. A pergunta nunca é "o que faço?", é **"quais
três?"**. E o herói que você deixa de fora hoje é o que estará mais rico amanhã.

**O Dado Mestre é um bolso comum.** Movimento é do time, não do herói. Aproximar
o assassino custa literalmente o recuo do atirador.

**Informação custa uma peça — ou uma ward.** O mato só se enxerga de dentro.
Mandar um herói vigiar é tirá-lo da rota; comprar a Sentinela é ouro que não
virou Poder; não fazer nem um nem outro é jogar sem saber de onde vem o próximo
golpe. E quem se esconde paga também: o primeiro golpe entrega a casa.

**Torre ou objetivo.** O revide de 2 torna a torre uma **conta**: bater três vezes
custa 6 de vida ao time. Quando o poço abre, a mesma ação que derrubaria uma
torre pode fechar um Dragão. O jogo não diz qual escolher — só garante que você
não tem dado para as duas.

**A Ultimate é um pico, não um botão.** Rende 1,25× o dado, mas exige 5 ou 6.
Guardar o dado alto para ela é abrir mão de três ações pequenas. E ela vale 2 no
poço contra 1 da básica: às vezes o melhor uso da Ultimate não é num herói.

**Quem está atrás recebe dado, não perdão.** A Retomada dá **ação**, que é o que
falta a quem está apanhando, e some quando a diferença fecha. O Barão dá
território, não dano. As duas existem para que a virada seja **possível**, não
automática.

**O relógio da partida.** Rodada 5 o Dragão desce. Rodada 12 o Barão toma o poço.
A partida mediana dura 22 rodadas. Cedo você desenvolve, no meio briga pelo
Dragão, e depois da 12 tudo é sobre fechar.
