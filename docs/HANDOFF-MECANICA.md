# HANDOFF — MECÂNICA (sessão de 16/08/2026 · v37 → v44)

> **Cole este arquivo numa janela nova do Claude para continuar a trilha de
> MECÂNICA.** Depois dele, leia `docs/ESTADO.md` (retrato do presente) e
> `docs/DECISOES-PENDENTES.md` (medido e não decidido).

**Repositório:** `vilkers/jagerlaramais` · branch **`claude/moba-game-construction-ocxaxc`**
**Último commit:** `f2b926f` · **165 testes passando** · árvore limpa

---

## 0. ESTE ARQUIVO É SÓ METADE DO QUE ACONTECEU

A sessão teve **duas trilhas em paralelo, nos mesmos arquivos**:

| | Versões | Do que trata |
|---|---|---|
| **Mecânica** — este arquivo | v38, v39 (metade), v40 | regra, motor, IA, medição |
| **Design do tabuleiro** — *fora daqui* | v39 (metade), v41–v44 | câmera, paleta, silhuetas, moldura |

**O que você precisa saber sobre a trilha de design mesmo sem cuidar dela:**

Ela mora nos MESMOS dois arquivos que a mecânica (`jogo/jogo.js` e
`jogo/estilo.css`) e vale ~370 linhas de desenho — projeção isométrica, relevo
de terreno, moldura em volta do tabuleiro, silhueta de torre/Nexus/acampamento,
vegetação. **Não apague nada disso** ao mexer em regra. O canon dela é
`docs/DIRECAO-DE-ARTE.md`, e o Vilker estava avaliando recomeçá-la do zero
quando esta sessão fechou — se ele pedir isso, é só desenho que sai; a mecânica
abaixo fica.

A fronteira prática, dentro do `jogo.js`:

- **desenho** — `desenhaMapa()` (a partir da linha ~2958), `centro`, `cantosTampo`,
  `ISO_Y`, `ESPESSURA`, `ALTURA_TERRENO`, `MOLDURA`;
- **regra** — todo o resto. `centroPlano` é regra, apesar do nome parecer desenho:
  é a planta que deriva a rota do meio.

---

## 1. LEIA ISTO PRIMEIRO — o estado que surpreende

**A branch está 51 commits à frente da `main`, e a `main` nunca foi atualizada.**
O site publicado (`vilkers.github.io/jagerlaramais`) serve a partir da `main`,
que ainda está na **v23**. Tudo o que está descrito aqui é **invisível no link
publicado**.

**O Vilker ainda não autorizou o merge nem o PR.** Não faça nenhum dos dois sem
pedir. Ele já pediu o link para jogar nesta sessão e a resposta certa foi: não
existe link atualizado até o merge.

Enquanto isso, o jeito de ele jogar é:

- **`teste/JOGAR.html`** — arquivo único, ~3,6 MB, tudo embutido, abre offline;
- **zip do site estático** para arrastar em `app.netlify.com/drop` (é o que ele usa).

---

## 2. AS REGRAS DO PROJETO QUE NÃO SE NEGOCIAM

Vêm do `CLAUDE.md` e do histórico. Quebrar qualquer uma custou versão inteira antes.

1. **`data/catalogo.js` é a fonte de verdade** do conteúdo. `jogo/`, `guia/` e
   `cartas/` leem de lá. Nunca escreva carta direto no HTML.
2. **Bug relatado vira TESTE antes de virar correção.** Se o teste não falha
   antes do conserto, ele não está testando o bug. *(Nesta sessão isso pegou um
   erro meu de teste — ver §6.)*
3. **Toda mudança de número vira patch note** em `docs/patch-notes.md`
   (append-only: entrada nova no topo, antiga nunca reescrita).
4. **Uma mudança de cada vez quando for medir** — senão o número não tem endereço.
5. **`poderTotal`/`armTotal`/`ehAgil` são `const`.** Reatribuir mata o script
   inteiro sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
6. **`visual-lab/` não é o guia** — é a trilha de criação do Vilker com o ChatGPT,
   tem stack própria e **não deve ser apagada** pela regra do "vanilla".
7. **Nomear personagem e definir rota é trilha de CRIAÇÃO, não sua. Pergunte em
   vez de deduzir.** Numa sessão anterior foram inventados 4 nomes e deduzidas 4
   rotas; erraram-se 3 e 4, e custou uma versão inteira.
8. **O guia e o jogo são vanilla** — sem framework, sem npm, sem CDN. Isso já
   barrou o 3D com biblioteca nesta sessão; revogar é decisão do grupo.

---

## 3. AS ARMADILHAS DE MEDIÇÃO

### 3.1 `times=espelho` é obrigatório para mudança que toca herói

`sim/bateria.js` roda um **confronto fixo**: dez dos vinte heróis, repartidos
fixamente entre os lados. Mudança **estrutural** (mapa, torre, onda, ouro,
respawn) cai igual nos dois e a medição vale. Mudança que toca **herói,
habilidade ou item** cai só de um lado — e aí "quem começa" mede o CONFRONTO,
não a ordem.

```
node sim/bateria.js 4500 times=espelho
```

### 3.2 "Quem começa" tem dois números

| Arranjo | quem começa |
|---|---|
| confronto fixo (toda a série histórica) | ~51,2% |
| **espelhado** | **~52,4% a 52,9%** |

Os dois estão certos e medem coisas diferentes. Item 11 de `DECISOES-PENDENTES`.

### 3.3 A medição do poço é QUANTIZADA

O agente da bateria só compromete dado com o poço quando consegue fechar **no
mesmo turno**. Isso quantiza o resultado em degraus inteiros de heróis
necessários (4 heróis → 55–58%; 5 heróis → 44–46%). Leitura de vida do poço
acima de ~5 golpes típicos mede o agente desistindo, não o objetivo.

### 3.4 O de sempre

- `quem começa` precisa de **n ≥ 2000 por execução**, rodado 2–3 vezes.
- A bateria **é cega para agência**: mede estrutura e **não** mede escolha
  (épico, Retomada, Prioridade, itens, cartas).
- **`sim/niveis.js` é o único que dirige a IA de verdade.** Os outros usam o
  agente quase-aleatório, que NÃO é a IA do jogo.
- As chaves dos níveis de IA são **`facil` / `normal` / `dificil`** — não os
  nomes de exibição (Aprendiz/Veterano/Mestre). Escrever `nivelIA="mestre"` cai
  silenciosamente no `normal` pelo `||` do `IA()`, e o teste passa medindo outra
  coisa. Aconteceu nesta sessão.

---

## 4. O QUE A MECÂNICA MUDOU NESTA SESSÃO

### v38 — a Rotação do Caçador virou escolha de REGIÃO

O menu saiu de quatro **destinos com bônus** (acampamento próprio, neutro,
inimigo, poço) para quatro **regiões**: **Topo · Meio · Baixo · Selva**.

- **Reposicionamento imediato**, no instante da escolha. `migraCacador`,
  `passoNaDirecao` e `ROTACAO_PASSOS` saíram do motor.
- Ele reaparece **sempre dentro da selva**, na parte dela colada à região, e
  **nunca dentro da rota**.
- As 4 casas por time são **derivadas da planta** e espelhadas. **O espelho troca
  topo por baixo** — `gira` leva a rota de cima na de baixo, e espelhar topo em
  topo punha a âncora do time 1 a seis casas da rota que devia vigiar.
- **Os bônus saíram junto com os destinos.** A rotação não paga mais nada.
- **Relógio de 10 segundos**; sem escolha vai para a Selva sozinho.
- **Secreta de verdade:** nada vai para o `log` — o log é lido pelos dois em
  hotseat. Também não há animação de percurso, pelo mesmo motivo.
- A IA pontua por região usando só o que **enxerga** (`visivelPara`), e lê a rota
  pelo **corredor**, não pelo ponto de pouso.

**Isto desfez metade de uma correção do Vinicius (v19).** A v18 tinha uma rotação
em que o Caçador **saía do tabuleiro**; a v19 desfez. Dois testes existiam desde
a v28 só para aquilo não voltar, e **os dois foram removidos**. A metade que
continua de pé, com teste próprio: o Caçador **nunca deixa de estar num lugar
real** do tabuleiro. O que ele deixou de ser é interceptável no caminho.

### v39 — hexágonos bloqueados, e o movimento ganhou DUAS RÉGUAS

Seis casas da selva viraram obstáculo (3 pares espelhados). Herói **não entra e
não atravessa**.

**A parte que importa e que é fácil desfazer sem querer:**

> `distância` (linha reta) continua valendo para **ALCANCE DE HABILIDADE** — o
> ônibus para o pé, não o tiro. Para **ANDAR**, a régua é `passosDe`/`passosAte`,
> uma busca em largura que **contorna** o obstáculo.

Sem isso o obstáculo seria enfeite: o movimento deste jogo sempre foi por
distância e não por caminho, e o herói passaria por cima. **Herói continua não
bloqueando caminho; só o obstáculo bloqueia.** A IA anda pela mesma régua — com
linha reta ela encostava no obstáculo e parava.

As seis casas são derivadas com **duas travas** que valem mais que a escolha: o
tabuleiro continua inteiro (toda casa alcança toda casa) e a **selva continua com
as mesmas duas regiões**. A primeira tentativa bloqueou `[2,5]`, partiu a selva
em ilhas e prendia o Caçador no próprio quintal.

**A planta não mudou:** 116 hexágonos, mesmas rotas, torres e poço, com teste.

### v40 — dois relatos do Vilker

**"Na vez da IA eu ainda consigo clicar nas opções de ação e movimento dela."**
Verdade, e a causa não é óbvia: **a própria IA pinta os destinos dela** —
`selHeroi=h; modo="mover"; calcula()` desenha as casas verdes já com `onclick`. O
painel de comando se protegia; o tabuleiro, os dados, as placas e o arrasto não.
Agora existe **uma porta só**, `mesaTravada()`, e todo gesto do humano passa por
ela. A IA não passa: ela chama `moveAte` direto, sem evento.

**"A escolha da posição do jungle é no início da RODADA, não do turno."** Certo,
e era defeito de sequência: `abreRotacoes` abre tela assíncrona, mas
`fimDaRodada` seguia na mesma pilha até `faseOculta`, que **rola os dados e
começa o turno**. Agora o resto da virada é um `depois` que só roda quando os
dois lados responderem. Em hotseat são **duas** telas.

---

## 5. COMANDOS

```
node sim/testes.js              # 165 testes de regressão
node sim/bateria.js 4500 times=espelho   # estrutura + ordem
node sim/epicos.js 2500         # Dragão e Barão
node sim/habs.js                # cada habilidade contra a básica do próprio herói
node sim/ouro.js 600            # economia: renda contra preço
node sim/niveis.js 600          # os 3 níveis da IA, com a IA DE VERDADE
node sim/simetria.js            # o tabuleiro é espelho de si mesmo?
node teste/empacota.js          # regera teste/JOGAR.html
```

**Variantes:** `times=espelho` · `curabase=N` · `dot=off` · `zonas=off` ·
`baraodano=N` · `baraoarm=N` · `baraogolpe=on` · `mato=off` · `muralha=off` ·
`respawn=fixo` · `armtorre=` · `revide=off`

**Zip para o Netlify:**
```
mkdir site && cp -r index.html .nojekyll jogo guia cartas data arte teste site/
zip -qr site.zip site
```

**Chromium está instalado** (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`)
e Playwright abre o jogo para conferir erro de console de verdade. **Use.** Nesta
sessão o harness passava 165 testes com o jogo intocável no dedo — só o clique
real na tela pegou.

---

## 6. ERROS QUE EU COMETI NESTA SESSÃO

1. **Derivei as âncoras da rotação espelhando topo em topo.** `gira` leva a rota
   de cima na de baixo: o espelho de "Topo" é "Baixo". Só apareceu porque
   imprimi os pontos antes de confiar neles.
2. **Deixei "Meio" e "Selva" caírem na mesma casa** — quatro botões, três
   lugares. Mesma impressão pegou.
3. **Escrevi o teste do timeout respondendo só uma tela.** Em hotseat são duas, e
   a rodada ficava parada de propósito. O teste acusou o motor por um defeito
   meu.
4. **Usei `nivelIA="mestre"`**, que não existe — a chave é `dificil`. Caiu no
   `normal` silenciosamente e dois testes mediram outra coisa.
5. **Bloqueei `[2,5]` na primeira tentativa** e parti a selva em ilhas. Só não
   passou porque exigi que a contagem de componentes do mato não mudasse.
6. **Julguei desenho em captura do tamanho de celular** e não vi que a vegetação
   estava sendo coberta pelo próprio hexágono. Só apareceu a 2× de escala.
7. **Deixei a decoração comer o clique.** A torre alta cobria o centro da casa e
   o toque para andar batia nela. Defeito mais velho que a torre — só ficou
   grande o bastante para aparecer.

---

## 7. O QUE ESTÁ ABERTO NA MECÂNICA

**Decisão do Vilker, do Vinicius e do Matheus:**

- **O merge para a `main`.** 51 commits esperando. Nada está publicado.
- **A renda de ouro** — herói acumula **61**, build de 3 itens mais caro custa
  **25**. Paga 2,4×. `sim/ouro.js` tem `farma=`, `agiu=`, `matar=`. Recomendo
  testar `farma=2` primeiro, **sempre com `times=espelho`**.
- **Cartas de reação** — 3 cartas declaram `quando:"reacao"` e o motor nunca lê o
  campo. Item 4 de `DECISOES-PENDENTES`.
- **O que move o Barão continua desconhecido.** O handoff anterior culpava o `+1`
  do destino "poço" pelo drift para 59,1%. Esse `+1` **deixou de existir na v38** e
  o Barão foi a **58,4%** — 0,7 ponto, dentro do ruído. A alavanca recomendada
  foi puxada até o fim e não moveu nada. Candidatos nunca isolados: vida 16 /
  armadura 3 da v26, teto de escudo 12, Égide 7→4, janela de alvo da v27. Item 12
  de `DECISOES-PENDENTES`.
- **A partida encurtou com os bloqueios**: 24 → 22 rodadas de mediana, Barão
  1,07 → 0,93 por partida, Dragão 0,35 → 0,31. Obstáculo custa movimento, e
  movimento gasto contornando não foi para o poço. **Se o poço ficar irrelevante
  no playtest, a alavanca é `BLOQUEIOS_ALVO`** (de 3 para 2 tira um par de cada
  lado), **não o preço do Barão**, que já foi medido duas vezes sem se mexer.

**Ainda não existe:** Arauto (tem arte, não tem regra) · highlight estilo LoL no
tutorial · comeback · multiplayer em rede (o jogo é hotseat).

---

## 8. ONDE AS COISAS MORAM

```
jogo/jogo.js        motor de regras + interface (~5.100 linhas)
jogo/estilo.css     TODA a aparência — mexer aqui não quebra regra
data/catalogo.js    heróis, itens, deck, classes, textoHab()
arte/herois/web/    retratos 293×440, nomeados pelo id do chassi
sim/motor.js        harness (DOM falso) · a PONTE expõe o que os testes usam
sim/agente.js       o jogador artificial quase-aleatório (NÃO é a IA do jogo)
sim/testes.js       165 testes de regressão
docs/ESTADO.md      retrato do presente — leia primeiro
docs/REGRAS.md      regras completas, extraídas do motor
docs/patch-notes.md histórico, append-only
docs/DECISOES-PENDENTES.md   medido e não decidido
docs/DIRECAO-DE-ARTE.md      canon da OUTRA trilha — não é sua, mas não apague
```

---

## 9. COMO O VILKER TRABALHA

- Ele manda **print da tela do celular** quando algo está errado. É a informação
  mais valiosa que chega — peça quando o relato for vago.
- Ele testa no **Netlify Drop**, não no GitHub Pages.
- Ele fala em português, direto e curto. Responda igual.
- Quando ele diz "tá quebrado", **reproduza antes de consertar**. Uma vez a causa
  era a `main` desatualizada; outra, o arquivo local no celular.
