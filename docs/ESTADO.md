# ESTADO — onde o jogo está agora

> **Abrindo uma janela nova do Claude? Comece por aqui.**
> Este arquivo é o retrato do presente. O histórico está em `docs/patch-notes.md`.
> Mantenha curto: quando um item vira passado, ele sai daqui e vira patch note.

**Versão:** v45 (a individualidade dos heróis) · **Atualizado em:** 2026-08-17

> **As regras completas estão em `docs/REGRAS.md`** — extraídas do motor, não da
> memória. `docs/02-regras.md` é da v0.2 e está arquivado.
> Decisões medidas e **não** tomadas estão em `docs/DECISOES-PENDENTES.md`.
> Antes de mudar número, leia lá — várias já têm medição pronta esperando escolha.

---

## Em uma frase

MOBA de tabuleiro 1v1 no mesmo aparelho, onde cada jogador é o técnico de cinco heróis;
um Dado Mestre move o time inteiro e três dados de ação viram a Força das habilidades.

## Os números que valem hoje

| | |
|---|---|
| Heróis no pool | **20** (4 por rota) · **os 20 kits foram reformulados na v45** — cada um com **ideia principal**, **passiva** e sinergia interna. Nome, arte, rota, classe e história **não mudaram**. A tabela dos kits está em **`docs/KITS.md`**; a arte entra em `arte/herois/web/<id>.jpg` |
| Itens na loja | **22** |
| Deck de Comando | **46 cartas**, 22 tipos, 7 famílias — todas com arte |
| Banimentos no draft | **1 por jogador**, e uma rota só pode perder um herói |
| Turnos | **A → C → A → C**. Uma rodada = um turno de cada. A iniciativa **não** alterna mais entre rodadas |
| Dados por rodada | 1 Mestre (movimento do time) + 3 de ação, **1 por herói** · +1 por grau de Retomada · todo dado pode virar movimento |
| Duração de efeito | escudo, buff, intocável e prisão duram **até o início do próximo turno do dono** |
| Ultimates perfurantes | Julgamento, Ato Final e Sentença **escalam** (`dano 0,8 × 1,25 + Poder`) e **ignoram Armadura**. Eram `danoFixo 8`, travadas desde a v19 |
| Alvos no mesmo hexágono | o toque abre **janela de escolha** (herói, torre, poço, Nexus). Antes o alvo de toque do herói escondia o Nexus e travava o fim de partida |
| Escala de dano | básica `round(Força × dano) + Poder` · **habilidade do meio ×1,2** · **Ultimate ×1,25** |
| Vida de torre | **3** — a onda tira 1/rodada; o herói tira 1 por golpe, **sem trava por rodada** (a torre revida 2 a cada golpe). O herói bate na **torre exposta** da rota |
| Vida do Nexus | **3** — a onda tira 1 com a rota aberta; o herói tira 1 por golpe. **Última muralha: com o Nexus em 1 a onda só passa se NÃO houver herói inimigo a 1 do Nexus** — o último ponto é de herói |
| Poço épico | casa **[8,8]** (derivada) · **Dragão** (3 de vida) até a rodada 12, **Barão a partir da 12 — toma o poço mesmo com o Dragão vivo** |
| Dragão — como apanha | **conta GOLPES**: básica 1, Ultimate 2, respingo 1, o dado não entra. Cai em **Ultimate + básica**, nunca numa Ultimate só. Revide 2 |
| Barão — como apanha | **conta DANO, pela regra dos heróis**: `Força + Poder − Armadura`, respingo pela metade, `danoFixo` ignora armadura. **16 de vida, 3 de armadura** — menos vida que qualquer herói; é a **armadura** que o faz exigir grupo (básica de dado 2 tira 2; Ultimate de dado 6 tira 8). Fechar num turno pede **4 dos 5**. Revide 4 |
| Teto de escudo | **12** — metade da vida do maior herói. Muralha 17→12, Vento Contrário 15→11, Anteparo 13→10. Égide do Barão **4** por turno (era 7, e a própria carta já dizia 4) |
| Dádiva do Barão | quem fecha escolhe **1 de 3** por 2 rodadas: **Ondas de Ferro** (as 3 ondas andam sozinhas), **Égide** (4 de escudo no time por turno), **Aríete** (golpe em estrutura causa 2). Nenhuma dá Poder |
| Acampamentos | Azul [3,4] · Carmim [7,6] (espelhos) · **neutro sorteado entre 2 posições, ambas a 7 das duas bases** |
| Visão | **vem das peças**: herói 2 · torre viva 2 · base 2 · Frente de Onda 2 · **ward 3**. O resto é escuridão. Ward é peça no mapa, dura 3 rodadas. **O mato bloqueia: só se enxerga de dentro do mato** — inclusive para ward. 61 de 116 casas visíveis na rodada 1 |
| Níveis da IA | **Aprendiz · Veterano · Mestre**. Muda só a **qualidade da decisão** — nenhum nível ganha número nem visão a mais. Medido em `sim/niveis.js`: Mestre 55,8% × Veterano · Veterano 72,7% × Aprendiz |
| Rotação do Caçador | no **início da rodada** os dois escolhem, às cegas, a **região** do próprio Caçador — **Topo · Meio · Baixo · Selva** — e ele é **reposicionado na hora**, sempre **dentro da selva**, na parte dela colada à região, **nunca dentro da rota**. **10 segundos** para decidir; sem escolha vai para a **Selva**. As 4 casas são derivadas da planta e espelhadas (`gira` troca topo por baixo). **Sem bônus de destino** — saíram junto com os destinos na v38. Secreta: nada no log, quem quiser saber precisa de **visão daquele mato** |
| Emboscada | atacar **sem ter sido visto** dá **+2 de Força** — e **quem ataca fica revelado até sair da casa de onde bateu**. A IA obedece à mesma névoa — não trapaceia. Contra IA, a tela é sempre a do humano |
| Defesa de torre | herói a **1 de distância de torre viva do próprio time** ganha **+1 de Armadura**. Torre inimiga não protege quem mergulha |
| Vida dos heróis | **18 a 25** (escala ×1,8 na v21) · Ultimate rende **1,25×** o dado · nenhuma mata de um golpe |
| **Condições** | **12**, num registro só (`CONDS`, em `data/catalogo.js`): 🩸 Sangramento · ☠️ Veneno · 🐌 Lentidão · ⭐ Atordoamento · 🌀 Banimento · 👁️ Invisibilidade · 🎯 Marcado · 💢 Vulnerável · 🤐 Silenciado · 🛡️ Tenacidade · 📡 Revelado · 💠 Marca do Catarino. **O dano cobra no INÍCIO do turno de quem carrega; a duração cai no FIM.** Prazo em **turnos do portador**, nunca em rodadas. Morrer limpa **todas** |
| Acúmulo × duração | **acúmulo** (`×2`) soma ao reaplicar, até o teto; **duração** (`2 turnos`) renova pelo maior. Sangramento e as marcas são acúmulo; o resto é duração |
| Condição em si mesmo | armadilha: `tu:1` posto em **inimigo** vale um turno dele, mas posto em **si mesmo ou aliado** vence antes de o adversário jogar. Para aliado o valor certo é **`tu:2`** |
| **Passivas** | **20 — uma por herói**, no registro `PASSIVAS` (`jogo/jogo.js`), disparadas por evento (`inicioTurno`, `fimTurno`, `hit`, `danoCausado`, `danoRecebido`, `danoRecebidoAliado`, `matou`, `morreu`, `andou`, `habUsada`) ou consultadas (`poder`, `crit`, `reduzDano`, `veMato`). O herói declara `pas:{id}` no catálogo, e o id é a chave do registro |
| **Recursos de personagem** | **6**, de um herói só cada: ⚡ Carga (Parabólica) · ♻️ Sucata (Gari Mago) · 🖤 Tristeza (Emerson Emo) · 🔸 Cartucho (Corvo) · 🎈 Fôlego (Zé Griteco) · 🔗 Almas (Torvald). Mais os ⚖ Autos, registro da cópia do Arden. **Não saem na morte** |
| Sangramento | **acúmulos**: 1 de dano por acúmulo no início do turno, −1 acúmulo no fim. Teto **5**. Ignora armadura e escudo |
| Veneno | **2 fixos** por turno, teto **4** turnos, renova pelo maior. Ignora armadura e escudo |
| Crítico | **1,5×**, e sempre **condicional** — nunca sorte. Alvo isolado (Pombo) · alvo travado (Cael) · 3 Cargas (Parabólica) · o quarto tiro (Corvo) · sempre (Ato Final) · das sombras (Rasante Final) |
| Atordoamento | **dois heróis só** (Taxista e Valti), e o do Valti exige o alvo **dentro de uma armadilha dele**. **Sem cadeia**: sair de um atordoamento concede Tenacidade automaticamente |
| Banimento | **um herói** (Zhet, nela mesma). 1 turno · não é alvo · não sofre dano · **não ocupa hexágono** · não acende visão · volta na **mesma casa** no início do próprio turno |
| Invisibilidade | **um herói** (Pombo Ciborgue). **Ward revela** — é a única fonte de visão que pega o invisível. Atacar entrega a posição. Revelado vence em qualquer lugar |
| Cópia | **um herói** (Arden). Registra a última habilidade **inimiga** que o acertou; **Ultimate nunca entra**, cópia de cópia nunca entra, **um uso**, e os autos aparecem na ficha dele |
| Lentidão | **−2 casas** de caminhada, mínimo **1**, e perde o passo grátis de Ágil. Continua agindo — não é Prende |
| Zona | condição posta no **chão**: quem **começa o turno dentro** a recebe. Prazo em **turnos do adversário** (2), nunca em rodadas. Desde a v45 pendura **qualquer** condição, não só veneno |
| Indicadores de estado | até **3 ícones** ao lado do totem (ordenados por consequência, com `+N` quando sobra) + a etiqueta grande. Seção **CONDIÇÕES** na ficha, com tooltip **de toque** — no celular não existe hover |
| Cura de base | **3 por rodada** na própria base. Com inimigo a **2 ou menos**, trata **1 vez** e para até ele sair de perto |
| Alcance | teto de **4**, itens incluídos |
| Quem começa | **cara ou coroa** no início da partida |
| Acampamento | pisar ocupa; **o ouro sai no fim da rodada**, para quem ficou |
| Gasto de ouro tardio | **Reforço** (**10, +4** por compra) → +1 de Poder · **Requisição** (5) → 1 carta · **Leva de Ferro** (4, +1 a cada 3 rodadas, teto 12) → sua onda avança 1 · **Sentinela** (4, +2 por compra, máx. 2) → ward na mochila, plantada de graça. Só compra na base |
| Vantagem de quem começa | **~52,9%** no confronto **espelhado** (n=9000), que é o único jeito de medir ORDEM. Os ~51% históricos vinham do confronto fixo e assimétrico da bateria — ver `times=espelho` |
| Economia | herói acumula **61** de ouro na partida; o build de 3 itens mais caro custa **25**. A renda paga o build **2,4×** — medido em `sim/ouro.js` |
| Hexágonos bloqueados | **6** casas de selva (3 pares espelhados) com **ônibus, carros empilhados e caixa-d'água** em cima. Herói **não entra e não atravessa** — a selva virou corredor. Bloqueiam visão como todo mato; nunca em rota, base, acampamento, ponto de pouso ou vizinha do poço. Derivadas da planta, com trava de mapa inteiro e de selva inteira |
| Andar × alcançar | **duas réguas.** `distância` (linha reta) vale para **alcance de habilidade**; para **andar**, vale o caminho que contorna o obstáculo. Herói não bloqueia caminho — só o obstáculo |
| Direção de arte | `docs/DIRECAO-DE-ARTE.md` é **canon**: Brasil pós-cataclisma de gambiarra, dia claro, sucata colorida, verde-limão pontual. O tabuleiro 2D já está na paleta; 3D e miniaturas não começaram |
| Tamanho do tabuleiro | **11×11**, 116 casas · **27 de mato** · espinha 17/12/17 · corredor com **2 de largura nas três rotas** — derivado de `const N` em jogo.js |
| Ouro por rodada | agiu **1** · farmou **3** · morto **0** |
| Respawn | **2** rodadas até a 8 · **3** até a 16 · **4** daí em diante. Não há cura de base: o que devolve vida cheia é o respawn |
| Duração de uma partida | **~23 rodadas** (mediana medida: 23, n=6000) |
| Alvo de toque | **44px** (40 em tela ≤760 de altura) · peça do mapa vale o hexágono inteiro |
| Peso da pasta `arte/` | ~9 MB |
| Publicado em | vilkers.github.io/jagerlaramais |

## O que funciona

Motor de regras · mapa hexagonal, torres, ondas, Nexus · Dado Mestre + 3 de ação ·
Caçador que **some no mato** (e o mato bloqueia visão de verdade) · Placas do Topo · Prioridade do Meio · loja e itens ·
**poço épico com Dragão e Barão** · **Retomada (freio de bola de neve)** ·
tutorial de 9 passos · draft com ban e counterpick · Deck de Comando com face ilustrada ·
guia navegável · visualizador de cartas · **ergonomia de toque auditada em 4 tamanhos de tela** ·
**arrastar o herói para andar** · **segurar a habilidade abre a ficha dela** ·
**tela de vitória com o herói do golpe final** · **IA que compra, joga carta, disputa objetivo
e converte ação em movimento**.

## Como verificar que nada quebrou

```
node sim/testes.js        # 123 testes de regressão — um por bug já relatado
node sim/bateria.js 2000  # medição estrutural (mapa, torre, onda, ordem)
node sim/epicos.js 1500   # Dragão e Barão: quando aparece, atacado, morto, vitória
node sim/habs.js          # cada habilidade contra a básica do próprio herói
node sim/niveis.js 600    # os três níveis da IA jogando um contra o outro (IA de verdade)
node sim/ouro.js 600      # economia: renda por herói contra o preço do que dá para comprar
node teste/empacota.js    # regera teste/JOGAR.html, o arquivo único jogável
```

**Sobre tamanho de amostra:** a taxa de "quem começa" precisa de **n ≥ 2000** por
execução, e vale rodar duas ou três vezes. Já fui enganado por n=250 (deu 50%
quando o real era 43%) e por um harness instável (o mesmo build dando 47,6% e
50,4%).

**Regra do projeto desde a v16:** bug relatado vira teste em `sim/testes.js`
**antes** de virar correção. Se o teste não falha antes do conserto, ele não está
testando o bug.

## O que precisa de playtest humano, não de simulação

**`sim/bateria.js` é cega a agência.** Medido, não suposto: dando à Retomada até 6 dados extras
por turno, a vantagem de quem começa não se moveu (52,2% · 53,0% · 52,9% contra 52,9% sem nada).
O agente joga ao acaso, e dado a mais só vira vitória na mão de quem escolhe bem.

Ela mede bem **estrutura** (geometria, onda, torre, ritmo) e não mede **escolha**: épico, Retomada,
Prioridade, Placas, itens e cartas. Na medição do poço, o time que levava 62% dos épicos perdia —
a bateria via o dado gasto e o revide, não via o Poder ganho. Detalhes na v0.5.5 dos patch notes.

**Então o próximo passo do épico e da Retomada é sentar os três e jogar**, não rodar mais partida.
A loja entra na mesma lista: a correção da v0.5.7 barateou voltar para comprar, e o agente não faz
compras, então só playtest diz se o peso ficou certo.

**Revisão externa do Vinicius e do Matheus:** análise item a item em `docs/REVISAO-EXTERNA.md`.
As correções entraram na v0.5.7; as propostas de tabuleiro e regra estão avaliadas lá, com o que
colide com medição já registrada.

## O que NÃO existe

| O quê | Por que importa |
|---|---|
| **Zona de armadilha** (cartas de reação) | O catálogo declara `quando:"reacao"` em 3 cartas e **o motor nunca lê esse campo** — elas só funcionam como escudo antecipado no próprio turno. Aprovado virar zona virada para baixo, estilo armadilha. |
| **Highlight estilo LoL no tutorial** | Hoje a caixa de diálogo explica, mas não aponta. Falta escurecer a tela e iluminar só a região certa. |
| **Arauto** | O terceiro monstro tem arte (`arte/monstros/arauto.jpg`) e não tem regra. O poço já sabe trocar de morador, então cabe sem motor novo. |
| **Multiplayer em rede** | O jogo é *hotseat*: um aparelho, passando a vez. Publicar não muda isso. |

## Onde as coisas moram

```
sim/bateria.js       Roda N partidas e imprime ritmo e assimetria. `node sim/bateria.js 20000`
                     Leia o cabeçalho: ele diz o que ela NÃO consegue medir.
sim/simetria.js      Confere se o tabuleiro é espelho de si mesmo: casas sem par, rotas,
                     bases, distância das torres, ESPINHA CONTÍNUA e largura da rota.
                     Aceita mapa=N. Sai com código 1 se falhar — serve de teste.
sim/motor.js         Carrega o jogo em Node com DOM falso.
                     Variantes: torre= mov= acao= mapa= epico=off retomada=off revide=off
                     dragao= barao= vdragao= vbarao= heranca= furia= ondas=off
                     armtorre= mato=off revelar=off passo1=   (as regras da v22)
                     muralha=off respawn=fixo               (as regras da v23)
data/catalogo.js     ÚNICA fonte de conteúdo: heróis, itens, deck, classes, textoHab()
jogo/index.html      Só a estrutura da tela. 64 linhas.
jogo/estilo.css      TODA a aparência. Área segura: mexer aqui não quebra regra.
jogo/jogo.js         Motor de regras + interface.
guia/index.html      Manual navegável. Lê do catálogo.
cartas/index.html    Visualizador das 20 cartas. Lê do catálogo.
arte/imagens.js      Índices de arte (ARTE, ARTE_CARTA, ARTE_ITEM, ARTE_MAPA, ARTE_MONSTRO).
                     ARTE_ITEM só cobre 12 dos 22 itens — o resto cai no selo de itemProv().
                     Use RETRATO_ITEM(id) e RETRATO(id), nunca o índice direto.
arte/herois/web/     Retratos usados em tela · arte/herois/ guarda o original
arte/cartas/         As 22 artes do Deck de Comando
arte/mapa/mapa.jpg   O mapa ilustrado
docs/                Regras, design e decisões. Leia na ordem numerada.
```

## Sete armadilhas que já custaram tempo

**0. `sim/bateria.js` roda UM confronto fixo — e isso a cega para mudança de herói.**
São sempre vharn/nyx/solenne/vesper/mirrha contra kaross/grumo/zhet/cael/torvald: dez dos vinte
heróis, repartidos fixamente entre os lados. Mudança **estrutural** (mapa, torre, onda, ouro,
respawn) cai igual nos dois e a medição vale. Mudança que toca **herói, habilidade ou item** cai
só de um lado, e aí "quem começa" mede o confronto, não a ordem. Na v25 isso custou uma conclusão
inteira: duas das sete habilidades novas estavam no time 1 e nenhuma no time 0, a bateria acusou
53,5% com z=6,60 e eu quase registrei uma regressão que não existia. **Use `times=espelho` sempre
que a mudança tocar herói.**

**1. `poderTotal`, `armTotal` e `ehAgil` são `const`.** Reatribuir lança `TypeError` e **mata o
script inteiro dali para baixo, sem erro visível no console** — o sintoma é uma função que "não
existe". Para dar bônus, escreva em `extraPoder`/`arm`/`agil` e guarde quanto aplicou. Ver
`aplicaBuff`/`limpaBuffs`.

**2. IDs duplicados entre `<section>` e o container interno.** `querySelector` pega o primeiro e
você apaga a seção inteira. Já aconteceu no guia.

**3. ~~As duas fórmulas de `TORRES_DEF` não são espelho~~ — resolvido na v0.6.** O desencontro
existia para compensar a assimetria do mapa, e o aviso pedia para medir os dois lados juntos.
Foi o que se fez: com o tabuleiro simétrico, torre simétrica dá **58,7%** para quem começa e a
fórmula antiga dá **73,5%** (1500 partidas por caso). A compensação virou o problema e saiu.
Fica a lição, que continua valendo: **assimetria de mapa e posição de torre se medem em conjunto.**

**4. Medição de assimetria quer n=20000.** A n=5000 a banda de ruído é ±1,4 ponto a 2σ, e foi ela
que produziu o "52,4%" da v0.5.4 — o número real da mesma build é 50,5%.

**6. Gesto no mapa não pode chamar `pinta()`.** Selecionar herói faz o painel crescer, o palco
encolher e o mapa se redimensionar — com o dedo encostado. Medido: a casa sob o dedo pulava de
`[0,5]` para `[0,7]`. Realce durante gesto se faz direto no DOM; repinta só no fim. Ver v0.5.8.

**5. O tabuleiro não cabe direito abaixo de 640px de altura.** Em 8×8 dava hexágono de ~28px, contra
os 44 de referência de toque. Não é conserto de CSS: exigiria menos hexágonos ou deslocar-e-
ampliar. Nesse tamanho a lista de comando mostra uma linha por vez e rola. Ver v0.5.6.
**Em 9×9 (v0.6) o aperto é maior** — o hexágono encolhe de novo. Ainda não reavaliado em tela pequena.

## O script de medição novo

```
node sim/condicoes.js 200        # as condições e os recursos aparecem na mesa?
```

Dirige a **IA de verdade** nos dois lados, sorteando os vinte heróis, e olha o
tabuleiro ao fim de cada turno. Serve para achar **condição que é código morto**
(0% das partidas) e **condição que virou clima** (presente em todo mundo, sempre).
Foi ele que encontrou o bug da Marca — que era mais velho que a v45.

## Como testar rápido

Abra `jogo/index.html`, F12, e dirija o estado pelo console:

```js
comeca(false,true)   // draft
comeca(true,false)   // tutorial
novo(); pinta()      // partida limpa
```

Ou peça: *"roda uma partida por script e me diz se dá erro"*.
