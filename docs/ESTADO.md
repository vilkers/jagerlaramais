# ESTADO — onde o jogo está agora

> **Abrindo uma janela nova do Claude? Comece por aqui.**
> Este arquivo é o retrato do presente. O histórico está em `docs/patch-notes.md`.
> Mantenha curto: quando um item vira passado, ele sai daqui e vira patch note.
>
> Os números marcados se atualizam sozinhos: mexeu no jogo, rode `node sim/docs.js --escrever`.
> Ver `docs/DOCUMENTACAO.md`.

**Versão:** <!--n:versao-->v0.6.3<!--/n--> · **Atualizado em:** 2026-08-11

A **v0.6.3 não muda regra**: é a documentação passando a se conferir sozinha, mais a loja
saindo do motor para o catálogo. O que continua **em teste e não aprovado** é a leva
v0.5.9 → v0.6.2 — tabuleiro 11×11, cerco por herói, Nexus atacável. Ver `teste/LEIA.md`.

---

## Em uma frase

MOBA de tabuleiro 1v1 no mesmo aparelho, onde cada jogador é o técnico de cinco heróis;
um Dado Mestre move o time inteiro e três dados de ação viram a Força das habilidades.

## Os números que valem hoje

| | |
|---|---|
| Heróis no pool | **<!--n:herois-->20<!--/n-->** (<!--n:heroisPorRota-->4<!--/n--> por rota) — todos com arte |
| Itens na loja | **<!--n:itens-->22<!--/n-->** |
| Deck de Comando | **<!--n:cartas-->46<!--/n--> cartas**, <!--n:tiposCarta-->22<!--/n--> tipos, <!--n:familias-->7<!--/n--> famílias — todas com arte |
| Banimentos no draft | **<!--n:bans-->1<!--/n--> por jogador**, e uma rota só pode perder um herói |
| Dados por rodada | 1 Mestre (movimento do time) + <!--n:dadosAcao-->3<!--/n--> de ação, **1 por herói** |
| Vida de torre | **<!--n:vidaTorre-->3<!--/n-->** — a onda tira 1/rodada, o herói tira <!--n:danoTorre-->1<!--/n--> (uma vez por rodada). O herói bate na **torre exposta** da rota, sem depender da onda |
| Vida do Nexus | **<!--n:vidaNexus-->3<!--/n-->** — a onda tira 1 com a rota aberta; o herói tira 1/rodada, só depois que uma rota inteira cai |
| Poço épico | casa **<!--n:poco-->[8,8]<!--/n-->** · Dragão (<!--n:vidaDragao-->3<!--/n--> de vida) até a rodada <!--n:rodadaBarao-->8<!--/n-->, Barão (<!--n:vidaBarao-->5<!--/n-->) depois. **A casa é DEDUZIDA de `N`** — o `[4,4]` que este arquivo trazia só valia no tabuleiro 8×8 |
| Vantagem de quem começa | **55,5%** (z=15,41, n=20000) — era **53,5%** na v0.5.8 e chegou a **57,1%** na v0.6.1. O tabuleiro 11×11 devolveu 1,6 ponto, mas ainda sobra +2,0 sobre a base e não há freio |
| Tamanho do tabuleiro | **<!--n:tabuleiro-->11×11<!--/n-->**, <!--n:casas-->116<!--/n--> casas · **<!--n:casasSelva-->30<!--/n--> de selva** · espinha <!--n:espinhas-->topo 17 · meio 12 · baixo 17<!--/n--> · corredor de <!--n:casasCorredor-->82<!--/n--> casas, **2 de largura nas três rotas** — derivado de `const N` em jogo.js |
| Ouro por rodada | agiu **<!--n:ouroAgiu-->1<!--/n-->** · farmou **<!--n:ouroFarmou-->3<!--/n-->** · morto **0** |
| Duração de uma partida | **~19 rodadas** (mediana medida: 19, n=20000) — eram 15 em 9×9. O tabuleiro maior alongou a partida |
| Alvo de toque | **44px** (40 em tela ≤760 de altura) · peça do mapa vale o hexágono inteiro |
| Peso da pasta `arte/` | ~9 MB |
| Publicado em | vilkers.github.io/jagerlaramais |

## O que funciona

Motor de regras · mapa hexagonal, torres, ondas, Nexus · Dado Mestre + 3 de ação ·
Caçador com comando oculto · Placas do Topo · Prioridade do Meio · loja e itens ·
**poço épico com Dragão e Barão** · **Retomada (freio de bola de neve)** ·
tutorial de 9 passos · draft com ban e counterpick · Deck de Comando com face ilustrada ·
guia navegável · visualizador de cartas · **ergonomia de toque auditada em 4 tamanhos de tela** ·
**arrastar o herói para andar** · **segurar a habilidade abre a ficha dela** · **placar no fim**.

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
| **Acampamentos de selva** | Buffs Azul e Vermelho — a válvula contra dado ruim. |
| **Feitiços de invocador** | 5 cartas, alto retorno em história. |
| **Highlight estilo LoL no tutorial** | Hoje a caixa de diálogo explica, mas não aponta. Falta escurecer a tela e iluminar só a região certa. |
| **Arauto** | O terceiro monstro tem arte (`arte/monstros/arauto.jpg`) e não tem regra. O poço já sabe trocar de morador, então cabe sem motor novo. |
| **Multiplayer em rede** | O jogo é *hotseat*: um aparelho, passando a vez. Publicar não muda isso. |
| **Mapa do guia atualizado** | O visualizador de `guia/index.html` desenha um **7×7 escrito à mão**, da era anterior ao mapa gerado — o tabuleiro real é <!--n:tabuleiro-->11×11<!--/n-->. `node sim/docs.js` avisa toda vez. Consertar é portar a geometria de `jogo.js` para lá. |
| **Teleporte do Topo · respawn crescente** | Estão nas regras desde a v0 e nunca foram implementados. Agora aparecem marcados com 🔸 em `docs/02-regras.md`, em vez de passar por regra vigente. |

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
sim/numeros.js       Os números canônicos, extraídos do código. `node sim/numeros.js`
sim/docs.js          A documentação bate com o código? Sai com 1 se não bater.
                     `node sim/docs.js --escrever` atualiza os números marcados.
data/catalogo.js     ÚNICA fonte de conteúdo: heróis, ITENS (os 22, desde a v0.6.3),
                     deck, classes, textoHab()
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
docs/DOCUMENTACAO.md Como a documentação se mantém sozinha. Leia antes de mexer em número.
docs/glossario.md    O léxico. Termo definido não muda de nome.
```

## Seis armadilhas que já custaram tempo

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

## Como testar rápido

Abra `jogo/index.html`, F12, e dirija o estado pelo console:

```js
comeca(false,true)   // draft
comeca(true,false)   // tutorial
novo(); pinta()      // partida limpa
```

Ou peça: *"roda uma partida por script e me diz se dá erro"*.
