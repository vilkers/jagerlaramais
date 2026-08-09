# Anatomia de um MOBA — o que precisa sobreviver na mesa

Base de estudo: League of Legends. Cada sistema está desmontado em três camadas:
**o que é** → **qual sensação ele entrega** (essa é a que importa) → **como cabe na mesa**.

Regra que atravessa o documento inteiro: **copiar a regra do LoL é o erro; copiar a sensação é o objetivo.**

---

## 1. O mapa é o jogo

**O que é.** Mapa assimétrico em diagonal. 3 rotas ligando duas bases, uma selva entre elas, um rio no meio. Torres escalonadas em cada rota, inibidor atrás delas, nexus no fim.

**A sensação.** Tensão espacial permanente. Você nunca está seguro, e a linha entre "seguro" e "morto" é uma decisão de 2 segundos. O mapa não é cenário — é o relógio, o placar e a ameaça ao mesmo tempo.

**Na mesa.** Grid de casas (hex ou quadrado) com zonas nomeadas. As torres viram *estruturas com vida e zona de ameaça*: entrar na zona inimiga custa dano automático. É isso que recria o "não posso passar daqui ainda".

> 3 rotas exigem ~6 jogadores pra fazer sentido. 2 rotas + selva funcionam em 4. Ver `01-proposta-v0.md`.

---

## 2. Creeps / ondas de minions

**O que é.** A cada 30s nasce uma onda de tropas fracas que anda sozinha rumo à base inimiga. Matar dá ouro. Dar o último golpe (*last hit*) é o que dá o ouro cheio.

**A sensação.** Ritmo e renda base. É o metrônomo da partida: enquanto nada acontece, a onda anda, e a onda andando **já é** algo acontecendo. Também é o que impede o jogo de ser só briga — quem só briga fica pobre.

**Na mesa.** Tokens que avançam 1 casa por rodada, automaticamente, na fase de manutenção. Ninguém controla, todo mundo lida. É a única parte do jogo que se move sem decisão — e é justamente por isso que ela cria pressão.

**Detalhe que vale ouro:** onda empurrada pra torre inimiga = você ganha tempo, mas fica exposto. Isso é *risco vs. renda* e é o dilema mais importante do early game. Precisa estar na mesa.

---

## 3. Ouro e economia

**O que é.** Renda passiva + last hit + abates + objetivos. Ouro só vira poder na loja, e a loja só existe na base.

**A sensação.** Progressão medida. Você sente o momento exato em que ficou mais forte (comprou o item), e sente o inimigo ficando mais forte junto. A viagem até a loja (*recall*) é custo real — você sai do mapa, dá espaço.

**Na mesa.** Ouro em tokens. Loja aberta só quando o campeão está na base (ou gastando uma ação de recall). Isso preserva o dilema: comprar agora com pouco, ou segurar e arriscar morrer com o ouro no bolso — porque **morrer não devia dar ouro pro banco, mas dá vantagem pro inimigo**.

---

## 4. Nível e experiência

**O que é.** XP de tropas e abates. Níveis 1–18. Habilidades desbloqueiam e sobem por ponto.

**A sensação.** Curva de poder e *spikes*. Nível 2 no early ganha luta. Nível 6 (ultimate) muda a rota. O jogo tem marcos, não uma rampa lisa.

**Na mesa.** Escala reduzida — **níveis 1 a 6** com dois spikes claros: nível 3 (segunda habilidade) e nível 5 ou 6 (ultimate). 18 níveis é contabilidade, não decisão.

---

## 5. Itens

**O que é.** Componentes baratos que se combinam em itens lendários. Cada classe tem caminhos ótimos. Um item errado é uma partida perdida.

**A sensação.** Autoria da build. É onde o jogador imprime intenção: "eles têm muito dano mágico, vou de resistência". Item é a resposta à composição inimiga — é *leitura de jogo virando poder*.

**Na mesa.** Baralho de loja com componentes e lendários. **A árvore de construção precisa ser curta**: componente → lendário, no máximo 2 componentes. Três camadas de upgrade viram planilha.

O que não pode se perder: **itens de resposta**. Se existe um item anti-cura, um anti-crítico, um anti-magia, o draft inimigo passa a importar. Sem eles, todo mundo compra a mesma build todo jogo e o meta morre.

---

## 6. Selva e monstros neutros

**O que é.** Acampamentos que renascem em timer, dando ouro/XP e buffs pessoais. Um jogador fica só nisso (o jungler) e usa a renda pra aparecer nas rotas.

**A sensação.** Ameaça invisível. O jungler é o motivo pelo qual você olha o minimapa. Ele transforma um duelo 1v1 em "1v1 que pode virar 1v2 a qualquer segundo".

**Na mesa.** Acampamentos como cartas viradas na zona de selva, com timer de renascimento em tokens. Buffs de acampamento (o azul e o vermelho do LoL) são **modificadores de dado** — encaixam perfeitamente no sistema de dados.

---

## 7. Objetivos épicos

**O que é.** Dragão (buff acumulativo de time), Arauto (empurra rota), Barão (buff temporário devastador). Todos com timer fixo, todos contestáveis, todos no rio — território neutro.

**A sensação.** **Este é o sistema mais importante para adaptar.** O objetivo épico é o que impede o jogo de ser passivo. Ele coloca um relógio na mesa e diz "às 20h alguém vai ter que brigar". Sem ele, dois times cautelosos jogam pra sempre.

Barão não é um buff — é o **botão de ponto-sem-volta**. Dragão não é buff — é **investimento de longo prazo que compõe**.

**Na mesa.** Timer visível como track de tokens: todo mundo vê o objetivo chegando e se posiciona antes. A antecipação é metade do prazer. E o objetivo deve ser **contestável até o último instante** — quem dá o golpe final leva, mesmo tendo chegado depois. Esse roubo é uma das melhores histórias que o jogo produz.

---

## 8. Visão e fog of war

**O que é.** Você só vê onde tem aliado ou ward. O resto é escuro.

**A sensação.** Paranoia produtiva. Informação é recurso, e comprar informação (ward) é decisão econômica real.

**Na mesa.** É a parte **mais cara** de traduzir — informação oculta em jogo de tabuleiro exige biombo, app ou mestre. Recomendação: **começar com informação aberta**, e introduzir uma versão barata depois (ex: campeão fora da visão inimiga vira ficha virada, sem revelar o nível ou o dado). Ver `01-proposta-v0.md`.

---

## 9. Morte e respawn

**O que é.** Morreu, sai do mapa por N segundos (N cresce com o nível). Quem matou leva ouro; quem estava com sequência de abates vale mais (*shutdown*).

**A sensação.** Punição proporcional e comeback possível. O shutdown é a mecânica de freio da bola de neve — matar quem está muito à frente paga muito.

**Na mesa.** Timer de respawn em rodadas (1 → 2 → 3 conforme o nível). Recompensa de abate escalando com o quão à frente a vítima estava. **Isso não é detalhe — é o que impede a partida de acabar no turno 5.**

---

## 10. Composição, draft e meta

**O que é.** Antes da partida, cada time escolhe (e bane) campeões, vendo as escolhas do inimigo. Composições têm identidade: mergulho, poke, front-to-back, split push.

**A sensação.** O jogo começa antes do jogo. O draft é onde você já ganha ou perde vantagem, e é a camada que faz o mesmo grupo de amigos jogar 50 partidas diferentes com as mesmas cartas.

**Na mesa.** **Pick/ban é a mecânica de melhor custo-benefício do projeto inteiro** — custa zero componente novo, adiciona 10 minutos de tensão pura e cria meta sozinho. Deve estar na v0.

---

## O que muda ao sair do tempo real

| No LoL | O que o turno quebra | Solução na mesa |
|---|---|---|
| Skillshot / mira | Não existe execução manual | Dado + posicionamento: acertar vira alcance + rolagem |
| Cooldown em segundos | Não há segundo | Cooldown em rodadas, marcado com token na carta |
| Reação instantânea | Turno é sequencial | Janela de reação: recursos guardados que podem ser gastos fora do seu turno |
| Movimentação contínua | Grid é discreto | Alcance em casas; deslocamentos (dash/flash) viram teleporte curto |
| Farm constante | Sem tempo morto | Farm vira uma ação disputando espaço com atacar/mover — e isso é *melhor*, porque vira decisão |
| 5v5 (10 pessoas) | Ninguém junta 10 amigos | Escala reduzida com papéis condensados |
| Partida de 30 min contínuos | Turnos alongam tudo | Encurtar o mapa e a curva de nível, não a quantidade de decisões |

---

## As três armadilhas

1. **Simular o LoL em vez de evocá-lo.** Se a ficha do campeão tem 12 estatísticas, o jogo morreu antes de nascer.
2. **Dado como resultado puro.** Se a sorte decide o combate, a decisão de posicionamento vira decoração — e o jogo deixa de ser MOBA e vira Banco Imobiliário com espadas.
3. **Tempo morto do jogador.** No LoL você joga 100% do tempo. Se na mesa você joga 20% do tempo, a fantasia quebra. **Todo jogador precisa ter algo a decidir no turno dos outros.**

---

## Referências de mesa que já resolveram partes disso

| Jogo | O que roubar |
|---|---|
| **Guards of Atlantis II** | O MOBA de tabuleiro que funciona. Controle de onda, ativação por cartas, papéis distintos |
| **Dice Throne** | Dado como recurso alocável em habilidades — não como resultado |
| **Summoner Wars** | Rotas, unidades descartáveis, economia por descarte |
| **Gloomhaven** | Iniciativa por carta, cooldown por exaustão |
| **Root** | Assimetria forte que continua legível na mesa |
| **Star Realms** | Curva econômica que sobe rápido sem virar planilha |
