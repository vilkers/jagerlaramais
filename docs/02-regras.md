# JAGERLARAMAIS — regras completas

Versão 0.2 · para quem nunca jogou. Leia na ordem.

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

### A ponte entre os dois

Precisa de mais mobilidade numa rodada específica? **Você pode virar um dado de ação em movimento** — ele soma seu valor ao total de casas. Você troca uma jogada por posição.

---

## A OUTRA REGRA QUE DECIDE TUDO

> **Você tem 3 dados de ação e 5 heróis.**
> **O herói que NÃO recebe dado FARMA — e ganha mais ouro do que quem age.**

| Situação | Ouro no fim da rodada |
|---|---|
| Herói recebeu dado (agiu) | **1** |
| Herói não recebeu dado (**farmou**) | **3** |
| Herói morto | **0** |

Agir custa dinheiro. Toda rodada você decide: intervir agora, ou ficar rico e intervir melhor depois. Isso é a tensão econômica do MOBA inteiro em uma linha de regra.

---

## A RODADA, PASSO A PASSO

### 1 · Comando Oculto
Os dois jogadores, **ao mesmo tempo e em segredo**, escolhem para onde o próprio **Caçador** (o herói da selva) vai: rota de cima, meio, baixo, ou ficar na selva. A escolha fica virada para baixo.

### 2 · Turno do primeiro jogador
Rola 3d6. Aloca. Age. Encerra.
**No fim deste turno, a carta do Caçador do OUTRO jogador é revelada** e resolve.

### 3 · Turno do segundo jogador
Mesma coisa.
**No fim deste turno, a carta do Caçador do PRIMEIRO jogador é revelada** e resolve.

> Por que assim: você esconde o Caçador antes de saber o que o adversário vai fazer, e ele só aparece depois que o adversário já se comprometeu. É o blefe do gank, inteiro, em uma carta virada.

### 4 · Ondas
Em cada rota, a **Frente de Onda** desliza 1 casa para o lado de quem tem mais heróis vivos naquela rota. Empate: não anda.

### 5 · Renda
Cada herói ganha ouro pela tabela acima. Placas e Prioridade são apuradas.

### 6 · Respawn
Timers de morte descem 1. Quem chega a zero volta à base.

---

## COMO SE MOVE

Cada herói começa na entrada da própria rota. Mover 1 casa custa 1 ponto do **Dado Mestre**, que é comum ao time.

- Você pode andar por **qualquer terreno** — rota, selva, rio.
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

**Morte:** vida em 0 o herói sai do mapa e volta à base depois de **2 rodadas** (3 se estava com o dobro de ouro do adversário — quem está na frente demora mais para voltar). Quem matou ganha **4 de ouro**.

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
| 3 Placas | **Teleporte** — o Topo aparece em qualquer casa do mapa, imediatamente |

O Topo é a única fonte de controle sobre a sorte que você mesmo constrói. Ganhar de lado no topo é o que faz seu meio conseguir a ultimate na hora certa.

### 🌑 SELVA — "O Caçador"
O único herói cuja ação é **decidida em segredo**.

Toda rodada você escolhe uma de quatro zonas com a carta virada:
- **Selva** → ganha 3 de ouro e um buff de acampamento
- **Uma rota** → **gank**: aparece lá e ataca com **+2 de Força**

A carta revela no fim do turno do adversário. Ele já se comprometeu quando você aparece.

**O blefe é metade do valor.** Virar a carta no topo e ver o adversário jogar defensivo lá enquanto era só farm já ganha a rota de baixo de graça.

### ⏱️ MEIO — "O Relógio"
A rota do meio é a mais curta do mapa. Quem domina ela chega primeiro em qualquer lugar.

**Prioridade.** No fim da rodada, se o seu Meio estiver mais avançado que o Meio inimigo, você ganha **1 Prioridade** (acumula até 2).

> **Gastar 1 Prioridade = rolar um dado de ação a mais**, na hora que você quiser dentro do seu turno.

Ou seja: dominar o meio te dá **uma jogada a mais que o adversário**. E como você decide *quando* gastar, dá pra segurar até ver que os três dados vieram ruins — e aí puxar mais um.

O Meio não é o mais forte. Ele é quem **te dá mais opções**.

> **As duas rotas que mexem nos dados são o Topo e o Meio.** O Topo compra controle sobre a sorte (ajusta e re-rola); o Meio compra quantidade de jogadas. Ganhar de lado nessas duas rotas é o que faz o resto do time funcionar na hora certa.

### 🎯 ATIRADOR — "O Investimento"
Frágil e caro. É o único que fica mais forte com o tempo.

**Patamares:** a cada **10 de ouro** que o Atirador acumular, ele ganha **+2 de Poder**, para sempre. Até 3 vezes.

**Dupla:** enquanto o seu Suporte estiver vivo e a até 2 casas dele, o Atirador ganha **+2 de Poder e +2 de Armadura**.

Isso instala o relógio da partida: um lado joga para fechar antes do Atirador ficar pronto, o outro joga para segurar até lá.

### ♻️ SUPORTE — "A Memória"
Não tem número grande. Tem influência.

- **Escuda** aliados
- **Doa o próprio dado** para outro herói usar
- **Ward** — revela a carta do Caçador inimigo antes dela virar
- **Eco** — reduz o respawn de um aliado em 1 rodada

O Suporte é o único herói cujo poder é medido inteiramente pelo que os outros conseguem fazer.

---

## O MAPA

Três rotas ligam as duas bases. Selva nos dois quadrantes, rio na diagonal.

**Frente de Onda** — cada rota tem um marcador que mostra onde as duas ondas de tropas se encontram. Ele desliza para o lado de quem tem mais heróis vivos naquela rota, 1 casa por rodada.

**Torres** — duas por rota, de cada lado. Cada uma tem **3 de vida**.
A Frente de Onda encostada numa torre causa **1 de dano por rodada**. Heróis também podem atacá-la.

**Nexus** — quando as **duas torres** de uma rota caem, aquela rota fica aberta e a Frente de Onda passa a bater direto no Nexus. O Nexus tem **5 de vida**.

**Zerou o Nexus, acabou o jogo.**

---

## RESUMO EM UMA PÁGINA

1. Escondam a carta do Caçador
2. Role **1 dado de movimento + 3 dados de ação**
3. Gaste o movimento entre os cinco heróis — é um bolo só
4. Aloque os dados de ação: o valor vira a **Força** da habilidade
5. Quem ficou sem dado de ação **farma 3 de ouro**
6. Encerre; a carta do adversário revela
7. Ondas deslizam, ouro entra, mortos contam o tempo
8. Repita até o Nexus cair

---

## O QUE AINDA NÃO ESTÁ DEFINIDO 🔸

Sinalizando o que falta para o jogo ficar completo:

| # | Falta | Por que importa |
|---|---|---|
| 1 | **Loja e itens** | Sem gastar, o ouro é só placar. É o que dá autoria à build |
| 2 | **Draft / pick-ban** | É o que faz 50 partidas serem diferentes com as mesmas cartas |
| 3 | **Feitiços de invocador** | 5 cartas que geram as melhores histórias da partida |
| 4 | **Acampamentos de selva** | Os buffs Azul e Vermelho, que mexem nos dados |
| 5 | **Empate / limite de rodadas** | O que acontece se ninguém fechar? |
| 6 | **Comeback** | Sem freio, quem abre vantagem na rodada 3 já ganhou na 5 |
