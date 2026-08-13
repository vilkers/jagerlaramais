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

## v26 — o Barão apanha como herói, e os escudos deixam de apagar o turno · 2026-08-13

Duas mudanças de regra, **simuladas antes de entrar** — os números foram varridos
com `sim/epicos.js baraodano= baraoarm=` sem tocar em `jogo/jogo.js`, e só depois
aplicados.

### Os dois moradores passam a contar coisas diferentes

| | Dragão | Barão |
|---|---|---|
| Vida | **3** | **16** |
| Armadura | — | **3** |
| Como apanha | **conta GOLPES**: básica 1, Ultimate 2, respingo 1 — o dado não entra | **conta DANO**: `Força + Poder − Armadura`, respingo pela metade, `danoFixo` ignora armadura |
| Revide | 2 | 4 |

**O Dragão não foi tocado.** Continua em Ultimate 2 e básica 1, e há teste
travando isso nos dois sentidos — um exige que a básica tire 1 e a Ultimate 2,
outro exige que o dado **não** mude o que ele leva.

**Por que os dois não são iguais.** Contar golpes achata o dado: contra o Dragão
o 1 e o 6 de uma básica valem o mesmo. Isso é aceitável num alvo de 3 que cai em
dois dados, na rodada 5, quando ninguém tem item e a conta de dano ainda é rasa.
Num alvo grande, achatar apagaria a decisão inteira.

### O que faz o Barão exigir um grupo é a ARMADURA, não a vida

A primeira tentativa deu a ele **22 de vida e 1 de armadura** — perto do herói
mais duro do jogo. Estava resolvendo o problema errado, e o retorno do playtest
foi direto: *"não precisa ter a vida até a do maior herói do jogo, tem que ser
equilibrado para necessitar de um grupo para levá-lo"*.

Com armadura baixa, todo dado contribui proporcionalmente: cinco cutucadas fracas
derrubam o objetivo igual a dois golpes comprometidos. Vida alta vira **barra
comprida**, não exigência de time — é o jeito preguiçoso de fazer um chefe.

**16 de vida e 3 de armadura.** Com Poder 3:

| Golpe | Conta | Tira |
|---|---|---|
| básica, dado 2 | `2 + 3 − 3` | **2** |
| básica, dado 6 | `6 + 3 − 3` | 6 |
| Ultimate, dado 6 | `round(6 × 1,25) + 3 − 3` | **8** |

**Quatro vezes** entre o pior e o melhor golpe. Cutucar com dado ruim quase não
anda, e é isso — e não o tamanho da barra — que obriga a comprometer o dado bom de
vários heróis ao mesmo tempo. Fechar num turno pede **4 dos 5 heróis** (`16 ÷ 4`).

E **16 fica abaixo da vida de todos os 20 heróis** — o mais frágil tem 18. O
objetivo não é mais o saco de pancada mais gordo da mesa. Há teste travando as
duas pontas: o Barão tem menos vida que o herói mais frágil, e a Ultimate tira
pelo menos 3× o que tira a básica de dado baixo.

**Dificuldade preservada**, n=2500 por braço:

| Regra | Barão morto | golpes | duração |
|---|---|---|---|
| golpes, vida 4 (v25) | 52,1% · 53,4% · 56,6% | 3,3–3,5 | 23 |
| **dano, 16/3 (v26)** | **54,7%** | 3,1 | 23 |

Dragão inalterado (34,8%). Ordem no confronto espelhado: **53,3%** (n=9000) contra
52,98% da v25 — 0,3 ponto, ruído.

### Os escudos apagavam o turno

**O relato:** *"achei os valores dos buffs mto fortes"*.

Confere. Heróis têm 18 a 25 de vida, e a Muralha do Vharn dava `Força + 11` — **17
num herói de 25**, ou 68% da vida máxima, de uma habilidade só. Isso não é
"absorve um golpe", é **ignore a rodada**. Foi exatamente o episódio que abriu a
v25: dois ataques no Vharn sem tirar um ponto de vida.

**Teto de 12** — metade da vida do maior herói do jogo, dois terços da do menor:

| Escudo | Era (dado 6) | Ficou | % da vida de quem recebe |
|---|---|---|---|
| **Muralha** (Vharn) | Força + 11 = **17** | Força + 6 = **12** | 68% → **48%** |
| **Vento Contrário** (Vidra) | Força + 9 = 15 | Força + 5 = **11** | 83% → **61%** |
| **Anteparo** (Gorm) | Força + 7 = 13 | Força + 4 = **10** | 52% → **40%** |

Os demais já estavam dentro (Sopro 10, Eco 11, Véu de Névoa 11, Reposicionar 10) e
não foram tocados. A faixa inteira saiu de **10 a 17** para **10 a 12**, e há teste
travando o teto.

### A Égide entregava 7 e a carta prometia 4

Achado ao auditar os buffs, e é o pior tipo de erro de balanceamento: **o jogador
escolhia a dádiva lendo um número e recebia outro.** `const BARAO_ESCUDO=7`, com a
carta dizendo *"Todos os seus heróis ganham 4 de escudo"*.

E 7 não é 4 com folga: por herói, por turno, com cinco heróis e duas rodadas,
somava **70 de escudo** — quase três heróis inteiros de vida, de graça, num jogo
em que o maior tem 25. **Agora entrega 4, como sempre esteve escrito**, e são 40 —
ainda a dádiva que "compra as brigas que você não podia comprar", sem apagar duas
rodadas de combate. Há teste conferindo que o motor entrega o número que a própria
carta promete.

### O degrau que a medição tem, e que é preciso saber

**O agente da bateria só compromete dado com o poço quando consegue FECHAR no
mesmo turno** — decisão de desenho antiga e documentada. A consequência é que a
medição do poço é **quantizada em degraus inteiros de heróis necessários**:

| Heróis necessários | Configurações | Barão morto |
|---|---|---|
| 4 | 16/3 · 22/1 · 24/0 · 18/2 | 55–58% |
| 5 | 25/1 · 27/1 · 25/2 | 44–46% |

Passar de 4 para 5 derruba 10 pontos de uma vez, porque precisar dos cinco livres é
muito mais raro que precisar de quatro. **Leitura de vida do poço acima de ~5
golpes típicos mede o agente desistindo, e não o objetivo** — foi por isso que a
primeira varredura mostrou um penhasco entre vida 30 e 36 que não existe no jogo.

### Duas correções de unidade que a mudança exigiu

Enquanto os dois moradores contavam golpes, motor e IA podiam calcular o golpe em
lugares diferentes sem ninguém notar. Com o Barão em dano, a divergência viraria a
IA achando que nunca fecha e **largando o objetivo**:

- **`iaJogadas`** avaliava `ep.vida <= (i===2?GOLPE_ULT:GOLPE_HAB)` — em golpes,
  enquanto o motor cobraria em dano;
- **o agente de simulação** avaliava `ep.vida <= podemAgir.length` — e teria
  reportado "ninguém quer o Barão" quando o que houve foi o agente ficar cego para
  a unidade.

O cálculo virou **uma função só**, `golpeNoPoco(h,hb,slot,F,ep)`, usada pelo golpe
mirado e pela IA, com teste conferindo que o que a IA usa para decidir é o que o
motor cobra. O agente de simulação ganhou a mesma conta, e a mudança é **no-op**
para morador que conta golpes — verificado antes de medir qualquer coisa.

112 testes.

---

## v25 — dois botões mortos, o escudo invisível e o tempo entrando no jogo · 2026-08-13

Cinco itens de playtest. Dois eram bug — e os dois eram **de tela, não de regra**,
que é o padrão que este lote deixa registrado: o motor estava certo e o jogador
não tinha como saber.

### O botão de comprar buff não fazia nada

**O relato:** *"não tô conseguindo comprar os itens de buff"*.

**A causa, de leitura direta.** A prateleira *Gastar ouro* desenha os botões com
`class="itC"` **e** `data-g`. O handler dos itens era ligado por
`querySelectorAll(".itC")` — que pega as **duas** prateleiras — e, por ser ligado
depois, **sobrescrevia** o clique do gasto. Clicar em Reforço caía no corpo de
compra de item, `ITEM[undefined]` dava `undefined` e `it.o` estourava
`TypeError`. Quatro botões mortos: Reforço, Requisição, Leva de Ferro e
Sentinela.

**Corrigido** trocando o seletor para `[data-i]`. A classe continua sendo de
aparência; quem manda no clique é o dado. É a armadilha nº 2 do `ESTADO.md`
(seletor pegando o que não devia) em roupa nova — antes foi `id` entre `<section>`
e container, agora foi `class` entre duas prateleiras.

### O escudo era invisível

**O relato:** *"dei 2 ataques contra o Vharn e não deu dano nem tirou escudo"*.

**Reproduzido no harness, e o motor estava certo:** Muralha dá **17** de escudo
num herói de 25; dois golpes de 6 levaram o escudo de 17 → 11 → 5 e a vida ficou
em 25/25. Absorção correta, expiração correta.

**O defeito era a tela, em dois lugares ao mesmo tempo:**

| Onde | O quê |
|---|---|
| `estadoDaPeca` | listava seis estados e **escudo não era um deles** — justamente a lista cujo trabalho é responder *"por que meu golpe não fez nada?"* |
| `revela()` | só emitia número flutuante quando o escudo **subia**. Descendo, nada |

E como a vida não mudou, não havia número de dano nem tremida. **Um golpe
inteiramente absorvido produzia zero feedback.** Da cadeira do jogador, o ataque
não aconteceu.

Agora: **ESCUDO** na peça (logo depois de INTOCÁVEL, antes de MARCADO — decide se
vale dar o golpe), `escudo 17` na gaveta do Time, e o escudo que desce sai como
`⛨−6` com a peça tremendo igual a um golpe que entrou.

### Efeito com prazo — sangramento e veneno

**O pedido:** *"hab que causem efeito com tempo tipo sangramento ou envenenamento
que causa dano por 2 rodadas"*.

Até aqui todo golpe resolvia no próprio turno: a única forma de pressionar alguém
era estar do lado dele com dado na mão. O efeito com prazo é a primeira coisa do
jogo que continua trabalhando depois que o dado acabou.

- **Cobra no início do turno da vítima**, uma vez por rodada — a mesma âncora de
  escudo, prisão e buff, então os dois lados têm sempre a mesma exposição.
- **Ignora armadura e escudo.** Não é o golpe chegando, é o golpe que já chegou.
  A consequência de desenho é a que faltava: contra um Vharn com 17 de escudo e 4
  de armadura não existia resposta nenhuma, e agora existe uma classe de dano que
  passa por dentro. Em troca, o número é pequeno e não escala com o dado.
- **Reaplicar renova**, não empilha. Empilhar transformaria o efeito em dano
  instantâneo com passos extras, que é o oposto do que ele é.
- **Morrer limpa.**

### Zonas — controle de área de verdade

**O pedido:** *"quero habilidades de controle de área"*.

`area`, `danoVizinhos` e `danoRaio` já existiam, mas todos acertam quem está lá
**no instante do golpe** e acabam ali: são explosões, não território. A **zona**
fica no chão e envenena quem **começa o turno dentro** — muda por onde o
adversário anda mesmo nas rodadas em que ninguém gasta dado.

**O prazo da zona é contado em TURNOS DO ADVERSÁRIO, não em rodadas** — e essa
distinção é a parte importante. A zona cobra no início do turno de quem está
dentro, então a criada por quem joga **primeiro** pegaria o adversário já na
mesma rodada, e a do segundo só na rodada seguinte: com prazo de 2 rodadas, uma
cobrava dois turnos adversários e a outra, um. **É exatamente o erro que a v20 já
corrigiu nas ondas** (comparar presença no fim da rodada dava 42% para quem
começa). Contando turnos, os dois lados recebem o mesmo número de exposições por
construção, e há teste travando isso.

### As sete habilidades

| Herói | Habilidade | Slot | O que ganhou |
|---|---|---|---|
| Kaross | Puxada | controle | sangramento 2/rodada × 2 |
| Kurr | Rastro | controle | sangramento 1/rodada × 2 |
| Xhera | Investir | controle | sangramento 2/rodada × 2 |
| Cael | Armadilha | controle | zona raio 1, veneno 1 |
| Ilva | Véu de Névoa | controle | zona raio 1, veneno 1 |
| Arden | Tribunal | Ultimate | zona raio 1, veneno 2 |
| Nira | Tapeçaria | Ultimate | zona raio 1, veneno 2 |

**O sangramento nasceu na BÁSICA do Kaross e do Kurr, e `sim/habs.js` matou a
ideia na hora:** com efeito de graça em todo golpe, o Talho (dado 1) passava a
valer mais que a Puxada (dado 3), e a habilidade do meio deixava de pagar o
próprio dado — a regra fechada na v23. Movido para o slot de controle, o Kaross
foi de **−1 para +5**. A regra que fica: **efeito com prazo é escolha, não
passiva.** Custa dado médio ou alto, e por isso pode ser forte. Há teste.

### A base trata, e o cerco interrompe

**O pedido:** *"o herói na base se cura um pouco por rodada, porém se tiver um
inimigo a 2 hexágonos dele só cura 1x até ele sair de perto"* — implementado como
descrito.

Não havia cura de base nenhuma: o único jeito de recuperar vida cheia era
**morrer**, e o respawn era a cura mais barata do jogo, que é o incentivo errado.
Agora **3 por rodada** na própria base, e voltar custa movimento.

A trava é a parte que importa. Com inimigo a **2 casas ou menos**, o herói se
trata **uma vez** e para até o cerco sair de perto. Sem ela, recuar viraria poço
de vida infinito e mergulhar na base deixaria de ser decisão.

### O Reforço era o Poder mais barato do jogo

**O relato:** *"além disso tá mto barato"*. Medido com um instrumento novo,
**`sim/ouro.js`**, em 600 partidas:

| | |
|---|---|
| Ouro que um herói acumula na partida | **61** |
| Build completo mais caro (3 itens) | **25** |
| Sobra | **36** |

Com a curva antiga (6, +2) essa sobra pagava **quatro** Reforços — 6+8+10+12 = 36,
ou **+4 de Poder permanente**. Nenhum item da loja dá mais de +2, e todos ocupam
um dos três slots; o Reforço não ocupa nada e não tem teto. **Curva 6+2 → 10+4:**
a mesma sobra compra dois, e o terceiro exige guardar em vez de gastar. O que se
comprou não foi número, foi escolha.

**O que este número NÃO resolve, e está medido:** a renda paga o build **2,4×**.
Mexer no preço de um gasto não fecha uma torneira aberta. `sim/ouro.js` já traz
`farma=`, `agiu=` e `matar=` para o grupo testar a renda quando quiser decidir —
ver `docs/DECISOES-PENDENTES.md`.

### A bateria estava medindo o confronto, não a ordem

**O achado mais importante deste lote, e ele não veio de relato nenhum** — veio de
o número não fechar.

`sim/bateria.js` sempre rodou **um confronto fixo**: vharn/nyx/solenne/vesper/mirrha
contra kaross/grumo/zhet/cael/torvald. Dez dos vinte heróis, repartidos
fixamente entre os lados. Para mudança **estrutural** (mapa, torre, onda, ouro,
respawn) isso não atrapalha — ela cai igual nos dois lados. Para mudança que toca
**herói**, cai só do lado em que aquele herói está.

Das sete habilidades da v25, **duas estavam no time 1 (Kaross e Cael) e nenhuma
no time 0.** A bateria acusou "quem começa" subindo de 51,2% para 53,5% com
z=6,60, e **eu cheguei a concluir que a v25 tinha custado 2 pontos de equilíbrio
de ordem.** Não tinha: o que eu media era o confronto que eu mesmo desequilibrei.

**`times=espelho`** põe os mesmos cinco heróis nos dois lados. Aí a única
diferença que sobra é quem joga primeiro — que é o que a métrica diz medir:

| Braço (espelhado, n=9000 cada) | quem começa |
|---|---|
| v25 completa | 52,98% |
| v25 com as três mecânicas desligadas | 52,73% |
| **diferença** | **+0,24 ponto · z=0,33 — ruído** |

**As mecânicas novas não movem o equilíbrio de ordem.** Duração mediana: 23 nos
dois braços — a cura de base não alongou a partida.

**E fica um número novo para o grupo:** no confronto espelhado, "quem começa"
mede **~52,9%**, e não os ~51% históricos. Os 51% eram do confronto assimétrico —
a composição de um lado compensava parte da vantagem de ordem. O item 1 de
`DECISOES-PENDENTES.md` foi atualizado com isso.

### Erros meus nesta sessão, registrados de propósito

1. **Li ruído como sinal, e depois li sinal como ruído.** Com braços de n=3000,
   `zonas=off` deu 51,6% (abaixo do build) e me convenceu de uma assimetria de
   zona; refeito depois da correção, deu 53,0% (**acima**). O braço inverteu de
   sinal — assinatura de ruído. Depois, a n=9000, li 53,5% como regressão real da
   v25 quando era o confronto. **A assimetria de zona que corrigi é real, mas foi
   achada LENDO o código, não medindo** — e a correção vale pelo raciocínio.
2. **Dois testes meus nasceram errados.** Um checava se o veneno gastava escudo
   chamando `iniciaTurno`, que expira o escudo por regra: o teste passaria medindo
   a coisa errada. Outro exigia etiqueta nula num herói que nasce no mato e
   legitimamente acende ESCONDIDO.
3. **O heurístico da IA para sair da zona não funcionava.** Eu procurava saída
   entre os vizinhos, mas zona de raio 1 cobre a casa **e** as seis em volta — não
   havia vizinho limpo, e a IA desistia. O teste pegou.
4. **O crédito da morte por sangramento ia para o herói errado.** Eu lia o autor
   depois de filtrar a lista de efeitos, e a cobrança que mata é justamente a que
   tira o efeito da lista — o ouro ia para o inimigo mais próximo. Achado na
   auditoria, antes de commitar.

### Texto do jogo que estava mentindo (de novo)

O guia dizia *"uma Ward acende os dois matos de uma vez"*, o que a regra da v22
desfez — ward só enxerga mato de dentro do mato. Ficou registrado na v24 e
**continua sem conserto**, porque é de outro lote.

---

## v24 — o Dragão cabe em dois dados · 2026-08-13

Um número só, medido sozinho de propósito. A v23 fechou com três regras novas no
mesmo lote e o aviso de que mexer no Dragão junto tornaria impossível dizer de
quem era qualquer efeito. Este lote é o Dragão, e nada além dele.

### Vida do Dragão: 4 → 3

**O relato, herdado da v23:** *"muito tentado e pouco fechado"* — o veredito que
`sim/epicos.js` imprimia sozinho, versão após versão.

**Medido em 1500 partidas antes de mexer:** o Dragão aparecia em 100% das
partidas, era atacado em 63,3% delas e morria em **21,5%**. O Barão, com a
**mesma vida 4 e um pedágio maior** (revide 4 contra 2), morria em 56,0%. A
diferença nunca foi preço de encostar — foi **janela**: o Dragão desce na rodada
5 e perde o lugar na 12, quando o Barão toma o poço mesmo com ele vivo. Sete
rodadas para juntar **duas Ultimates no mesmo poço**, que é o que 4 de vida
exigia.

**A regra:** o Dragão tem **3 de vida**. Cai em **Ultimate + básica** — dois
dados, de dois heróis, dentro de um turno. E continua **não caindo numa Ultimate
sozinha**: o segundo dado é o dilema, e ele ficou de pé.

| | v23 | v24 |
|---|---|---|
| Dragão morto (das partidas em que aparece) | 21,5% | **32,3%** |
| Golpes no Dragão por partida | 1,4 | **1,3** |
| Veredito de `sim/epicos.js` | *caro demais* | **disputado e fechável** |
| Barão morto | 56,0% | 53,2% |
| Duração mediana | 23 | 23 |

**O ponto que interessa é o par:** o Dragão passou a fechar mais **sem ser mais
atacado** — os golpes por partida até caíram. Não virou ímã nem farm; virou
tentativa que converte. Era exatamente o que faltava.

### O pedágio foi descartado por medição, não por gosto

O handoff da v23 apontava **duas** alavancas para o Dragão, `vdragao=` e
`revide=off`. A segunda foi medida e **não faz nada**:

| Variante (n=1500 cada) | Dragão morto |
|---|---|
| build v23 | 21,5% |
| `revide=off` (nenhum morador cobra pedágio) | **21,7%** |
| `rdragao=0` (pedágio zero só do Dragão) | 23,4% |
| **`vdragao=3`** | **33,1%** |
| `barao=14` (janela de 7 → 9 rodadas) | 34,5% |

Zerar o revide devolve 0,2 ponto. Faz sentido depois de visto: **quem desiste do
Dragão desiste por dado gasto, não por vida perdida** — o custo que pesa é o
turno que o herói não passou empurrando rota.

`barao=14` funciona tão bem quanto a vida 3, e foi **recusado pelo preço**: o
Barão deixa de aparecer em 7% das partidas (98,2% → 93,3%) e a mediana sobe para
24 rodadas. O fim de partida arrastando é preocupação aberta desde a v23, e a
correção do Dragão não podia ser paga pelo Barão.

### O que isso quebra

Nada de mecânica. **A vantagem de quem começa não se moveu** — A/B com a vida do
Dragão como única variável, n=6000 por braço:

| Braço | quem começa |
|---|---|
| vida 4 | 51,7% · 52,1% → **51,9%** |
| vida 3 | 50,9% · 51,4% → **51,2%** |

Diferença de 0,7 ponto, **z=0,75 — ruído**. Registro junto uma lição que já está
escrita na armadilha nº 4 e que quase repeti: numa das execuções de 2000 a v24
deu 52,8% com z=2,5, e o alerta de *"VANTAGEM REAL"* disparou. O A/B mostrou que
o braço da **vida 4** dava 51,9% na mesma condição. Era oscilação. Execução
isolada continua não distinguindo 51% de 53%.

### Texto do jogo que estava mentindo

Encontrado ao conferir onde a vida do Dragão aparecia escrita. O painel **Como
jogar**, dentro do jogo, descrevia o poço com números de **três versões atrás**:

| Dizia | É |
|---|---|
| Dragão: 8 de vida, revida 1, até a rodada 8 | 3 de vida, revida 2, rodada 5 |
| Barão: 14 de vida, revida 2, da rodada 8 | 4 de vida, revida 4, rodada 12 |
| Fúria: +2 de Poder no time e as ondas andam | **escolha de 1 de 3 dádivas**, nenhuma dá Poder |

`docs/REGRAS.md` errava os dois revides (1 e 2, contra 2 e 4 do motor) num
arquivo que se declara extraído do motor. O **guia** ainda dizia *"Dragão até a
rodada 8"* e descrevia a recompensa do Barão como a **Fúria** (+2 de Poder e as
ondas), que a escolha de três dádivas substituiu na v20. Tudo corrigido: bestiário
e glossário.

Nenhuma dessas linhas é regra — mas as três descreviam o poço para quem está
aprendendo a jogar, e é o sistema que este lote mexeu.

**Continua errado e não foi tocado:** o mesmo painel diz que *"uma Ward acende os
dois matos de uma vez"*, o que a regra da v22 desfez — ward só enxerga mato de
dentro do mato. Fica registrado aqui em vez de corrigido junto, porque é texto da
v22 e não deste lote.

---

## v23 — o fim de partida volta a ser jogado · 2026-08-13

Cinco itens do playtest. Dois de tela, três de regra — e o maior deles saiu de
uma medição que confirmou o relato quase em cima da vírgula.

### Creep não fecha mais partida com alguém defendendo

**O relato:** *"as lanes acabam empurrando... os creeps acabam levando o jogo
depois que eu levo as torres."*

**Medido em 1500 partidas da v22: 97,3% terminavam com a ONDA dando o golpe
final.** O jogador derrubava a rota e depois assistia três rodadas de contagem
regressiva em que nenhuma escolha mudava nada.

**A regra:** com o Nexus em **1**, a onda só passa se **não houver herói inimigo
defendendo** (a 1 de distância do Nexus). Base abandonada continua caindo
sozinha; base defendida exige matar o defensor.

*A primeira tentativa foi um piso duro — a onda para em 1, sempre. Ela morreu na
medição: sem ninguém obrigado a ir fechar, a bateria de 1200 partidas **não
terminou nenhuma**. Regra cujo fim depende de iniciativa trava contra quem não
toma iniciativa. A versão que ficou não pode empacar por construção.*

**A IA aprendeu a defender junto.** Com o Nexus em 1 e uma rota aberta, ela manda
**um** herói — o mais perto de casa — segurar a base. Sem isso a regra existiria
só para o humano, e o jogador nunca veria a última luta que ela devolve.

### Morrer custa mais conforme a partida anda

**O relato:** *"o herói dentro da base é curado... tem que fazer alguma coisa
para ele não ficar dentro da base se curando e lutando."*

Não existe cura de base neste jogo — o que existe é o **respawn**, que devolve
vida cheia a uma casa do Nexus. Custava **2 rodadas** do começo ao fim, então
defender o próprio Nexus morrendo de propósito era de graça.

**Agora:** 2 rodadas até a 8, **3** até a 16, **4** daí em diante. É a curva de
MOBA: cedo, morrer é lição; tarde, morrer é a partida — e é o que abre a janela
para o atacante fechar o Nexus com um herói.

### A habilidade do meio paga o próprio dado

**O relato:** *"otimiza as habilidades dos heróis, ainda mais algumas de
controle."*

Virou medição em `sim/habs.js` (instrumento novo): com o **mesmo dado**, quanto
cada habilidade entrega comparada à **básica do próprio herói**. Achado:
**Provocar, Puxada, Puxada Funda e Emaranhar davam exatamente o mesmo dano da
básica** — só que a básica sai com qualquer dado e elas exigem 3+. O jogador
pagava um dado mais raro pelo mesmo número, e o efeito vinha como se fosse
grátis.

| Mudança | De | Para | Por quê |
|---|---|---|---|
| **Escala da habilidade do meio** | ×1 | **×1,2** | +1 de dano em todo dado de 3 a 6. Com ×1,15 o arredondamento comia o bônus justo no dado 3 |
| **Caçada** (Nyx, Ultimate) | `dano 1` | `dano 1 · +3 · executa 6` | Era **pior que a própria básica**: Bote (F1) tem +2 e a Ultimate (F5) não tinha nada |
| **Recarregar** (Vesper, Corvo) | recarga 4 | **recarga 6** | Gastar a ação para guardar +4 rendia menos que bater |
| **Eco** (Zhet) e **Rastro** (Kurr) | só `marca 4` | `dano 1 · marca 4` | Marcar sem bater é guardar valor que só paga se um segundo golpe acertar |

A escala da Ultimate segue **×1,25**, e continua sendo o pico.

*Duas habilidades continuam abaixo da régua de propósito: **Doar Dado** (Mirrha)
e **Empréstimo** (Vidra) aparecem em −10 porque devolvem uma **ação inteira** a
um aliado, e ação não cabe em ponto de vida. **Sombra** (Nyx, intocável) e
**Investir** (Xhera, troca cura por agarrão) valem o que a situação valer.*

### Tela

**A ward mostra o que acende.** Antes era um pontinho com o prazo embaixo, e a
queixa foi direta: *"quando usar um ward, sinalizar no mapa onde ele tá"*. Agora
as casas dentro do alcance dela ganham borda tracejada — dá para escolher onde
plantar olhando o mapa, em vez de contar hexágono de cabeça. Recém-plantada, o
olho pulsa. *A primeira versão desenhava um anel de raio 3 em volta do olho e
quebrou a tela: o `viewBox` é recalculado por `getBBox()`, então um círculo de
~100px num tabuleiro de 300 inflava a caixa e **encolhia o mapa inteiro**.*

**O estado está escrito na peça.** *"Quando o herói tiver preso tem que estar
escrito nele."* Uma etiqueta por peça, a de maior consequência primeiro: `PRESO`,
`INTOCÁVEL`, `MARCADO`, `CARREGADO`, `SEM CURA` e — só para o dono da peça —
`ESCONDIDO` / `REVELADO`. Uma e não três: em peça de 19px, três etiquetas não são
três informações, são zero. A gaveta do Time passou a mostrar os números
(`marcado +4`, `carregado +6`) e ganhou `revelado` e `sem cura`.

### Balanceamento

`quem começa`, build v23, **três execuções de 2000**: **50,7% · 51,6% · 51,0%**
→ **51,1% em 6000 (z=1,76, dentro do ruído)**. A v22 fechou em 51,3% com z=2,0 e
com muito mais espalhamento entre execuções (49,6 a 52,6).

| Medição | v22 | v23 |
|---|---|---|
| Partidas fechadas pela **onda** | **97,3%** | ver nota |
| Duração mediana | 21 rodadas | **23** |
| Barão morto (das partidas em que aparece) | 49,9% | **54,6%** |
| Vitória de quem leva o Barão | 48,8% | **52,3%** |
| Torres por partida | 4,5/12 | 4,7/12 |

**Nota honesta sobre os 97,3%:** com a regra nova a bateria mede **94,8%**, e a
queda pequena não mede a regra — mede o agente. O agente quase aleatório **não
defende a própria base**, então a última muralha quase nunca dispara para ele. Em
partida de gente, quem está perdendo defende: é literalmente a queixa que abriu
este item. O efeito real se vê em partida contra a IA, que agora manda um herói
para casa, e no playtest humano.

O Barão melhorou nos três números ao mesmo tempo — mais fechado, mais atacado, e
levá-lo passou a correlacionar com vencer (48,8% → 52,3%). Fazia sentido: com o
último ponto do Nexus dependendo de golpe de herói, o **Aríete** (golpe de herói
em estrutura vale 2) virou dádiva de fim de partida de verdade.

**O Dragão continua caro** — 21,9% de fechamento, e `sim/epicos.js` segue
imprimindo *"muito tentado e pouco fechado"*. Não foi mexido nesta versão: já são
três regras novas no mesmo lote, e mexer no preço do Dragão junto tornaria
impossível dizer de quem é qualquer efeito medido depois.

### O que isso quebra

- Derrubar as torres **não fecha mais a partida sozinho** se o adversário levar
  um herói para casa. O último ponto é de herói.
- Morrer na rodada 20 custa **4 rodadas**, não 2.
- As habilidades do meio dão **+1 de dano** — inclusive as dos inimigos.
- Nyx ganhou execução (6 de vida ou menos) e **3 de dano** a mais na Ultimate.

**84 testes passam** (eram 81). Partida IA×IA completa no navegador: 33 a 47
rodadas, e o Nexus fica em 1 por **no máximo 1 rodada** — a regra nova não
arrasta o fim.

---

## v22 — o mato esconde de verdade · 2026-08-13

Quatro itens: um bug de visão, uma regra nova de defesa, um gasto de ouro e um
conserto de tela. Mais um bug latente que apareceu no meio do caminho.

### O mato voltou a esconder

**O relato:** *"continuo vendo os adversários no mato mesmo sem ter visão."*

**Medido na v21, no início da partida:** o time enxergava **78 dos 116**
hexágonos (67%), e **47 das 70** casas fora de rota. Com seis torres, três
ondas, a base e cinco heróis acendendo 2 de raio cada, sobrava pouco escuro — e
o pouco que sobrava não era o mato. **O acampamento Carmim nascia visível para
os dois lados.** O Caçador estava invisível na regra e à vista na tela.

**A regra nova, uma só:** *o mato só se enxerga de dentro do mato.* Vale para
toda fonte, inclusive a ward — ward plantada na rota **não** vê o mato ao lado.
Fora do mato, nada muda: raio continua raio.

**Medido agora, no mesmo início de partida:** **61 de 116** (53%), 30 das 70
fora de rota, e **os três acampamentos escuros** para os dois lados.

Os raios continuam os mesmos (herói 2, torre 2, base 2, onda 2, ward 3).
Diminuir raio teria escurecido o mapa inteiro por igual — o que faltava era o
mato ser **terreno**, não só pintura.

**Quem ataca fica revelado.** Golpe em herói inimigo entrega a posição de quem
bateu: ele fica visível para o adversário **até sair da casa de onde atacou**.
É o preço da emboscada (+2 de Força, que continua valendo) — o mato deixa de ser
ninho de tiro grátis, e sair de lá vira decisão.

*Guardado como a casa de onde ele bateu, e não como um sinalizador: andar
invalida sozinho, em qualquer caminho que mexa na posição (passo, recuo,
Convocar, respawn).*

### Bug latente: o cache de visão podia mentir

Achado enquanto o teste da ward falhava sem explicação. A chave do memo de visão
somava `x = x*31 + termo` em `Number` comum. Com 5 heróis, 6 torres, 3 frentes e
as wards, `x` passa de 1e19 antes do fim — e a partir daí **o ulp do float é
maior que os termos que ainda faltam entrar**. Na prática, mover a ward de uma
casa para a vizinha dava a **mesma chave**, e a visão vinha do cache velho.

Agora a conta é em inteiro de 32 bits (`Math.imul`), onde nenhum bit se perde por
magnitude. Vale desde a v21, e é parte de por que a névoa parecia grudar.

### Defender junto da torre — **+1 de Armadura**

Herói colado (distância ≤ 1) numa torre **viva do próprio time** ganha
**+1 de Armadura**. A torre do adversário não protege quem está mergulhando.

Um ponto e não mais: com a vida da v21 (18–25) e o golpe médio em 6–8, +1 tira
cerca de **um sétimo** do dano. Muda a conta da troca sem tornar o par
torre+herói impossível de quebrar — que era exatamente o risco levantado quando
a ideia foi proposta. E o bônus **cai junto com a torre**.

### Ouro depois dos três itens — a **Sentinela**

Quarto e último gasto da prateleira: **4 de ouro, +2 a cada compra do mesmo
herói**, teto de **2 na mochila**.

Compra na base (ou morto), como todo o resto. Não vira ward na hora: vira
**carga**. Plantar é de graça — nem dado, nem movimento, nem submenu — pelo botão
`◉ plantar ward`, que só existe quando o herói tem carga.

**Ficou uma opção e não cinco**, que era o pedido. Entre os cinco candidatos
discutidos (ward, consumível, carta, creep, re-rolagem), a ward foi escolhida
porque é a única que **ficou melhor com a regra do mato**: agora que o mato só se
vê de dentro, saber onde o adversário está é problema de verdade. O consumível de
cura, o candidato mais próximo, fica de fora por redundância — quem compra está
na base ou morto, e os dois estados já curam.

A IA compra e planta pelas mesmas regras: só no mato, e só onde ainda não
enxerga.

### Tela: as pastilhas atravessavam a faixa colorida

**O relato:** *"no canto superior direito está quebrado o layout fora da linha
vermelha."*

A linha das pastilhas (ouro, placas, prioridade, herança, fúria, retomada,
feitiço, visão) chega a **oito** e cabiam quatro. Sem `flex-wrap` e sem
`min-width:0` ela não tinha como ceder: o texto de dentro de cada pastilha
quebrava em duas alturas e a última **atravessava a borda** da faixa.

Agora quem quebra é a **lista** (pastilha inteira desce de linha, alinhada à
direita), nunca o texto de dentro. No mesmo passo, os três ícones do HUD deixaram
de encolher: num 320 de largura eles apertavam para **29px**, abaixo do mínimo de
toque de 40. Medido depois: `scrollWidth == clientWidth` em 320, 375, 390 e 430.

### Balanceamento — o que a medição diz

`quem começa`, build v22, **três execuções de 2000 partidas**:
**52,6%** (z=2,37) · **51,6%** (z=1,48) · **49,6%** (z=−0,36).
Somadas: **51,3% em 6000 partidas (z=2,0)**.

Isoladas, uma de cada vez, n=2000 (variantes novas na bateria: `armtorre=`,
`mato=off`, `revelar=off`, `passo1=`):

| Variante | quem começa |
|---|---|
| build v22 completo | 52,6% (z=2,37) |
| `armtorre=0` — sem a armadura de torre | 51,8% (z=1,61) |
| `revelar=off` — atacar não revela | 51,6% (z=1,43) |
| `passo1=0` — sem o Primeiro Passo | 51,9% (z=1,70) |
| **`mato=off`** — mato volta a não bloquear | **50,4% (z=0,36)** |

A regra do mato responde pela subida. **Nada foi mexido para compensar**, por
dois motivos. Primeiro: a diferença entre as três execuções do mesmo build
(49,6 → 52,6) é maior que o efeito que se quer corrigir — uma execução isolada de
2000 não distingue 51 de 53. Segundo, e mais importante: a bateria é
**declaradamente cega para agência**, e névoa é a mecânica de agência por
excelência. O agente quase aleatório não colhe o prêmio de se esconder, só paga o
custo de não enxergar alvo — então este número tende a **superestimar** o
prejuízo. Fica registrado para o playtest humano decidir.

*Ritmo inalterado: mediana 21 rodadas, 4,5/12 torres, 0,2 Dragões e 0,7 Barões
por partida.*

### O que isso quebra

- Quem jogava contando com ver o mato da rota **não vê mais**. Ward na rota
  também não. É a mudança que mais muda o hábito.
- Atirar do mato deixou de ser grátis: o primeiro golpe entrega a casa.
- Torre viva agora vale **+1 de Armadura** para quem defende — mergulho em torre
  ficou mais caro.
- Texto do manual atualizado: a seção do Caçador ainda descrevia a **rotação da
  v18**, removida na v19, e a do Suporte falava em "sair da rotação".

**77 testes passam** (eram 67; dez novos, todos escritos antes da correção).

---

## v21 — visão por fontes, e o fim do hitkill · 2026-08-12

Nove itens do playtest. Quatro eram bug, três eram número, dois eram regra nova.

### Visão — agora vem das peças, como num MOBA

**A névoa por região saiu.** A v19 escondia só o mato, e rota/rio/base eram
sempre visíveis. Agora **você enxerga o que as suas peças enxergam**, e o resto
do tabuleiro é escuridão — inclusive pedaço de rota.

| Fonte | Raio |
|---|---|
| Herói | 2 |
| Torre viva | 2 |
| Base | 2 |
| Frente de Onda (o creep) | 2 |
| **Ward** | **3** |

*Medido no início de partida: ~67% do mapa visível, 38 hexágonos escuros.*

**A Ward virou peça no mapa**, com posição e prazo de 3 rodadas, em vez de um
sinalizador abstrato do time. É o que a faz interagir com a visão por raio:
acende um pedaço onde você não tem ninguém.

**Na vez da IA a tela é a do humano.** O tabuleiro desenhava pela perspectiva de
`J.vez`, então durante o turno dela o jogador via os heróis dela saindo do mato —
a névoa vazava exatamente para o lado errado. Agora `ladoDaTela()` é sempre o
humano em partida contra IA.

### Bugs

**Ágil dava movimento infinito.** "A 1ª casa andada é grátis" valia por
MOVIMENTO, não por turno: andando de 1 em 1 hexágono, todo passo custava zero.
Agora o desconto é uma vez por turno.

**Respingo de Ultimate tirava 1 do poço** enquanto o golpe mirado tirava 2 — o
Cerco do Torvald, que é Ultimate, valia como habilidade básica. O peso do golpe
passou a ser da habilidade, não do caminho por onde ele chega.

**Carta de item sumia sem entregar nada.** Com o inventário cheio ela ia para o
cemitério e só escrevia "sem item disponível" no log. Agora fica apagada quando
não há slot livre ou item elegível. *A escolha de 3 itens sempre funcionou — o
que falhava era esse caso.*

**Acampamento era corrida, não disputa.** Pisar coletava na hora, e quem jogava
primeiro com um Dado Mestre alto varria os três sem o adversário poder responder.
Agora **pisar ocupa; o ouro sai no fim da rodada, para quem ainda estiver lá** —
um turno inteiro de janela para matar, empurrar ou chegar antes.

### Números

**Fim do hitkill.** Medido: vida de herói 10–14 contra Ultimates de 11–13 —
**11 das 12 Ultimates matavam de um golpe**, e todos os 12 heróis morriam em duas
básicas. Três mudanças juntas:

- **vida ×1,8** (10–14 → 18–25), e com ela tudo que é medido em vida: escudo,
  cura, roubo, espinho, item de vida, Égide do Barão, Retorno, cartas defensivas,
  revide de torre (2 → 4) e revide dos épicos;
- **escala da Ultimate 1,5 → 1,25**;
- **dano fixo ×0,75** (Julgamento 11 → 8, Ato Final 10 → 8, Sentença 10 → 8).

*Resultado: **0 de 12** Ultimates matam de um golpe, e só 3 de 12 heróis morrem
em duas básicas. A duração da partida não mudou (mediana 21) — quem marca o
relógio é a torre, não o abate.*

**Alcance com teto de 4.** O Corvo tinha base 4 e somava Cetro +1 com Lente +2:
atirava a **sete** hexágonos. Corvo 4 → 3, Lente de Âmbar +2 de Alcance → +1 de
Alcance e +2 de Poder, e um teto duro de 4.

### Regra nova

**Cara ou coroa.** Quem começa deixou de ser sempre o Azul. Começar tem valor
medido — o Primeiro Passo existe por isso —, e num jogo de dois no mesmo
aparelho a ordem fixa era um presente silencioso para quem sentasse do lado azul.

### Correção no instrumento

O memo do campo de visão nasceu com invalidação manual (`sujaVisao()` em cada
ponto que move peça) e quebrou na primeira mutação direta de estado. Foi
trocado por uma **chave derivada do estado** — ~25 números somados, barata o
bastante para rodar a cada consulta e correta por construção. A vizinhança de
cada hexágono também passou a ser pré-calculada na carga: sem isso a bateria de
2000 partidas deixava de terminar.

### O que isso quebra

- **O tabuleiro fica bem mais escuro.** ~1/3 do mapa é névoa a qualquer momento.
- **Combate ficou mais longo:** de 1–2 golpes para 3. Fica a dúvida de playtest
  se as brigas agora arrastam.
- **Quem começa:** 50,5% (n=2000, z=0,49) e 51,9% (n=800). Dentro do ruído.
- Os três heróis de dano fixo perderam ~20% de dano; contra tanque continuam
  sendo o melhor golpe, porque seguem ignorando armadura.

## v20 — ordem equilibrada, Barão com escolha, e ouro com prazo · 2026-08-12

Três frentes pedidas no playtest, medidas uma de cada vez.

### 1 · Equilíbrio de ordem — de 42,0% para 48,6%

O problema era **assimetria de informação**, não falta de bônus: a onda avançava
comparando presença de rota **no fim da rodada**, ou seja, depois que o segundo
jogador já tinha se posicionado. Ele via o adversário e respondia; o primeiro
jogava às cegas.

**A presença de cada time passa a ser congelada no fim do próprio turno.** Os
dois declaram posição sem ver a resposta do outro. Sozinha, essa mudança levou
42,0% → 46,8%.

**Primeiro Passo:** quem começa a partida rola **+1 no Dado Mestre na rodada 1**,
e só nela. Fecha o resto: **48,6%** (n=6000, três execuções de 2000 — 48,9 · 48,1
· 48,8).

Testadas e descartadas, uma por vez: **+1 de movimento toda rodada** dá 59,7% —
vira vantagem, não compensação; **+2 na rodada 1** empata com +1, porque na
primeira rodada não há o que fazer com tanto movimento.

### 2 · Leva de Ferro — o gasto que encarece com o relógio

Terceiro gasto tardio, ao lado de Reforço e Requisição: **a sua onda de uma rota
avança 1 casa**. O preço começa em **4** e sobe **1 a cada três rodadas, até 12**.

Os outros dois encarecem conforme *você* compra; este encarece conforme a
*partida* anda — de propósito, porque ele compra território, que é a coisa cujo
valor mais muda com o tempo. A curva cruza a renda de um herói parado (3 por
rodada) por volta da rodada 12, que é quando o Barão desce e o mapa passa a valer
mais que o cofre.

A IA passou a distribuir o gasto em vez de despejar tudo no Reforço — comprar
sempre o mais caro fazia dela refém do único item que encarece a cada compra.

### 3 · Barão — o defeito, o preço e a dádiva

**Medição primeiro** (`sim/epicos.js`, novo). No build v19, 800 partidas:

| | aparece | atacado | morto | vitória de quem leva |
|---|---|---|---|---|
| Dragão | 100% (r5) | 90,8% | 64,6% | 53,4% |
| Barão | **55%** (r17) | 28,4% | **6,8%** | 60,0% |

O Barão tinha dois problemas, e o primeiro era um **defeito**: o poço só trocava
de morador quando estava vazio. Se ninguém matasse o Dragão, ele ficava sentado
lá a partida inteira e o Barão nunca descia — daí os 55%, quase exatamente a taxa
em que o Dragão morre. **Agora o Barão toma o poço na rodada dele**, Dragão vivo
ou não, o que de quebra dá ao Dragão um prazo.

**Timing e preço, medidos um de cada vez:** Barão na rodada 8 deixava o Dragão
com 3 rodadas de janela (caía em 1,3%); na **12** ele recupera 7. Vida do Barão
**6 → 4**.

**Dádiva de escolha.** O prêmio era sempre o mesmo (+2 de Poder e ondas
andando), e prêmio fixo produz estratégia fixa. Quem fecha agora escolhe **uma de
três**:

- **Ondas de Ferro** — as três ondas avançam sozinhas;
- **Égide do Barão** — 4 de escudo no time no início de cada turno seu;
- **Aríete** — golpes de herói em torre e Nexus causam 2 em vez de 1.

Nenhuma dá Poder bruto. O Barão deixou de ser "seu time bate mais forte" e virou
**pressão de mapa** — que é o que o torna útil para quem está atrás sem o jogo
entregar vantagem a quem perde. A virada continua tendo de ser ganha.

Resultado (1500 partidas): Barão aparece em **97,8%**, atacado em **80,8%**,
morto em **47,7%**, e a vitória de quem leva caiu de **70,3% para 51,3%** — o
objetivo parou de ganhar a partida sozinho.

### Correção no instrumento de medida

`sim/motor.js` passou a neutralizar `iaExecutaTurno`. Em `simMode` o motor
disparava a IA a cada turno; ela é `async`, o `setTimeout` do harness nunca chama
o callback, e ela travava no primeiro `await` **deixando `iaRodando` preso em
true**. Efeito: a IA comprava na primeira partida da bateria e em nenhuma das
seguintes, e o resultado do run inteiro dependia do jogo nº 1. O mesmo build deu
**47,6% e 50,4%** em execuções diferentes — 3 pontos que não eram do jogo.
Depois do conserto, três execuções seguidas variam 0,8 ponto.

*Toda medição anterior à v20 que use a bateria carrega esse viés.*

### O que isso quebra

- O **Dragão** paga o prazo: morto em 18,7% contra 64,6% antes. Boa parte é
  artefato do agente aleatório, que é lento e precisa de ~10 rodadas para fechar
  qualquer coisa — mas o número precisa de playtest humano antes de mexer de novo.
- Quem contava com o Barão como pico de Poder precisa reaprender: agora ele dá
  território, escudo ou aríete, e nada de dano.
- Sobrou **1,4 ponto** de desvantagem para quem começa. Cada execução individual
  cai dentro do ruído, mas as três somadas ainda pendem para o segundo.

## v19 — névoa no mato: o Caçador some sem sair do tabuleiro · 2026-08-12

Corrige o rumo da v18. A rotação tirava o Caçador do tabuleiro, e não era isso
que o projeto queria: a peça tem que continuar em algum lugar real — o que muda é
quem consegue vê-la.

### O que mudou

**A regra, em uma frase: rota, rio e base todo mundo vê; o mato você só enxerga
se tiver alguém dentro.** Duas regiões — mato de cima e mato de baixo — que se
enxergam separadamente. Um herói na selva desaparece do mapa do adversário que
não tem ninguém lá. Ele continua andando, farmando e empurrando rota
normalmente; o oponente é que parou de ver. Ao pisar numa rota, reaparece.

**Por que presença e não raio de visão.** O mapa é 11×11 e quase sempre há um
herói em cada rota. Névoa por raio revelaria o tabuleiro quase inteiro o tempo
todo — muita regra para nenhum efeito. Amarrada à presença, a informação passa a
custar **uma peça**, e isso é decisão: mando alguém vigiar o mato ou ele rende
mais pressionando a rota?

**Emboscada substitui o Plano de Caça.** Quem ataca vindo do mato sem ter sido
visto ganha **+2 de Força** no golpe. O bônus deixou de ser prêmio por cumprir
uma ficha declarada e virou consequência de posição.

**A IA obedece à mesma névoa.** Toda leitura de herói inimigo passa por
`iaInimigosVisiveis`, que aplica exatamente a regra do jogador. Ela às vezes anda
para dentro de uma emboscada — é o preço de jogar limpo, e é o que acontece com o
humano. *Sem isso a névoa seria uma regra que só um dos dois obedece.*

**Na tela.** O mato sem visão fica visivelmente mais escuro, e o HUD diz o estado
da informação ("mato todo sem visão", "sem visão no mato de cima", "2 no mato,
sem ser visto"). O poço épico fica fora da névoa: é objetivo compartilhado e o
relógio da partida precisa ser legível para os dois.

**Ward** acende os dois matos de uma vez, enquanto posta.

**Removido:** a rotação da v18 (sair do tabuleiro, as quatro entradas de selva, a
emergência no turno seguinte) e o que restava do Plano de Caça.

### O que isso quebra

- **Quem começa continua em desvantagem: 42,0%** (n=1500, z=−6,2). Uma medição
  intermediária de n=250 deu 50,0% e chegou a ser comemorada como efeito
  colateral da névoa; era ruído. Com amostra grande o desequilíbrio segue igual
  ao da v16, e a névoa **não** o corrige. Continua pendente — ver
  `docs/DECISOES-PENDENTES.md` item 1. *Lição registrada: 250 partidas não bastam
  para essa medição; use 1500 ou mais.*
- O mapa fica bem mais escuro no começo da partida, quando os dois times estão
  nas rotas e ninguém tem olhos no mato.
- Quem jogava contando as peças inimigas no tabuleiro precisa reaprender: agora
  a contagem pode mentir.
- Um herói escondido ainda **pressiona rota**, então a onda avançando é uma
  pista de que tem alguém ali. É informação de graça, e é de propósito.

## v18 — a IA que avalia, e o Caçador que some de verdade · 2026-08-12

### O que mudou

**IA — de gulosa para avaliadora.** Ela varria heróis e habilidades na ordem do
catálogo e executava a PRIMEIRA jogada válida, com escada fixa de prioridade. Por
isso batia num herói de passagem enquanto o Barão morria ao lado. Agora
`iaJogadas` enumera toda jogada possível (herói × habilidade × alvo) e pontua numa
escala declarada — 1000 ganhar agora, 300 matar, 100 torre, 10 dano comum — e
executa a maior. Com piso de nota 15 ela também RECUSA jogada ruim, preferindo
converter o dado em movimento.

**IA — movimento com motivo.** Andar era o que ela fazia quando não sabia o que
fazer. Agora cada herói tem destino nomeado (recua / objetivo / farma / caça /
pressiona / avança) e ela só anda se o passo APROXIMAR. Movimento inútil fica no
bolso.

**Acampamentos.** Só o Caçador buscava. Agora qualquer herói a até 3 hexágonos
vai; o Caçador mantém raio 9.

**Acampamento neutro: uma posição fixa → duas, sorteadas por partida.** Ambas a
**7** das duas bases. A justiça não é sorteada, só o lado.

**Vida do épico: Dragão 8 → 4, Barão 14 → 6.** Medido: a 1–2 de dano por ação e 3
dados por turno, o Dragão custava ~2,7 turnos do time INTEIRO e o Barão ~4,7 —
contra uma torre de 3 golpes que leva direto à vitória. Não havia dilema, e foi
por isso que a IA, depois de ganhar avaliação, parou de bater no poço: ela estava
certa, o preço é que estava errado. *Medido depois, n=300: **0,69 Dragões por
partida**, contra 0,01 antes; golpes de herói no poço de 0,1 para 2,8.*

**Ultimate de dano fixo — as três que faltavam.** Julgamento, Ato Final e
Sentença não escalavam com nada e PIORAVAM ao longo da partida. `danoFixo` passa a
**ignorar armadura**: vira dano garantido, função diferente em vez de versão pior,
e o melhor golpe contra tanque. Com a mecânica distinguindo as duas,
**Julgamento 8 → 11, Ato Final 7 → 10, Sentença 6 → 10**. Medido: em 16 heróis com
dano, **zero** têm básica alcançando a Ultimate, contra alvo de 0 e de 3 de
armadura.

**Jungle: as 5 fichas saíram, entrou a ROTAÇÃO.** Antes o Caçador escolhia uma de
cinco fichas numa tela antes do primeiro turno, e a Ward revelava qual — informação
abstrata numa interface, sobre uma peça que continuava visível o tempo todo. Agora
ele gasta **uma ação** para entrar em rotação: **sai do tabuleiro**, escolhe em
segredo uma de **quatro entradas de selva** (fixas e espelhadas entre os times), e
reaparece lá **no início do seu próximo turno**, com **+2 de Força** no primeiro
golpe ofensivo. Fora do mapa ele não pode ser atacado, mas também **não segura
rota** — a onda anda sem ele. O turno inteiro fora é o que impede de parecer
teleporte. **Ward** passou a revelar **por onde ele vai sair**.
*Removidos: a fase de comando oculto antes do primeiro turno, o bônus FARM, e a
Ward que revelava ficha.*

**Prioridade** explica e pede confirmação antes de gastar a carga.
**Pular a vez da IA** salta direto para a resolução em vez de acelerar.
**Fim sem autor** (Nexus derrubado pela onda) mostra os cinco heróis do time.

**Gasto de ouro tardio**, só na base: **Reforço** (6 de ouro, +2 a cada compra do
mesmo herói → +1 de Poder permanente; o preço subindo é o que impede virar renda)
e **Requisição** (5 de ouro → 1 carta). A IA usa os dois ao fechar o inventário.

**Favicon** consertado — o SVG usava aspas duplas, a segunda fechava o `href` e o
resto vazava como texto visível acima do HUD.

### Por quê

A queixa do playtest foi "IA muito fácil, sem noção de urgência, sem avaliação,
sem estratégia" — e a causa não eram heurísticas ruins, era a ausência de
comparação. Corrigida a avaliação, ela passou a recusar o épico, o que revelou que
o preço do objetivo é que estava errado. Um conserto expôs o outro.

### O que isso quebra

- **Ultimates ficaram mais fortes** em 3 heróis, e ignorar armadura é uma regra
  nova no jogo. Não medido em playtest humano.
- **Épico muito mais barato.** Dobra a frequência de Herança e Fúria numa partida;
  o efeito no ritmo precisa de playtest.
- **Quem começa continua em desvantagem: 43,3%** (n=300). Sem compensação
  definida — ver `docs/DECISOES-PENDENTES.md` item 1.
- Partidas do agente aleatório subiram para mediana 23 rodadas.
- Quem jogava em volta do Plano de Caça precisa reaprender o Caçador do zero.

## v16 — a revisão dos nove bugs · 2026-08-12

Primeira versão depois do playtest da v15. Nove bugs relatados, cinco causas
reais. Detalhe de cada decisão que ficou em aberto: `docs/DECISOES-PENDENTES.md`.

### O que mudou

**Estrutura do repositório (nenhuma regra afetada).**
A v15 chegou como um arquivo único de 3,3 MB em `jogo/index.html`. Isso deixou
`jogo/jogo.js`, `jogo/estilo.css` e `data/catalogo.js` órfãos e defasados em ~730
linhas, quebrou `teste/empacota.js` em silêncio (não casava mais as tags, não
substituía nada e saía com código 0) e fez `sim/motor.js` medir o motor da v0.6.2
achando que media o da v15. O monolito foi desmontado de volta nas fontes.
Verificado: regerar produz arquivo idêntico ao da v15, token a token.

**Fim de partida.** `J.fim = 1 - lado` combinado com testes escritos `if(J.fim)`.
Quando o AZUL (time 0) derrubava o Nexus, `J.fim` valia **zero** — falso em
JavaScript. A partida continuava, o CARMIM jogava o turno inteiro, e se ele
derrubasse o Nexus no contragolpe levava a partida que já tinha perdido. Agora
existe porta única, `encerraPartida()`, que congela `J.fase="fim"` na hora.

**Escudo.** `esc` não expirava em lugar nenhum — só era zerado ao morrer. Muralha
do Vharn (escudo 6 + Força) empilhava até **12 por uso**, rodada após rodada, e o
herói virava intocável de fato. Agora todo efeito temporário expira no início do
próximo turno do dono.

**Duração de efeito: "até o fim da rodada" → "até o início do seu próximo
turno".** Vale para escudo, intocável, buff de Poder, buff de Armadura, Ágil e
prisão. Com a regra antiga, o escudo de quem jogava em **segundo** nascia e morria
dentro do próprio turno, sem o adversário nunca ter tido chance de bater nele.
Agora os dois lados têm exatamente um turno adversário de exposição.

**Área e o Dragão.** Os três efeitos de área (`area`, `danoVizinhos`, `danoRaio`)
liam `em()`, que só conhece herói. O Cerco do Torvald com o Dragão no hexágono
vizinho não tirava um ponto dele. Agora existe `inimigosNosHex()`, um lugar só
para "o que dá para acertar aqui", e os três passam por ele. Respingo no morador
do poço vale **1 golpe** (mesmo valor de habilidade básica).

**Torre e Nexus: trava de um golpe por rodada REMOVIDA.** Era invisível — quem
gastava o dado doado pelo Suporte para bater de novo via a ação sumir sem
explicação. O teto agora é dado na mesa e herói que ainda não agiu; o revide de
**2** continua sendo o pedágio. *Consequência de balanceamento: derrubar torre com
o time inteiro ficou mais rápido. Não medido ainda em playtest humano.*

**Escala da Ultimate: dado × 1,0 → dado × 1,5.** Medido no catálogo: em **15 dos
16** heróis que causam dano, a básica com um dado 6 batia mais que a própria
Ultimate — Nyx e Cael por 3 pontos. A causa era a fórmula, não os números: as
duas rendiam `round(Força × dano) + Poder`, e como quase toda básica e quase toda
Ultimate têm `dano:1`, davam o mesmo resultado com o mesmo dado — só que a básica
aceita qualquer dado e a Ultimate exige 5+. Nenhum número do catálogo foi mexido.
Resolve 13 dos 16; Solenne, Corvo e Cael usam `danoFixo` e continuam pendentes.

**Turnos: A C | C A → A → C → A → C.** A iniciativa alternava a cada rodada desde
a v0.5 para diluir a vantagem de quem começa, e o efeito colateral era cada
jogador jogar **dois turnos seguidos** na virada da rodada. *Consequência medida:
quem começa passou de 50,5% para **45,6%** de vitórias (n=3000, z=−4,78) — o sinal
inverteu, e quem começa agora está em desvantagem. Ver DECISOES-PENDENTES item 1.*

**Acampamento neutro: [6,4] → [6,7].** Estava a **8** da base Azul e **5** da
Carmim — três hexágonos de vantagem geográfica num objetivo neutro. Não era
design: era um número que sobreviveu ao tabuleiro crescer de 8×8 para 11×11.
Agora a posição é derivada (equidistante das bases, a mais central fora das
rotas): **7 e 7**. Os acampamentos de time ficaram em [3,4] e [7,6] — foram
medidos e já eram espelho um do outro (6 da própria base, 8 da adversária).

**Recuo.** `ef.moverReacao` somava +1 em `J.mov`, que pertence a quem está na vez
— jogada como reação, a carta **dava movimento ao adversário** e o herói não saía
do lugar. Agora destaca as casas vizinhas e anda exatamente 1, sem custo.

**Forja de Campo.** Sorteava um item e equipava sozinha; a carta era um dado
disfarçado. Agora sorteia **3** e o jogador escolhe **1**.

**Relicário / quarto slot.** `h.slots||3` estava copiado em quatro lugares. Virou
`capacidade(h)`, uma pergunta só.

**Quarto dado.** A conversão em movimento virou função com nome (`converteDado`),
a IA sabe usá-la, e existe `dadoSemUso()` para a tela avisar quando é a única
saída restante.

**IA.** Quatro heurísticas novas: `iaCompra` (compra item), `iaJogaCartas` (gasta
a mão), `iaObjetivos` (disputa o poço antes de procurar herói de passagem) e
`iaPlanejaAlcance` (converte ação em movimento para alcançar e atacar — com duas
ações e o inimigo a três casas, ela ficava parada).

**Tela de vitória.** Mostra o rosto do herói que deu o golpe final e tem saída
para o menu.

**Ferramentas.** `sim/testes.js`: 24 testes de regressão, um por sintoma
relatado. Regra nova do projeto: **bug relatado vira teste antes de virar
correção**.

### Por quê

Sete dos nove bugs vinham de cinco causas estruturais, não de sete descuidos: um
zero tratado como falso, um efeito sem prazo de validade, uma função de consulta
que só conhecia um tipo de entidade, uma trava sem feedback e um estado copiado
em quatro lugares. Corrigir a causa era mais barato que corrigir os sintomas — e
é o que o relatório de revisão pediu explicitamente.

### O que isso quebra

- **Quem começa perde 4,4 pontos de vitória.** Efeito direto da alternância
  limpa. Precisa de decisão do grupo antes de virar número final.
- **Torre cai mais rápido** com time agrupado, agora que não há trava por rodada.
  Não medido em playtest humano.
- **Ultimate ficou mais forte** em 13 heróis. É a intenção, mas desloca a curva
  de dano da partida inteira para cima.
- Escudos e buffs duram menos em termos absolutos que antes em alguns casos —
  quem jogava em primeiro perdeu um pedaço de janela que tinha de graça.
- `docs/ESTADO.md` foi atualizado; medições antigas de `patch-notes` anteriores à
  v16 foram feitas contra o motor da v0.6.2 via `sim/`, e não contra a v15.

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
