# MATCHUPS — a rede de anti-picks (PROPOSTA, esperando aprovação)

> **Este arquivo é a tabela que o pedido mandou apresentar ANTES de mexer nos
> kits.** Nada aqui está implementado. O gancho existe e está vazio de
> propósito: `draftContra(id, timeDeles)` em `jogo/jogo.js` devolve `0` até
> vocês aprovarem esta rede.
>
> **A notícia boa:** nenhuma das 40 linhas abaixo exige mudar habilidade
> nenhuma. Todas saem dos kits que já estão em `data/catalogo.js` — foi o
> critério de construção, e é o que §20 pediu: *"quero que os matchups surjam
> principalmente das habilidades"*.

---

## A regra que guiou a construção

§19 do pedido foi explícito sobre o que **não** fazer:

> Não quero resolver isso simplesmente escrevendo: *Vovó causa +2 de dano contra
> Pombo*. Isso é artificial e pouco interessante.

Então nenhuma linha desta tabela é um número contra um nome. Cada uma é uma
frase do tipo:

> **a mecânica de A responde à condição de que a mecânica de B depende.**

Quando o counter é bom, ele não diz "você perde". Ele diz: *"a sua jogada
principal custa mais caro contra mim"*. É **vantagem**, não vitória automática
(§22) — em todas as linhas o lado desfavorecido tem uma saída escrita na coluna
**Como sair**.

---

## O exemplo que o pedido pediu: DONA CHINELA × POMBO CIBORGUE

O Pombo tem três engrenagens, e **duas delas têm um pré-requisito espacial**:

| Engrenagem | Pré-requisito |
|---|---|
| ✦ Voo Silencioso — fica Invisível no início do turno dele | **nenhum inimigo colado** |
| Bicada — **CRÍTICO** (1,5×) | o alvo **sem aliado a 2 casas** |
| Rasante Final — executa com 6 ou menos | ter atacado **estando Invisível** |

A Dona Chinela não tem nada escrito sobre invisibilidade. Ela tem outra coisa:
**ela gruda e ela sangra.**

1. **Puxão de Orelha puxa o alvo 1 casa na direção dela.** Um herói colado nela
   no início do turno do Pombo **desliga o Voo Silencioso** — o pré-requisito da
   passiva é literalmente "nenhum inimigo colado". Ela não revela: ela impede de
   sumir, que é a mesma consequência por outro caminho.
2. **Todo golpe dela deixa Sangramento** (passiva ✦ Chinelada), e Sangramento
   **ignora armadura e escudo**. O Pombo tem **1 de Armadura**, a menor do jogo
   junto com quatro colegas: a defesa dele nunca foi a armadura, foi não estar
   lá. Contra ela, não estar lá é o que para de funcionar.
3. **Chinelo Voador executa com 5 de vida ou menos, e o limiar sobe +3 por
   acúmulo de Sangramento.** Com 3 acúmulos, executa com **14** — de uma barra
   de **18**. O herói mais frágil do jogo é o alvo em que a execução dela cobre
   a maior fatia da vida.

**Por que não é vitória automática:** o Pombo escolhe *quando* a briga começa —
ele tem **movimento máximo 5** contra os **4** dela, e ela não tem
absolutamente nenhuma mobilidade. Se ele recuar, o Sangramento **cai 1 acúmulo
por turno** e o limiar da execução desce junto. O matchup é *"ele não pode
brigar com ela; ele pode escolher não brigar"*, que é exatamente o que um
counter saudável faz com um assassino.

---

## A TABELA

**Como ler:** cada linha é um herói. **Bom contra** é vantagem, não vitória.
Todas as justificativas apontam para regra que já existe no motor.

### TOPO · A Ilha

| Herói | Bom contra | Por quê (mecânica) | Ruim contra | Por quê (mecânica) |
|---|---|---|---|---|
| **O Taxista** | **Pyk** | O plano do Pyk é *puxar 3 casas e executar com 7 (+4 marcado = 11)*. O Taxista tem **25 de vida**, a maior do jogo com o Caramêlo: o limiar nunca chega perto. E a Ultimate dele dá **Tenacidade por 2 turnos**, que anula a Lentidão da Puxada Funda — o Pyk puxa e o alvo continua com ação | **Ilva** | Alcance 1 e **movimento máximo 3**, o menor do jogo. Contra alcance 2 que envenena adjacentes (✦ Miasma), ele passa o jogo tomando dano por estar onde precisa estar |
| | **Zhet** | A Zhet é **alcance 1**: para bater nele, ela fica colada. ✦ Ponto de Ônibus deixa **Lento todo inimigo colado no início do turno dele**, e Lentidão **mata o passo grátis de Ágil** — que é metade da mobilidade dela. A Buzina Infernal **atordoa e puxa 1**, e ela volta para dentro do alcance de todo mundo | **Cael** | ✦ Juros dá **Crítico contra alvo Preso, Atordoado ou Lento**. A Armadilha é uma zona de Lentidão de raio 1, e um herói de **movimento máximo 3** é o que menos consegue sair de uma zona |
| | | | **Corvo** | Ato Final é **perfurante — ignora a Armadura**. Os 3 de Armadura dele, que é o que o mantém de pé, simplesmente não entram na conta |
| **Dona Chinela** | **Pombo Ciborgue** | Ver a seção acima | **Ilva** | Ela precisa encostar; ✦ Miasma envenena quem encosta. Sem mobilidade nenhuma, ela paga o pedágio todo turno |
| | **Xhera** | O motor da Xhera é **curar 2 ao causar dano, e 4 abaixo da metade**. Sangramento **ignora escudo e armadura** e cobra no **início do turno da vítima** — ou seja, cobra fora do turno em que ela cura. E o Chinelo Voador **executa mais alto quanto mais acúmulos**: a Xhera passa a partida inteira de propósito abaixo da metade da vida, que é exatamente a faixa em que a execução mora | **Emerson Emo** | *Empresta o Fone* **limpa 1 condição** do aliado. Limpar o Sangramento não tira só o dano: derruba o **limiar da execução** de volta para 5 |
| **Ilva** | **O Taxista** | Ver acima | **Grumo** | *Digerir* **limpa TODAS as condições dele mesmo** e cura 7. O Veneno é o kit inteiro da Ilva, e a Ceifa perde o **+4** contra alvo envenenado |
| | **Dona Chinela** | Mesma razão: a Chinela é alcance 1 e sem mobilidade, e a Ilva é alcance 2 com dano que ignora a aproximação | **Gari Mago** | *Varrida Purificadora* **limpa 1 condição de cada aliado adjacente** — e o Gari faz isso **enquanto causa dano**, sem gastar o turno em limpeza |
| **Xhera** | **Zé Griteco** | *Investir* dá **+3 e puxa o alvo 1 casa**: ela fecha a distância que o Zé precisa manter. E ✦ Pulmão de Aço **zera ao trocar de alvo** — em cima dele, a rampa dele nunca começa | **Dona Chinela** | Ver acima |
| | **Parabólica Diabólica** | 18 de vida e 1 de Armadura contra uma lutadora que **cura o que causa** e ganha **+2 de Poder abaixo da metade**. A Parabólica precisa de distância e não tem como criá-la | **Cael** | A Armadilha a deixa Lenta antes de ela chegar, e Lento é o gatilho do Crítico dele |

### SELVA · O Caçador

| Herói | Bom contra | Por quê (mecânica) | Ruim contra | Por quê (mecânica) |
|---|---|---|---|---|
| **Pombo Ciborgue** | **Gari Mago** | 18 de vida, 1 de Armadura, alcance 3 e **o único herói do meio que precisa ficar perto dos aliados para limpar** — mas a Bicada **crita em alvo sem aliado a 2 casas**. Ou ele fica colado no time e não alcança nada, ou fica sozinho e leva Crítico | **Dona Chinela** | Ver acima |
| | **Emerson Emo** | Poder 2, 20 de vida, nenhum dano. A Rasante Final **executa com 6 ou menos** e **crita se ele atacou estando Invisível**. Matar o suporte é a jogada, e contra este suporte ela sai barata | **Vidra** | ✦ Vidência **revela o inimigo escondido mais próximo (até 4 casas) no início do turno dela**, todo turno, de graça. Revelado vence a Invisibilidade em qualquer lugar |
| **Grumo** | **Ilva** | *Digerir* limpa tudo. Ver acima | **Valti** | O Coco na Cabeça **atordoa só quem está dentro de uma zona dele**, e o Grumo tem **movimento máximo 3**: é o herói que menos consegue sair das cascas. Digerir limpa a Lentidão, mas custa a ação do turno |
| | **Catarino** | ✦ Marca do Catarino conta de três em três, e *Digerir* **limpa todas as condições ruins** — inclusive a Marca, que é `limpavel`. O cilindro nunca estoura, e o limiar da Crise Alérgica não sobe | **Zé Griteco** | ✦ Pulmão de Aço soma **+2 por golpe seguido no MESMO alvo**. Um tanque de alcance 1 e movimento máximo 3 é o alvo que menos consegue sair — a rampa acontece inteira nele |
| **Valti** | **Zhet** | A Zhet é alcance 1: para agir, ela vem. O *Talho de Facão* deixa uma **zona de Lentidão de raio 1**, e ela chega dentro dela; Lentidão tira o passo grátis de Ágil. O Coco então **atordoa, porque o alvo está na zona** | **Gari Mago** | *Varrida* limpa a Lentidão das cascas dos aliados adjacentes, e sem a zona ativa o Coco vira só dano |
| | **Grumo** | Ver acima | **Emerson Emo** | Mesma coisa: *Empresta o Fone* limpa a condição que é pré-requisito do Coco |
| **Pyk** | **Catarino** | *Puxada Funda* **puxa 3 casas com alcance +2**: tira o atirador de 18 de vida de trás do time e o põe no meio do seu. A Cova executa com **7, e 11 se estiver Marcado** — 11 de 18 | **O Taxista** | Ver acima |
| | **Corvo** | Idêntico, e pior para o Corvo: ele precisa de **quatro golpes seguidos** para o Crítico, e a Puxada reinicia a posição dele toda vez | **Torvald** | ✦ Almas na Lanterna dá **+1 de Armadura permanente por morte a até 3 casas, até +5**. Contra um Pyk que mata para viver, o Torvald **engorda com o sucesso do adversário**, e a Cova nunca alcança o limiar |

### MEIO · O Relógio

| Herói | Bom contra | Por quê (mecânica) | Ruim contra | Por quê (mecânica) |
|---|---|---|---|---|
| **Parabólica Diabólica** | **Arden** | *Interferência* aplica **Silenciado**, e Silenciado **tranca a segunda e a Ultimate**. O Arden inteiro é o *Tribunal*: sem Ultimate, os Autos que ele passou a partida juntando não saem | **Xhera** | Ver acima |
| | **Emerson Emo** | Mesma tranca: *Ninguém Me Entende* é o que ressuscita e dá Tenacidade. Silenciado, o Emo vira um escudo pequeno | **Caramêlo 2.0** | *Escudo de Pelo* dá **Tenacidade**, e Tenacidade **anula a próxima Lentidão, Atordoamento, Silêncio ou Prisão**. O Silêncio dela é gasto no escudo e não chega no alvo |
| **Zhet** | **Caramêlo 2.0** | ✦ Guarda-Corpo protege **aliado colado nele**. *Eco* **troca de lugar com o alvo** — ela pega o protegido e o põe do outro lado do tabuleiro, longe do corpo que o protegia. É o counter mais direto do jogo: ela não fura a proteção, ela desfaz a adjacência | **O Taxista** | Ver acima |
| | **Vidra** | 18 de vida, Poder 2, alcance 3 e nenhum escape. *Eco* chega, marca ×4 e o *Trio de Sombras* fecha; e a Zhet **sai do tabuleiro** no fim (Banimento em si mesma), então nem a resposta chega | **Valti** | Ver acima |
| **Gari Mago** | **Ilva** | *Varrida* limpa condição de cada aliado adjacente **enquanto causa dano** — ele desmonta o Veneno sem gastar o turno nisso | **Pombo Ciborgue** | Ver acima |
| | **Valti** | Mesma limpeza, contra a Lentidão que é pré-requisito do Coco | | *(só um counter — ver "O que está desequilibrado", abaixo)* |
| **Arden** | **Zé Griteco** | ✦ Jurisprudência **guarda a última habilidade inimiga que o acertou**. O Zé é o herói que mais repete a MESMA habilidade no MESMO alvo — ele alimenta os Autos todo turno, e o *Tribunal* devolve com o Poder do Arden | **Parabólica Diabólica** | Ver acima |
| | **Corvo** | Mesma coisa: o Corvo precisa de quatro golpes seguidos, e cada um deles entra nos Autos | **Catarino** | ✦ Marca do Catarino **ignora armadura e escudo**, e o Arden é o mago que se defende com 2 de Armadura e cura. Além disso, **Ultimate nunca entra nos Autos**: a Crise Alérgica é literalmente a habilidade que ele não consegue copiar |

### ATIRADOR · O Investimento

| Herói | Bom contra | Por quê (mecânica) | Ruim contra | Por quê (mecânica) |
|---|---|---|---|---|
| **Zé Griteco** | **Grumo** | Ver acima | **Xhera** | Ver acima |
| | **Torvald** | Mesma lógica do Grumo: alcance 1, movimento máximo 3, e a Armadura dele **não protege contra o crescimento do Fôlego**, que soma dano fixo por golpe seguido | **Arden** | Ver acima |
| **Cael** | **O Taxista** | Ver acima | **Caramêlo 2.0** | Tenacidade **anula a Lentidão**, e sem Lentidão o ✦ Juros não crita. O counter dele é uma condição que existe para isso |
| | **Xhera** | Ver acima | **Vidra** | *Vento Contrário* dá **Tenacidade** e **empurra 1 casa todo inimigo colado no aliado** — tira o alvo da zona da Armadilha antes de o turno virar |
| **Catarino** | **Torvald** | ✦ Marca **ignora armadura e escudo**. O Torvald é o herói cuja identidade é **Armadura que cresce até +5** — é o alvo em que a Marca economiza mais | **Grumo** | Ver acima |
| | **Arden** | Ver acima | **Pyk** | Ver acima |
| **Corvo** | **Torvald** | *Ato Final* é **perfurante e sempre Crítico**. Contra o herói mais blindado do jogo, os dois efeitos se somam no mesmo lugar | **Pyk** | Ver acima |
| | **O Taxista** | Mesma razão | **Arden** | Ver acima |

### SUPORTE · A Memória

| Herói | Bom contra | Por quê (mecânica) | Ruim contra | Por quê (mecânica) |
|---|---|---|---|---|
| **Emerson Emo** | **Dona Chinela** | Ver acima | **Pombo Ciborgue** | Ver acima |
| | **Valti** | Ver acima | **Parabólica Diabólica** | Ver acima |
| **Torvald** | **Pyk** | Ver acima | **Zé Griteco** | Ver acima |
| | **Vidra** | *Gancho* **puxa 3 casas com alcance +2** — é o maior arrasto do jogo, e a Vidra é o herói que menos sobrevive fora de posição (18 de vida, Poder 2). *Cerco* ainda **prende** | **Catarino** | Ver acima |
| | | | **Corvo** | Ver acima |
| **Caramêlo 2.0** | **Cael** | Ver acima | **Zhet** | Ver acima |
| | **Parabólica Diabólica** | ✦ Guarda-Corpo tira **2 de cada golpe** que o aliado colado sofre, e a Parabólica bate várias vezes pequeno: proporcionalmente, é dela que a redução tira mais. Somado à Tenacidade que anula o Silêncio | | *(só um counter — ver abaixo)* |
| **Vidra** | **Pombo Ciborgue** | Ver acima | **Zhet** | Ver acima |
| | **Cael** | Ver acima | **Torvald** | Ver acima |

---

## A rede, resumida

40 arestas, 2 por herói. Quantas vezes cada um **é** counterado:

| Counterado 3× | Counterado 2× | Counterado 1× |
|---|---|---|
| O Taxista · Torvald | os outros dezesseis | Gari Mago · Caramêlo 2.0 |

**Ciclos, que é o que §23 pediu.** Dois exemplos que fecham:

```
Ilva → Taxista → Zhet → Caramêlo → Parabólica → Emerson Emo → Dona Chinela
     → Pombo → Gari Mago → Ilva

Cael → Xhera → Zé Griteco → Torvald → Vidra → Cael
```

Ninguém countera cinco. Ninguém está fora da rede.

### O que está desequilibrado, e por quê

- **O Taxista e o Torvald levam 3 counters cada.** Não é acidente e talvez não
  seja defeito: os dois se defendem com **Armadura**, e o jogo tem **três
  respostas mecânicas a Armadura** — perfurante (Corvo, Cael, Parabólica), a
  Marca do Catarino (ignora armadura e escudo) e o Veneno/Sangramento (ignoram
  as duas). Quem escolhe Armadura como defesa escolhe o eixo mais respondido.
  Se na mesa parecer punição demais, a alavanca é **espalhar a resposta**, não
  enfraquecer as respostas.
- **O Gari Mago e o Caramêlo levam 1.** São os dois heróis cuja função é
  *desfazer* o que o adversário fez (limpeza e redução de dano), e desfazer é
  difícil de counterar sem escrever exceção. As alavancas, se vocês quiserem
  empatar a rede:
  - **Gari Mago** — a *Varrida* limpa **cada aliado adjacente**. Restringir a
    **um aliado** faria dele um alvo de posicionamento, e abriria counter para
    quem separa time (Zhet, Torvald, Caramêlo);
  - **Caramêlo 2.0** — ✦ Guarda-Corpo vale contra **qualquer dano**. Limitar a
    **dano de herói** (deixando passar Veneno, Sangramento e zona) abriria
    counter para Ilva e Valti.

  **Nenhuma das duas está implementada.** As duas são mudança de kit e portanto
  precisam da aprovação de vocês (§59).

---

## O que falta para isto virar regra

1. **Vocês aprovarem a tabela**, linha a linha ou em bloco.
2. **Nada de motor.** Repetindo, porque é a parte que costuma assustar: as 40
   linhas **funcionam com os kits atuais**. Não há habilidade para reescrever,
   número para mexer nem exceção para criar. O que a aprovação libera é a
   **terceira parcela da nota do draft da IA**:

   ```js
   /* jogo/jogo.js — hoje devolve 0 */
   function draftContra(id, timeDeles){ ... }
   ```

   Com a rede aprovada, ela vira uma tabela `id → [ids que ele responde]` em
   `data/catalogo.js` (fonte de verdade, como manda o CLAUDE.md) e a IA passa a
   **subir a prioridade** de um counter sem nunca escolhê-lo automaticamente —
   §25 é explícito: função, composição, sinergia, ban, força e variação
   continuam pesando junto.
3. **Opcional, e só se vocês quiserem:** os dois ajustes de kit da seção acima,
   para o Gari e o Caramêlo entrarem na rede como alvos.

---

## O que NÃO entrou, e por quê

- **Bônus numérico contra herói específico.** §19 proibiu, e com razão: é
  invisível na mesa e não cria contrajogo, só uma tabela para decorar.
- **Counter absoluto.** Toda linha tem saída. O Pombo pode não brigar com a
  Chinela; o Grumo pode gastar o *Digerir* e ficar sem ação; a Zhet pode trocar
  de lugar com outro alvo. Vantagem é *"a minha jogada principal fica mais
  cara"*, nunca *"não dá para jogar"* (§22).
- **Counter por rota.** A rede atravessa rotas de propósito: dez das quarenta
  linhas ligam heróis que nunca se encontrariam se cada um ficasse na própria
  faixa. É o que dá sentido a rotacionar, e é onde o Caçador e a opção
  **Continuar onde está** ganham peso.
