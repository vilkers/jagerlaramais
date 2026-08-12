# DECISÕES PENDENTES — o que a v16 mediu e não decidiu

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

Quem começa agora **perde** 4,4 pontos. O resultado é estatisticamente forte
(z=−4,78), não ruído.

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

- **a)** não compensar — 45,6% pode ser aceitável, e quem escolhe começar passa
  a ser uma decisão de draft em vez de um presente;
- **b)** trocar a ordem: quem **não** escolheu o lado começa;
- **c)** dar ao primeiro jogador +1 de movimento na rodada 1 apenas;
- **d)** voltar a alternar a iniciativa — desfaz a correção de leitura da PARTE 2.

`sim/bateria.js` já aceita `comp=N` (ouro extra por herói). Hoje ele beneficia o
**segundo**; medir a opção certa exige inverter o alvo dessa variante — uma
linha.

---

## 2. Três Ultimates continuam piores que a própria básica

A fórmula foi corrigida na v16: a Ultimate converte o dado em **1,5×**. Isso
resolveu 13 dos 16 heróis que causam dano.

Sobraram três, e o motivo é que suas Ultimates usam `danoFixo`, que ignora o
dado **e** o Poder do herói:

| Herói | Básica com dado 6 | Ultimate | Diferença |
|---|---|---|---|
| Solenne | 9 (Feixe) | 8 (Julgamento, F6, `danoFixo:8`) | −1 |
| Corvo | 9 (Tiro Marcado) | 7 (Ato Final, F5, `danoFixo:7`) | −2 |
| Cael | 9 (Cobrança) | 6 (Sentença, F5, `danoFixo:6`) | −3 |

Pior: como `danoFixo` ignora o Poder, essas três **pioram ao longo da partida** —
itens e Herança do Dragão sobem a básica e não sobem a Ultimate.

Não mexi nos números porque trocar o dano de três heróis é balanceamento, não
correção de fórmula, e o relatório pede para não fazer mudança silenciosa de
balanceamento. Opções:

- **a)** `danoFixo` vira **piso**, não valor fixo: a Ultimate causa o maior entre
  o número fixo e a fórmula normal. Uma linha, resolve os três de vez, mas
  aproxima as três de "só mais dano" e apaga a identidade de rajada;
- **b)** `danoFixo` passa a **ignorar armadura**. Aí ela é mesmo uma função
  diferente ("dano garantido") em vez de uma versão pior — mais fiel à fantasia,
  e mais forte contra tanque, que é onde ela deveria brilhar;
- **c)** subir os três números no catálogo (8→12, 7→11, 6→11) e deixar a
  mecânica como está.

**Recomendo (b).** É a que dá à Ultimate um papel próprio em vez de um número
maior, que é literalmente o que a PARTE 9 do relatório pediu.

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

## 5. Gasto de ouro no fim da partida (PARTE 6 / Fase 5)

Encanamento pronto, regra não escolhida — como o relatório pediu.

Em `jogo/jogo.js` existe a lista `GASTOS`, hoje **vazia**. Enquanto estiver
vazia, nada muda no jogo e a prateleira nem aparece na loja. Cada entrada tem a
forma:

```js
{id:"cura", n:"Bandagem", o:3, d:"Cura 4 agora.",
 pode:h => h.vida < h.vidaMax, faz:h => { h.vida = Math.min(h.vidaMax, h.vida+4); }}
```

`pode` decide se o botão fica ativo, `faz` aplica o efeito. Preço, botão, log e
registro já funcionam.

Candidatos discutidos, em ordem de "menos regra nova":

| Gasto | Preço sugerido | Por que é bom | Risco |
|---|---|---|---|
| Cura na base | 3 | usa conceito que já existe | pouco interessante |
| Ward | 4 | vira decisão de mapa | depende da PARTE 9 (visão) |
| Re-rolar um dado | 4 | ataca o azar direto, decisão clara | pode virar compra obrigatória |
| Comprar uma carta | 5 | reaproveita o Deck de Comando inteiro | mão máxima 3 limita |

**Recomendo escolher no máximo dois**, e que um deles seja o de re-rolar: é o
único que transforma ouro em **agência** em vez de em estatística.

---

## 6. Jungle e visão (PARTES 7, 8 e 9) — proposta, nada implementado

O relatório foi explícito: *"Não implementar uma reformulação grande sem validar
primeiro a proposta."* Então aqui está só a proposta.

### O que existe hoje

O Caçador escolhe secretamente uma de 5 fichas (TOPO/MEIO/BAIXO/FARM). Na
revelação, se ele **chegou** à rota declarada, ganha +2 de Força na próxima
habilidade ofensiva. Ward revela qual ficha o adversário escolheu.

O problema é que a informação é abstrata: o jogador descobre uma **decisão numa
interface**, não uma **posição no mapa**. E o Caçador nunca some de verdade — a
peça dele está lá, visível, o tempo todo.

### Proposta: "em rotação"

Uma mecânica, não cinco:

1. No seu turno, o Caçador pode gastar **uma ação** para entrar **em rotação**.
   A peça sai do mapa e vira um marcador na sua base — o adversário vê que ele
   está em rotação, mas não para onde.
2. Você escolhe secretamente **uma entrada de selva** (são poucas e fixas — 4 no
   mapa atual, uma por quadrante).
3. **Ele reaparece no seu próximo turno**, naquela entrada. Um turno inteiro de
   ausência é o custo, e é o que impede que pareça teleporte: ninguém atravessa o
   mapa de graça, ele atravessa gastando tempo.
4. Se a entrada escolhida estiver **sob visão inimiga** quando ele chegar, a
   chegada é revelada antes de ele agir.

Isso preserva o que era bom ("onde está o Jungle?"), remove a ficha abstrata, e o
deslocamento tem custo, tempo e um contra-jogo — a Ward.

### Visão: o mínimo que funciona no 11×11

O mapa é compacto, então visão por lane inteira não serve (quase sempre há
alguém em cada lane e a névoa nunca faria nada). Proposta em raios pequenos:

| Fonte | Raio | Motivo |
|---|---|---|
| Herói | 2 | enxerga o vizinho do vizinho — o suficiente para não andar cego |
| Torre viva | 2 | é o que cria a "área segura" atrás dela |
| Ward | 3 | tem que valer mais que um herói parado, senão ninguém posta |
| Acampamento seu | 1 | migalha de informação, mas justifica passar lá |

Mais a regra que a revisão já propôs: **atrás da sua torre exterior, na sua
metade, visão total** — território controlado não se vigia.

**Custo real de implementar:** o motor hoje desenha tudo sempre. Névoa exige uma
camada de visibilidade em `desenhaMapa`, e a IA precisa decidir se joga com
informação completa (trapaça) ou limitada (mais trabalho, mais justo). **Estimo
que seja a maior mudança de todas as pendentes** — maior que todas as correções
da v16 somadas. Vale fazer, mas como versão própria, não junto de outra coisa.

**Ordem sugerida:** rotação do Jungle primeiro (barata, resolve a fantasia), e
só depois visão — porque a rotação já melhora sozinha, e a visão fica muito
melhor se a rotação já existir para ela interagir.

---

## 7. Dragão e Barão criam dilema? (PARTE 12)

**Não dá para responder com a bateria atual**, e é honesto dizer isso em vez de
inventar um número.

Medido em 3000 partidas: **0,01 Dragões e 0 Barões por partida**. O agente
aleatório simplesmente nunca derruba o poço. Isso não quer dizer que o objetivo
seja fraco — quer dizer que o instrumento não alcança essa pergunta, exatamente
como o cabeçalho de `sim/bateria.js` já avisava para épico, Retomada e itens.

A v16 melhorou um lado disso: a IA agora **procura** o épico (`iaObjetivos`), o
que faz do modo contra IA um instrumento melhor que a bateria para esta pergunta.
A resposta real vem de playtest humano, com a pergunta certa na mão: *"você
largou a pressão de torre para disputar? por quê?"*

---

## 8. Itens que mudam comportamento (PARTE 17.3)

Não implementado — é ideia futura, e concordo com a priorização do relatório.

Registro só o achado técnico: o motor **já suporta** quase tudo que a seção pede.
`bonus(h,campo)` soma qualquer campo de item, e há ganchos naturais em
`aplicaDano` (depois de sofrer dano), `moveAte` (ao andar) e `expiraDoTime`
(primeiro golpe da rodada). Um item do tipo "primeiro ataque da rodada causa +1"
custa um contador por herói e três linhas. Quando o grupo quiser, é barato.
