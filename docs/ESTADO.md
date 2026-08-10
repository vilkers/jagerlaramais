# ESTADO — onde o jogo está agora

> **Abrindo uma janela nova do Claude? Comece por aqui.**
> Este arquivo é o retrato do presente. O histórico está em `docs/patch-notes.md`.
> Mantenha curto: quando um item vira passado, ele sai daqui e vira patch note.

**Versão:** v0.5.2 · **Atualizado em:** 2026-08-09

---

## Em uma frase

MOBA de tabuleiro 1v1 no mesmo aparelho, onde cada jogador é o técnico de cinco heróis;
um Dado Mestre move o time inteiro e três dados de ação viram a Força das habilidades.

## Os números que valem hoje

| | |
|---|---|
| Heróis no pool | **20** (4 por rota) — todos com arte |
| Itens na loja | **22** |
| Deck de Comando | **46 cartas**, 22 tipos, 7 famílias — todas com arte |
| Banimentos no draft | **1 por jogador**, e uma rota só pode perder um herói |
| Dados por rodada | 1 Mestre (movimento do time) + 3 de ação, **1 por herói** |
| Vida de torre | **3** — a onda tira 1/rodada, o herói tira 1 (uma vez por rodada) |
| Vantagem de quem começa | **58,3%** (z=9,06, n=3000) — medido, não resolvido |
| Ouro por rodada | agiu **1** · farmou **3** · morto **0** |
| Duração de uma partida | ~15 rodadas |
| Peso da pasta `arte/` | ~9 MB |
| Publicado em | vilkers.github.io/jagerlaramais |

## O que funciona

Motor de regras · mapa hexagonal, torres, ondas, Nexus · Dado Mestre + 3 de ação ·
Caçador com comando oculto · Placas do Topo · Prioridade do Meio · loja e itens ·
tutorial de 9 passos · draft com ban e counterpick · Deck de Comando com face ilustrada ·
guia navegável · visualizador de cartas.

## O que NÃO existe

| O quê | Por que importa |
|---|---|
| **Mapa maior** | Rota de 10 hexágonos, Dado Mestre até 6, Corvo com alcance 4: **6+4=10 = a rota inteira**. Dá para sair da base e acertar o outro lado antes de ele jogar — é a raiz da vantagem de quem começa. **É a próxima coisa.** Simulado: aumentar o dado **sem** aumentar o mapa piora para 66–68%. |
| **Compensação para o segundo jogador** | 58,3% é muito. Sai junto com o mapa. |
| **Zona de armadilha** (cartas de reação) | O catálogo declara `quando:"reacao"` em 3 cartas e **o motor nunca lê esse campo** — elas só funcionam como escudo antecipado no próprio turno. Aprovado virar zona virada para baixo, estilo armadilha. |
| **Objetivos épicos no tabuleiro** (Dragão, Barão) | Estão nas regras e no mapa ilustrado, fora do jogo. Sem eles não há pressão de tempo e dois jogadores passivos arrastam a partida. |
| **Comeback** | Quem abre vantagem não devolve nada. Bola de neve sem freio. |
| **Acampamentos de selva** | Buffs Azul e Vermelho — a válvula contra dado ruim. |
| **Feitiços de invocador** | 5 cartas, alto retorno em história. |
| **Highlight estilo LoL no tutorial** | Hoje a caixa de diálogo explica, mas não aponta. Falta escurecer a tela e iluminar só a região certa. |
| **Multiplayer em rede** | O jogo é *hotseat*: um aparelho, passando a vez. Publicar não muda isso. |

## Onde as coisas moram

```
sim/bateria.js       Roda N partidas e imprime ritmo e assimetria. `node sim/bateria.js 3000`
sim/motor.js         Carrega o jogo em Node com DOM falso. Variantes: torre= mov= acao=
data/catalogo.js     ÚNICA fonte de conteúdo: heróis, itens, deck, classes, textoHab()
jogo/index.html      Só a estrutura da tela. 63 linhas.
jogo/estilo.css      TODA a aparência. Área segura: mexer aqui não quebra regra.
jogo/jogo.js         Motor de regras + interface.
guia/index.html      Manual navegável. Lê do catálogo.
cartas/index.html    Visualizador das 20 cartas. Lê do catálogo.
arte/imagens.js      Índice de caminhos das imagens (ARTE, ARTE_CARTA, ARTE_MAPA, ARTE_MONSTRO)
arte/herois/web/     Retratos usados em tela · arte/herois/ guarda o original
arte/cartas/         As 22 artes do Deck de Comando
arte/mapa/mapa.jpg   O mapa ilustrado
docs/                Regras, design e decisões. Leia na ordem numerada.
```

## Duas armadilhas que já custaram tempo

**1. `poderTotal`, `armTotal` e `ehAgil` são `const`.** Reatribuir lança `TypeError` e **mata o
script inteiro dali para baixo, sem erro visível no console** — o sintoma é uma função que "não
existe". Para dar bônus, escreva em `extraPoder`/`arm`/`agil` e guarde quanto aplicou. Ver
`aplicaBuff`/`limpaBuffs`.

**2. IDs duplicados entre `<section>` e o container interno.** `querySelector` pega o primeiro e
você apaga a seção inteira. Já aconteceu no guia.

## Como testar rápido

Abra `jogo/index.html`, F12, e dirija o estado pelo console:

```js
comeca(false,true)   // draft
comeca(true,false)   // tutorial
novo(); pinta()      // partida limpa
```

Ou peça: *"roda uma partida por script e me diz se dá erro"*.
