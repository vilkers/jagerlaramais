# HANDOFF — sessão de 13/08/2026 (v21 → v23)

> **Para continuar em outra janela do Claude:** cole este arquivo, ou peça para
> ele ler `docs/HANDOFF.md` no repositório. Depois dele, leia `docs/ESTADO.md`
> (retrato do presente) e `docs/DECISOES-PENDENTES.md` (o que está medido e
> esperando decisão do grupo).

**Repositório:** `vilkers/jagerlaramais` · branch `main`
**Publicado em:** https://vilkers.github.io/jagerlaramais/
**Último commit desta sessão:** `9d08364`

---

## 1. Onde o jogo estava e onde ficou

Começou na **v21** (já pronta e publicada no início da sessão) e terminou na
**v23**. Duas versões inteiras, todas medidas antes e depois.

| | v21 | v23 |
|---|---|---|
| Testes de regressão | 67 | **84** |
| Mapa visível na rodada 1 | 78 de 116 | **61 de 116** |
| Partidas fechadas pela onda | 97,3% | ver §5 |
| Duração mediana | 21 rodadas | **23** |
| Vitória de quem começa | 50,5% (1 execução) | **51,1%** (n=6000, z=1,76) |
| Barão morto (das partidas em que aparece) | 49,9% | **54,6%** |
| Gastos de ouro tardio | 3 | **4** |

---

## 2. O que foi pedido, na ordem

1. Confirmar que a v21 estava no GitHub e dar o link para mandar para o time.
2. **Lote v22** (4 itens): bônus defensivo ao lado da torre; destino para o ouro
   depois dos três itens; bug de continuar vendo inimigos no mato; layout
   quebrado no canto superior direito.
3. **Lote v23** (5 itens): sinalizar a ward no mapa; equilibrar o herói que
   defende dentro da base; escrever o status na peça (preso etc.); Barão nunca
   sai e os creeps levam o jogo; otimizar as habilidades, principalmente as de
   controle.
4. Este arquivo.

---

## 3. v22 — "o mato esconde de verdade" (commit `760f674`)

### 3.1 O mato voltou a esconder (era o bug)

**Relato:** *"continuo vendo os adversários no mato mesmo sem ter visão."*

**Medição que confirmou:** na v21, no início da partida, o time enxergava **78
dos 116** hexágonos e **47 das 70** casas fora de rota. O acampamento Carmim
nascia visível para os dois lados. Com seis torres, três ondas, a base e cinco
heróis acendendo 2 de raio cada, sobrava escuro só onde ninguém ia.

**Regra nova, uma só:** *o mato só se enxerga de dentro do mato.* Vale para toda
fonte, **inclusive a ward** — ward plantada na rota não vê o mato ao lado. Fora
do mato, raio continua raio, com os mesmos números (herói 2, torre 2, base 2,
onda 2, ward 3).

**Depois:** 61 de 116, e os três acampamentos escuros para os dois lados.

**Contrapartida:** *quem ataca fica revelado* até **sair da casa de onde bateu**.
A emboscada (+2 de Força) continua valendo, mas virou troca.

### 3.2 Bug latente encontrado no caminho

A chave do cache de visão somava `x = x*31 + termo` em `Number` comum. Com 5
heróis, 6 torres, 3 frentes e as wards, `x` passa de 1e19 antes do fim — e a
partir daí o ulp do float é maior que os termos que ainda faltam entrar.
**Mover a ward de uma casa para a vizinha dava a mesma chave**, e a visão vinha
do cache velho. Agora é inteiro de 32 bits (`Math.imul`). Existia desde a v21.

### 3.3 Defender junto da torre

**+1 de Armadura** para herói a distância ≤ 1 de torre **viva do próprio time**.
Torre inimiga não protege quem mergulha; o bônus cai com a torre.

A preocupação registrada era empilhar com o revide 2 e tornar o cerco
irracional. **A medição não confirmou:** `armtorre=0` deu 51,8% contra 52,6% do
build completo, e o ritmo não mudou (4,5 de 12 torres, mediana 21 rodadas). Por
isso o revide **continuou em 2** — mexer nos dois de uma vez seria mudar um
número sem motivo medido.

### 3.4 Sentinela — o quarto e último gasto de ouro

**4 de ouro, +2 a cada compra do mesmo herói, teto de 2 na mochila.**
Compra na base (ou morto) e vira **carga**; plantar é de graça, num botão só
(`◉ plantar ward`), sem submenu.

Foi **uma** opção e não cinco, que era o pedido. Entre os candidatos (ward,
consumível, carta, creep, re-rolagem), a ward é a única que ficou *melhor* com a
regra do mato. O consumível de cura ficou de fora por redundância: quem compra
está na base ou morto, e os dois estados já curam.

### 3.5 O canto superior direito

Era a linha de pastilhas do HUD (ouro, placas, prioridade, herança, fúria,
retomada, feitiço, visão): chega a **oito** e cabiam quatro. Sem `flex-wrap` e
sem `min-width:0`, o texto de dentro de cada pastilha quebrava em duas alturas e
a última **atravessava a borda colorida da faixa**. Agora quebra a lista, nunca o
texto. No mesmo passo os três ícones do HUD pararam de encolher — num 320 de
largura apertavam para 29px, abaixo do mínimo de toque de 40.

---

## 4. v23 — "o fim de partida volta a ser jogado" (commit `3dd1aa5`)

### 4.1 Creep não fecha mais partida com alguém defendendo

**Relato:** *"as lanes acabam empurrando... os creeps acabam levando o jogo
depois que eu levo as torres."*

**Medição que confirmou:** em 1500 partidas da v22, **97,3% terminavam com a onda
dando o golpe final**.

**Regra (última muralha):** com o Nexus em **1**, a onda só passa se **não houver
herói inimigo a 1 de distância do Nexus**. Base abandonada continua caindo
sozinha; base defendida exige matar o defensor.

**Tentativa que falhou primeiro:** um piso duro — a onda para em 1, sempre. Sem
ninguém obrigado a ir fechar, **1200 partidas não terminaram nenhuma**. A regra
que ficou não pode empacar por construção.

**A IA aprendeu a defender junto:** com o Nexus em 1 e uma rota aberta, ela manda
**um** herói (o mais perto de casa) segurar a base. Sem isso a regra existiria só
para o humano.

### 4.2 Respawn cresce com a partida

**Relato:** *"o herói dentro da base é curado... tem que fazer alguma coisa para
ele não ficar dentro da base se curando e lutando."*

**Achado:** não existe cura de base neste jogo. O que devolve vida cheia é o
**respawn**, a uma casa do Nexus — e custava 2 rodadas do começo ao fim.

| Rodada em que morreu | Volta em |
|---|---|
| 1 a 8 | 2 rodadas |
| 9 a 16 | 3 rodadas |
| 17 em diante | 4 rodadas |

### 4.3 A habilidade do meio paga o próprio dado

**Relato:** *"otimiza as habilidades dos heróis, ainda mais algumas de
controle."*

Virou instrumento: **`sim/habs.js`** compara cada habilidade com a **básica do
próprio herói**, com o mesmo dado, convertendo tudo em pontos de vida.

**Achado:** Provocar, Puxada, Puxada Funda e Emaranhar davam **exatamente o mesmo
dano da básica** — só que a básica sai com qualquer dado e elas exigem 3+.

| Mudança | De | Para | Por quê |
|---|---|---|---|
| Escala do slot do meio | ×1 | **×1,2** | +1 em todo dado de 3 a 6. Com ×1,15 o arredondamento comia o bônus no dado 3 |
| **Caçada** (Nyx, Ultimate) | `dano 1` | `dano 1 · +3 · executa 6` | Era **pior que a própria básica** |
| **Recarregar** (Vesper, Corvo) | recarga 4 | **6** | Guardar +4 rendia menos que bater |
| **Eco** (Zhet) e **Rastro** (Kurr) | só `marca 4` | `dano 1 · marca 4` | Marcar sem bater é guardar valor que só paga se um segundo golpe acertar |

Ultimate segue **×1,25** e continua sendo o pico.

**Ficaram abaixo da régua de propósito:** *Doar Dado* (Mirrha) e *Empréstimo*
(Vidra) aparecem em −10 porque devolvem uma **ação inteira** a um aliado, e ação
não cabe em ponto de vida. *Sombra* (Nyx) e *Investir* (Xhera) valem o que a
situação valer.

### 4.4 Tela

**Ward:** as casas dentro do alcance ganham **borda tracejada**; recém-plantada,
o olho pulsa. *A primeira versão desenhava um anel de raio 3 e quebrou a tela: o
`viewBox` é recalculado por `getBBox()`, então um círculo de ~100px num tabuleiro
de 300 inflava a caixa e **encolhia o mapa inteiro**.*

**Estado escrito na peça:** `PRESO`, `INTOCÁVEL`, `MARCADO`, `CARREGADO`,
`SEM CURA` e — só para o dono da peça — `ESCONDIDO` / `REVELADO`. **Uma** por
peça, a de maior consequência primeiro: em peça de 19px, três etiquetas não são
três informações, são zero. A gaveta do Time passou a mostrar os números
(`marcado +4`, `carregado +6`).

---

## 5. Todas as medições da sessão

**Vitória de quem começa** (n=2000 por execução, três execuções):

| Build | Execuções | Somado |
|---|---|---|
| v22 | 52,6% · 51,6% · 49,6% | 51,3% (z=2,0) |
| **v23** | 50,7% · 51,6% · 51,0% | **51,1% (z=1,76, dentro do ruído)** |

**Isolando cada regra da v22** (n=2000 cada, uma de cada vez):

| Variante | quem começa |
|---|---|
| build v22 completo | 52,6% |
| `armtorre=0` (sem armadura de torre) | 51,8% |
| `revelar=off` (atacar não revela) | 51,6% |
| `passo1=0` (sem o Primeiro Passo) | 51,9% |
| **`mato=off`** (mato não bloqueia) | **50,4%** |

**Épicos** (`sim/epicos.js`, n=1500):

| | v22 | v23 |
|---|---|---|
| Dragão morto | 20,7% | 21,9% |
| Barão morto | 49,9% | **54,6%** |
| Vitória de quem leva o Barão | 48,8% | **52,3%** |

**Ponto importante e honesto sobre os 97,3%:** com a última muralha a bateria
mede **94,8%**, e a queda pequena **não mede a regra — mede o agente**. O agente
da bateria é quase aleatório e **não defende a própria base**, então a regra
quase nunca dispara para ele. Em partida de gente, quem está perdendo defende.

---

## 6. Erros que eu cometi nesta sessão (registrados de propósito)

1. **Anel da ward quebrou o mapa** — `getBBox()` inflado pelo círculo de raio 3.
   Trocado por marcação nos hexágonos.
2. **Piso duro da onda travou a partida** — 1200 partidas, zero terminadas.
   Trocado pela regra condicional (só com defensor).
3. **Li ruído como sinal** — a n=1200 o build v23 deu 53,8% e a variante 49,9%, e
   quase concluí que o respawn desequilibrava. A n=2000 os dois deram 51%. A
   lição já estava escrita no próprio projeto e eu repeti o erro.
4. **Heurística de ward da IA nunca disparava** — condicionei a plantar "onde não
   enxergo", mas herói parado no mato já acende 2 de raio à própria volta.
   Resultado: 19 Sentinelas compradas e zero plantadas. Corrigido para cobertura
   (planta se não houver ward dela por perto).

---

## 7. O que ficou aberto

**Para o playtest de vocês três (não é decisão minha):**

- **O fim de partida pode arrastar.** As duas regras novas da v23 puxam para o
  mesmo lado. Nas simulações o Nexus fica em 1 por no máximo 1 rodada, mas
  simulação não é a mesa. Se arrastar, o ajuste é o tempo de respawn, e a
  medição antes/depois já está montada (`respawn=fixo`).
- **O Dragão continua caro** — 22% de fechamento, e `sim/epicos.js` segue
  imprimindo *"muito tentado e pouco fechado"*. Não foi mexido na v23 de
  propósito: três regras novas no mesmo lote já bastam, e mexer nele junto
  tornaria impossível dizer de quem é qualquer efeito medido depois. **É o
  próximo número a testar sozinho** (`vdragao=` e `revide=off` já existem).
- **A renda de ouro nunca para** — 3 por herói por rodada só de não agir. Quatro
  gastos não resolvem torneira aberta. Se ainda sobrar montanha de ouro, o
  ajuste é na renda, não num quinto gasto.
- **Cartas de reação não têm janela** — 3 cartas declaram `quando:"reacao"` e o
  motor nunca lê esse campo. Três opções estão descritas em
  `docs/DECISOES-PENDENTES.md`, item 4.
- **Torre e acampamento aparecem através da névoa** — onde eles ficam não é
  segredo, mas a vida da torre e o respawn do acampamento vazam. Item 9 do
  mesmo arquivo, com as duas opções.

---

## 8. Como o projeto trabalha (leia antes de mexer em número)

- **`data/catalogo.js` é a fonte de verdade** de heróis, itens e deck.
  `jogo/`, `guia/` e `cartas/` leem daí. Nunca escreva carta direto no HTML.
- **Bug relatado vira teste ANTES de virar correção.** Se o teste não falha antes
  do conserto, ele não está testando o bug.
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`.
- **Nada de mudança silenciosa de balanceamento.**
- **Uma mudança de cada vez** quando for medir — senão o número não tem endereço.
- **A bateria é cega para agência.** Ela mede bem estrutura (mapa, torre, onda,
  ritmo) e **não** mede escolha (épico, Retomada, Prioridade, Placas, itens,
  cartas, névoa). Não afine mecânica de decisão contra ela.
- **`quem começa` precisa de n ≥ 2000 por execução, rodado duas ou três vezes.**
  Uma execução isolada não distingue 51% de 53%.
- **`visual-lab/` não é o guia** — é a área de criação do Vilker com o ChatGPT,
  tem stack própria e **não deve ser apagada** pela regra do "vanilla".

### Comandos

```
node sim/testes.js        # 84 testes de regressão
node sim/bateria.js 2000  # medição estrutural (mapa, torre, onda, ordem)
node sim/epicos.js 1500   # Dragão e Barão
node sim/habs.js          # cada habilidade contra a básica do próprio herói
node teste/empacota.js    # regera teste/JOGAR.html (arquivo único, offline)
```

Variantes da bateria criadas nesta sessão:
`armtorre=` `mato=off` `revelar=off` `passo1=` `muralha=off` `respawn=fixo`

### Onde as coisas moram

```
jogo/jogo.js        motor de regras + interface (~3.700 linhas)
jogo/estilo.css     TODA a aparência — mexer aqui não quebra regra
data/catalogo.js    heróis, itens, deck, classes, textoHab()
sim/                motor.js (harness) · testes.js · bateria.js · epicos.js · habs.js
docs/ESTADO.md      retrato do presente — leia primeiro
docs/REGRAS.md      regras completas, extraídas do motor
docs/patch-notes.md histórico, append-only
docs/DECISOES-PENDENTES.md   medido e não decidido
```

---

## 9. Commits desta sessão

| Commit | O quê |
|---|---|
| `3d635c1` | v21 — visão por fontes, fim do hitkill (já pronta no início) |
| `760f674` | **v22** — mato bloqueia visão, armadura de torre, Sentinela, HUD |
| `3b1cf5d` | regera JOGAR.html (v22) |
| `3dd1aa5` | **v23** — última muralha, respawn crescente, escala de controle, ward e status na tela |
| `9d08364` | regera JOGAR.html (v23) |
