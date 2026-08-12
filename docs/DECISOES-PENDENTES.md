# DECISÕES PENDENTES — o que foi medido e não decidido

> Este arquivo existe porque a revisão da v15 pediu explicitamente para separar
> **bug confirmado** (corrigir) de **ideia para discussão** (não implementar sem
> aprovação). Tudo que está aqui é da segunda categoria: o motor está preparado,
> os números estão medidos, e a regra é escolha de Vilker, Vinicius e Matheus.
>
> Cada item traz: o que foi medido, quais são as opções, e o que muda no código
> quando a decisão sair. Nada aqui está implementado.

---

## 1. Vantagem de quem começa — **o sinal inverteu**

**Isto muda a pergunta da PARTE 3 do relatório.**

A revisão parte de "ser o primeiro jogador oferece vantagem" e pede uma
compensação pequena para o **segundo**. Depois da correção da alternância de
turnos, isso deixou de ser verdade.

| Build | Ordem real | Vitórias de quem começa | n |
|---|---|---|---|
| v15 (iniciativa alternando) | A C \| C A \| A C | 50,5% (z=0,14) | 200 |
| v16 (alternância limpa) | A → C → A → C | 45,6% (z=−4,78) | 3000 |
| **v19 (com névoa no mato)** | A → C → A → C | **42,0% (z=−6,2)** | **1500** |

**A névoa não corrigiu.** Uma medição de n=250 na v19 deu 50,0% e parecia ter
neutralizado o problema; era ruído. Com 1500 partidas o desequilíbrio continua, e
um pouco pior. **Meça sempre com n ≥ 1500** — abaixo disso o ruído desta métrica
chega a inverter o sinal.

Quem começa **perde 8 pontos** na medição mais recente. O resultado é forte
(z=−6,2), não ruído — e é o único item desta lista que **piorou** entre versões.

**Por que provavelmente** — hipótese, não medição: o segundo jogador sempre tem
a última palavra da rodada. `fimDaRodada` roda imediatamente depois do turno
dele, e é lá que a onda avança, que a renda é paga (`agiu ? 1 : 3`) e que Placas
e Prioridade olham quem domina cada rota. O posicionamento que esses três
cheques enxergam é sempre o mais recente do segundo jogador.

**Ressalva importante:** o agente da bateria joga quase ao acaso. Ele mede bem
estrutura (mapa, torre, onda, ordem) e é cego para agência (item, carta,
Prioridade, épico). Esta medição é de estrutura, então vale — mas o tamanho
exato do desequilíbrio na mão de gente que joga bem só sai em playtest humano.

**Decisão a tomar:** se compensar, compensar **quem começa**, não quem joga em
segundo. Opções, da mais simples para a mais invasiva:

- **a)** não compensar — 42% pode ser aceitável, e quem escolhe começar passa
  a ser uma decisão de draft em vez de um presente;
- **b)** trocar a ordem: quem **não** escolheu o lado começa;
- **c)** dar ao primeiro jogador +1 de movimento na rodada 1 apenas;
- **d)** voltar a alternar a iniciativa — desfaz a correção de leitura da PARTE 2.

`sim/bateria.js` já aceita `comp=N` (ouro extra por herói). Hoje ele beneficia o
**segundo**; medir a opção certa exige inverter o alvo dessa variante — uma
linha.

---

## 2. ~~Três Ultimates piores que a própria básica~~ — RESOLVIDO na v19

Ficava aqui a recomendação de fazer `danoFixo` **ignorar armadura**. Foi o que
entrou, junto com os números: Julgamento 8 → 11, Ato Final 7 → 10, Sentença
6 → 10.

Medido depois, com dado 6, contra alvo de 0 e de 3 de armadura: **zero** dos 16
heróis com dano tem básica alcançando a própria Ultimate. Contra 3 de armadura a
Ultimate da Solenne faz 11 contra 6 da básica — que era exatamente o papel que
faltava a ela.

---

## 3. Bônus defensivo ao lado da torre (PARTE 4)

Não implementado — é ideia para discussão, e tem um efeito colateral que precisa
ser decidido antes.

A proposta (+1 de armadura para herói adjacente à torre aliada) é simples e
barata de implementar (`armTotal` já soma bônus). O problema é interação com
outra regra: a torre **revida 2** em quem a ataca. Somando os dois, atacar uma
torre defendida passa a custar caro o suficiente para que a resposta ótima seja
nunca atacar torre defendida — e aí o cerco vira só esperar a onda, que é
exatamente o turno morto que a v0.6 tinha corrigido.

Se entrar, sugiro entrar **junto** com uma redução do revide (2 → 1) e uma
medição antes/depois. Isso é uma sessão de balanceamento, não um patch.

---

## 4. Cartas de reação não têm janela para serem jogadas

Descoberto durante a correção do Recuo, e **não corrigido** porque a solução é
uma decisão de design, não um bug de código.

Três cartas são `quando:"reacao"` — Recuo, Anteparo, Contra-emboscada — mas:

- `abreMao()` sempre mostra a mão de `J.vez`, ou seja, a do jogador da vez;
- `escolheHeroi()` não deixa selecionar herói fora do seu turno;
- o campo `quando` **não é lido em lugar nenhum** do motor.

Ou seja: as três só podem ser jogadas no seu próprio turno, que é justamente
quando não são reação. Consertei a mecânica do Recuo (ele move de verdade agora),
mas a janela continua inexistente.

Opções:

- **a)** aceitar e reescrever as três como cartas de turno normal — zero código,
  só texto. É a opção "menos regra";
- **b)** criar uma janela real de interrupção: depois de o adversário declarar um
  ataque, o defensor recebe uma chance de responder. Dá profundidade de MOBA e
  custa um passo a mais em todo combate — atenção ao ritmo;
- **c)** cartas de reação viram automáticas: ficam "armadas" e disparam sozinhas
  quando a condição acontece. Mantém a fantasia sem parar o turno.

**Recomendo (c)** se a família for para ficar, **(a)** se o objetivo for enxugar.

---

## 5. ~~Gasto de ouro no fim da partida~~ — IMPLEMENTADO na v18

Dois gastos, os dois só na base:

| Gasto | Preço | O que faz |
|---|---|---|
| **Reforço** | 6, **+2 a cada compra do mesmo herói** | +1 de Poder permanente |
| **Requisição** | 5 | compra 1 carta do baralho |

O preço subindo do Reforço é o que impede o ouro tardio de virar renda infinita:
cada ponto custa mais que o anterior. A Requisição foi a recomendação original —
transforma ouro em **opção** em vez de estatística, e reaproveita o Deck de
Comando em vez de inventar sistema novo. A IA usa os dois ao fechar o inventário.

**Ainda em aberto:** o problema tem dois lados e só mexi num. A **renda nunca
para** (3 de ouro por herói por rodada só de não agir), então o ouro volta a
sobrar mesmo com onde gastar. Se depois de jogar ainda sobrar montanha de ouro,
o ajuste é na renda, não em mais gastos.

---

## 6. ~~Jungle e visão~~ — IMPLEMENTADO na v19, e a proposta daqui foi DESCARTADA

Registro do erro, porque ele custou uma versão inteira.

Este item propunha uma **rotação**: o Caçador gastaria uma ação, **sairia do
tabuleiro**, escolheria uma de quatro entradas de selva e reapareceria lá no
turno seguinte. Foi implementado na v18 — e estava errado. A correção veio do
Vinicius: *"o que eu tinha pensado é que ele iria para a região escolhida, porém
seu oponente só poderia vê-lo no mato se tiver alguém no mato"*.

A diferença é a coisa toda. Na minha versão a peça **deixava de existir**; na
certa ela **continua em algum lugar real** e o que muda é quem enxerga. A
segunda não precisa de entradas fixas, não precisa de temporizador, não tem o
problema do teleporte — e é uma regra em vez de três.

O que entrou na v19: **rota, rio e base todo mundo vê; o mato você só enxerga se
tiver alguém dentro.** Duas regiões, enxergadas em separado. Ward acende as
duas. Emboscada (+2 de Força) para quem ataca do mato sem ter sido visto. A IA
obedece à mesma névoa.

**Lição:** os raios de visão por unidade que este item propunha (herói 3, creep
2, torre 3, ward 3) nunca foram testados e provavelmente não são necessários. A
visão por **presença na região** custa uma peça em vez de um número, e num mapa
11×11 é a que gera decisão.

---

## 7. Dragão e Barão — RESPONDIDO, e o preço estava errado

O item dizia que a bateria não conseguia responder se os épicos criavam dilema.
Agora consegue, e a resposta foi útil.

Quando a IA ganhou avaliação (v17), ela **parou de bater no poço**. Fui checar e
ela estava certa: a 1–2 de dano por ação e 3 dados por turno, o Dragão custava
**~2,7 turnos do time inteiro** e o Barão **~4,7** — contra uma torre que custa 3
golpes e leva direto à vitória. Não havia dilema nenhum; contestar era
matematicamente um mau negócio.

Corrigido na v18: **Dragão 8 → 4, Barão 14 → 6**. Medido em 1500 partidas:
**0,66 Dragões por partida** contra 0,01 antes, e golpes de herói no poço de 0,1
para 2,8.

**Ainda em aberto:** o Barão continua raro (0,05 por partida). Ele desce só a
partir da rodada 8 e custa 3 Ultimates; pode ser que a janela seja curta demais,
ou que 6 de vida ainda seja caro para o que ele entrega (2 rodadas de Fúria).
Precisa de playtest humano antes de mexer de novo.

---

## 8. Itens que mudam comportamento (PARTE 17.3)

Não implementado — é ideia futura, e concordo com a priorização do relatório.

Registro só o achado técnico: o motor **já suporta** quase tudo que a seção pede.
`bonus(h,campo)` soma qualquer campo de item, e há ganchos naturais em
`aplicaDano` (depois de sofrer dano), `moveAte` (ao andar) e `expiraDoTime`
(primeiro golpe da rodada). Um item do tipo "primeiro ataque da rodada causa +1"
custa um contador por herói e três linhas. Quando o grupo quiser, é barato.
