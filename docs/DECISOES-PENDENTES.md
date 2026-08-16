# DECISÕES PENDENTES — o que foi medido e não decidido

> Este arquivo existe porque a revisão da v15 pediu explicitamente para separar
> **bug confirmado** (corrigir) de **ideia para discussão** (não implementar sem
> aprovação). Tudo que está aqui é da segunda categoria: o motor está preparado,
> os números estão medidos, e a regra é escolha de Vilker, Vinicius e Matheus.
>
> Cada item traz: o que foi medido, quais são as opções, e o que muda no código
> quando a decisão sair. Nada aqui está implementado.

---

## 1. ~~Vantagem de quem começa~~ — CORRIGIDO na v20, com 1,4 ponto de sobra

| Build | Vitórias de quem começa | n |
|---|---|---|
| v15 (iniciativa alternando) | 50,5% | 200 |
| v16 (alternância limpa) | 45,6% | 3000 |
| v19 (com névoa) | 42,0% | 1500 |
| **v20** | **48,6%** | **6000** |

A causa não era falta de bônus: era **assimetria de informação**. A onda avançava
comparando presença de rota no fim da RODADA, depois de o segundo jogador já ter
se posicionado. Congelar a presença de cada time no fim do próprio turno levou
42,0% → 46,8%; o **Primeiro Passo** (+1 de movimento na rodada 1 para quem
começa) fechou o resto.

**O que sobra:** 1,4 ponto. Cada execução individual cai dentro do ruído
(|z| < 2), mas as três somadas ainda pendem para o segundo jogador. Pode ser
aceitável — a maioria dos jogos assimétricos convive com isso. **Decisão do
grupo:** parar aqui, ou tentar fechar o último ponto e meio depois do playtest
humano, que é onde o desequilíbrio realmente se sente.

**Aviso de método:** esta métrica precisa de **n ≥ 2000** por execução, rodada
duas ou três vezes. Já fui enganado duas vezes — por n=250 (deu 50% quando o real
era 43%) e por um harness que deixava a IA rodar só na primeira partida da
bateria, fazendo o mesmo build render 47,6% e 50,4%.

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

## 3. ~~Bônus defensivo ao lado da torre~~ — APROVADO e IMPLEMENTADO na v22

Entrou como proposto: **+1 de Armadura** para herói a distância ≤ 1 de torre
**viva do próprio time**. Torre inimiga não protege quem mergulha; o bônus cai
com a torre.

**O revide continuou em 2.** A preocupação registrada aqui era o empilhamento
(revide 2 + armadura 1 tornando o cerco irracional), e a medição não a confirmou:
`armtorre=0` deu 51,8% de vitória para quem começa contra 52,6% do build
completo, e o ritmo não mudou — **4,5 de 12 torres por partida**, mediana de 21
rodadas, com e sem o bônus. Reduzir o revide junto teria sido mexer em dois
números de uma vez sem que o segundo tivesse motivo.

**O que ficou para o playtest humano:** a bateria é cega para agência, e "vale a
pena mergulhar nesta torre?" é decisão de jogador. Se na mesa o cerco começar a
parecer irracional, o ajuste continua sendo o revide 2 → 1 — uma linha, e a
medição antes/depois já está montada (`armtorre=`).

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

## 5. ~~Gasto de ouro no fim da partida~~ — FECHADO na v22, com quatro gastos

| Gasto | Preço | O que faz | Entrou em |
|---|---|---|---|
| **Reforço** | 6, **+2 por compra** | +1 de Poder permanente | v18 |
| **Requisição** | 5 | compra 1 carta do baralho | v18 |
| **Leva de Ferro** | 4, **+1 a cada 3 rodadas** (teto 12) | a sua onda avança 1 casa | v20 |
| **Sentinela** | 4, **+2 por compra** (máx. 2 na mochila) | 1 ward na mochila, plantada de graça | v22 |

A revisão da v21 listou cinco candidatos (ward, consumível, carta, creep,
re-rolagem) e pediu **uma ou duas opções, não cinco**. Com três já na prateleira,
entrou **uma**: a ward.

**Por que a ward e não o consumível.** A ward é a única das cinco que ficou
*melhor* com a regra do mato da v22 — agora que só se enxerga o mato de dentro,
informação passou a ter preço. E ela não abre submenu: a compra vira carga, a
carga vira ward num botão só. O consumível de cura, o candidato mais próximo,
é redundante: quem compra está na base ou morto, e os dois estados já curam.

**Continua em aberto (e é o lado que nunca foi mexido):** a **renda nunca para**
— 3 de ouro por herói por rodada só de não agir. Quatro gastos não resolvem uma
torneira aberta. Se depois do playtest ainda sobrar montanha de ouro, o ajuste é
na **renda**, não num quinto gasto.

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

**Atualização v21 e v22 — e a lição acima estava errada pela metade.**

Na v19 a conclusão registrada aqui era que raio por unidade "provavelmente não é
necessário". O Vinicius pediu o contrário na v21 (*"no moba a visão do tabuleiro
é feito de acordo se há heróis, creeps, torres ou wards do seu time dando
visão"*), e ele estava certo: **presença por região é grosseira demais** — ou o
mato inteiro acende, ou nada.

Mas a v21, só com raio, foi longe demais para o outro lado: **78 dos 116**
hexágonos visíveis na rodada 1, os acampamentos acesos, o Caçador invisível na
regra e à vista na tela. Foi o relato da v22: *"continuo vendo os adversários no
mato mesmo sem ter visão."*

O acerto é **as duas coisas juntas**, e é o que está no jogo desde a v22: raio por
fonte para o mapa aberto, e o **mato bloqueando** — só se enxerga de dentro. Mais
a contrapartida: **quem ataca fica revelado** até sair da casa de onde bateu.

**Lição de verdade:** presença sozinha é grossa, raio sozinho vaza. O que faz a
névoa virar decisão é o terreno participar dela.

---

## 12. O `+1` do destino "poço" NÃO era a causa do drift do Barão (v38)

O handoff da sessão v23→v37 registrava o Barão em **59,1%** de fechamento, notava
que ele tinha subido depois da Rotação do Caçador e recomendava, se o Barão
caísse fácil demais no playtest, **mexer no `+1` do destino "poço"** em vez de na
vida dele.

A v38 removeu os destinos com bônus por completo, e com eles o `+1`. Medido em
`sim/epicos.js 2500`:

| | v37 | v38 (sem o `+1`) |
|---|---|---|
| Barão fechado | 59,1% | **58,4%** (n=1425) |

**0,7 ponto — dentro do ruído.** A alavanca que o handoff recomendava foi puxada
até o fim e o número não se mexeu.

Fica em aberto, portanto, a pergunta que o handoff julgava respondida: **o que
levou o Barão de ~54,6% (v23) a ~59% não foi o destino "poço".** Candidatos que
mudaram no mesmo intervalo e nunca foram isolados: a vida 16 / armadura 3 da v26
(que o fez apanhar como herói), o teto de escudo 12 e a Égide 7→4 da mesma
versão, e a janela de escolha de alvo da v27.

**Como medir:** uma variante de cada vez, sempre com `times=espelho`.
`sim/epicos.js` aceita `baraodano=`, `baraoarm=` e `baraogolpe=on`.

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

**Atualização v23 — o Barão deixou de ser o problema; o Dragão é.**

| | v22 | v23 |
|---|---|---|
| Barão morto (das partidas em que aparece) | 49,9% | **54,6%** |
| Vitória de quem leva o Barão | 48,8% | **52,3%** |
| Dragão morto | 20,7% | 21,9% |

O Barão melhorou nos três números ao mesmo tempo, e sem ninguém mexer no preço
dele: foi a **última muralha** (o último ponto do Nexus só sai por golpe de
herói) que deu função ao **Aríete**, e com isso a dádiva passou a valer o custo.
Levar o Barão agora correlaciona com vencer.

**O que sobra é o Dragão.** `sim/epicos.js` segue imprimindo *"muito tentado e
pouco fechado — CARO DEMAIS"*: 63% das partidas tentam, 22% fecham. Não foi
mexido na v23 de propósito — já entraram três regras no mesmo lote, e mudar o
preço do Dragão junto tornaria impossível dizer de quem é qualquer efeito medido
depois. Fica como o **próximo número a testar sozinho**: vida 4 → 3, ou o revide
dele, uma coisa de cada vez (`vdragao=` e `revide=off` já existem na bateria).

**Fechado na v24 — era a vida, e o revide não era nada.** Testado sozinho, como
o item pedia. As duas alavancas foram medidas separadas, n=1500 cada:

| Variante | Dragão morto |
|---|---|
| build v23 | 21,5% |
| `revide=off` | **21,7%** |
| `rdragao=0` | 23,4% |
| **`vdragao=3`** (o que entrou) | **33,1%** |
| `barao=14` | 34,5%, mas o Barão some de 7% das partidas |

**O revide foi descartado por medição:** zerá-lo devolve 0,2 ponto. Quem desiste
do Dragão desiste **por dado gasto, não por vida perdida** — o custo que pesa é o
turno que o herói não passou empurrando rota, e nenhum ajuste de pedágio alcança
isso. Fica registrado porque a intuição contrária é forte e vai voltar.

A vida foi para **3**: o Dragão cai em Ultimate + básica, dois dados, e continua
sem cair numa Ultimate só. Fecha em 32,3% **sendo menos atacado que antes** (1,3
golpes por partida contra 1,4) — converte, não vira farm. A vantagem de quem
começa não se moveu (A/B de n=6000 por braço: 51,9% com vida 4, 51,2% com vida 3,
z=0,75). Detalhes na v24 dos patch notes.

---

## 10. A renda de ouro nunca para — MEDIDO na v25, e não decidido

Medido em 600 partidas com `sim/ouro.js`:

| | |
|---|---|
| Ouro que um herói acumula na partida | **61** |
| Build completo de 3 itens, o mais caro | **25** |
| A loja inteira (22 itens) | 142 |
| Sobra por herói | **36** |

**A renda paga o build 2,4×.** A v25 encareceu o Reforço (6+2 → 10+4) porque com a
curva antiga a sobra comprava quatro deles, ou +4 de Poder permanente — mais que
qualquer item, sem ocupar slot e sem teto. Isso resolveu o Reforço; **não resolve a
torneira.**

Aviso que vem desde a v22 e agora tem número: **mexer no preço de um gasto não
fecha uma torneira aberta.** Se ainda sobrar montanha de ouro no playtest, o ajuste
é na renda.

As três alavancas já existem em `sim/ouro.js` e não foram tocadas:

- **`farma=N`** — hoje 3 por rodada para quem não recebe dado. É o grosso da renda:
  com 3 dados para 5 heróis, dois heróis sempre farmam.
- **`agiu=N`** — hoje 1 por rodada para quem age.
- **`matar=N`** — hoje 4 por abate.

**Recomendo `farma=2` como o primeiro a testar** (derruba a renda ~1/3 sem tocar em
quem joga), e **sempre com `times=espelho`**, porque ouro muda o quanto cada lado
compra e o confronto fixo da bateria contamina a leitura. **Decisão do grupo:** a
renda é generosa de propósito (deixa todo mundo vestir o build que quer) ou está
gerando ouro sem destino?

---

## 11. "Quem começa" tem dois números, e o histórico era o do confronto

Achado na v25, e ele recalibra o item 1 deste arquivo.

`sim/bateria.js` sempre rodou **um confronto fixo e assimétrico** — dez dos vinte
heróis, repartidos entre os lados. Toda a série histórica de "quem começa"
(42,0% → 46,8% → 48,6% → 51,1% → 51,2%) foi medida assim.

Com **`times=espelho`** (os mesmos cinco heróis dos dois lados), que é o único
arranjo em que a única diferença entre os jogadores é a ordem:

| Arranjo | quem começa | n |
|---|---|---|
| confronto fixo (histórico) | ~51,2% | 6000 |
| **espelhado** | **~52,9%** | 9000 |

Os dois números estão certos e medem coisas diferentes. O espelhado mede **ordem**;
o fixo mede **ordem + aquele confronto**, e a composição de um lado vinha
compensando parte da vantagem de quem começa.

**O que isso muda para o item 1:** a vantagem de ordem "residual" pode ser ~1,9
ponto maior do que o registrado. **Não corrigi nada por causa disso** — mudar a
compensação de ordem com base numa métrica que acabou de trocar de definição seria
repetir o erro que este arquivo existe para evitar. **Decisão do grupo:** adotar o
espelho como métrica oficial de ordem (e reavaliar o Primeiro Passo contra ela), ou
manter o confronto fixo como referência histórica.

Seja qual for, a regra prática já vale e está em `ESTADO.md`: **mudança que toca
herói, habilidade ou item mede-se com `times=espelho`.**

---

## 8. Itens que mudam comportamento (PARTE 17.3)

Não implementado — é ideia futura, e concordo com a priorização do relatório.

Registro só o achado técnico: o motor **já suporta** quase tudo que a seção pede.
`bonus(h,campo)` soma qualquer campo de item, e há ganchos naturais em
`aplicaDano` (depois de sofrer dano), `moveAte` (ao andar) e `expiraDoTime`
(primeiro golpe da rodada). Um item do tipo "primeiro ataque da rodada causa +1"
custa um contador por herói e três linhas. Quando o grupo quiser, é barato.

---

## 9. Acampamento e torre aparecem através da névoa (achado na v22)

Não corrigido — é decisão de design, não bug.

Com a névoa da v22 o mapa esconde heróis, mas **continua desenhando estruturas e
acampamentos em casa escura**: o losango da torre com a vida escrita, e o
marcador do acampamento com `ATIVO` ou `R3` de respawn.

Onde eles ficam **não** é informação escondida — todo mundo sabe onde é a torre e
onde é o acampamento, como em qualquer MOBA. O que vaza é o **estado**: a vida
exata da torre inimiga e se o acampamento já foi farmado.

Opções: **(a)** deixar como está — legibilidade acima de simulação, e ninguém
reclamou; **(b)** esconder só o número (torre e acampamento aparecem como
silhueta, sem vida nem contador, enquanto a casa estiver escura). A (b) custa
duas condições em `desenhaMapa` e nenhuma regra nova.

Sugiro **(b)** se o grupo achar que farm de acampamento inimigo deve ser aposta,
e **(a)** se o mapa já estiver pesado de ler no celular.
