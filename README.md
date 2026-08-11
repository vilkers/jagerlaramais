# JAGERLARAMAIS

Um MOBA de tabuleiro para **duas pessoas**. Cada jogador é o **técnico de cinco heróis** — um por rota — num mapa com três rotas, selva, rio e objetivos.

Feito por Vilker, Vinicius e Matheus.

---

## Jogar agora

**No celular ou no navegador:** abra `jogo/index.html`.
Não precisa instalar nada, não tem build, não tem servidor. É HTML/CSS/JS puro.

Na abertura você escolhe:
- **Tutorial** — 9 passos que ensinam jogando
- **Partida com draft** — ban e escolha de heróis antes de começar
- **Partida rápida** — times pré-montados

> ⚠️ **O jogo é _hotseat_: os dois jogam no MESMO aparelho**, passando o celular a cada turno. Ele **não** é multiplayer em rede — dois celulares diferentes ainda não funciona. Ver "Limitações conhecidas".

**Guia completo:** abra `guia/index.html` — o manual em formato de livro navegável.
**As cartas:** abra `cartas/index.html` — os 20 heróis em formato de carta.

---

## As três regras que explicam tudo

**1 · Um dado move o time inteiro.**
Você rola um **Dado Mestre** por rodada. O valor é o total de casas que os seus **cinco** heróis andam **juntos**. Aproximar o assassino custa o recuo do atirador.

**2 · Três dados de ação, cinco heróis.**
Cada dado alocado num herói vira a **Força** da habilidade dele. Toda habilidade tem uma Força mínima — ultimates pedem 5 ou 6.

**3 · Quem não age, enriquece.**
Herói que recebe dado ganha 1 de ouro. Quem fica de fora **farma 3**. Como só três dos cinco agem, dois sempre estão enriquecendo. **Agir custa dinheiro.**

---

## Estado do desenvolvimento — v0.6.2

| Sistema | Status |
|---|---|
| Motor de regras (movimento, combate, morte, respawn) | ✅ funcionando |
| Mapa hexagonal, torres, ondas, Nexus | ✅ funcionando |
| Tabuleiro | ✅ **11×11**, 116 casas, simétrico por construção e verificado por teste |
| Dado Mestre + 3 dados de ação | ✅ funcionando |
| Caçador com comando oculto (gank) | ✅ funcionando |
| Placas do Topo · Prioridade do Meio | ✅ funcionando |
| Loja e itens (22 itens) | ✅ funcionando |
| Tutorial guiado | ✅ funcionando |
| Draft com ban e counterpick | ✅ funcionando |
| Deck de Comando (46 cartas, 22 tipos) | ✅ funcionando, com face ilustrada |
| Pool de heróis | ✅ **20 heróis, 4 por rota** |
| Arte dos heróis | ✅ **20 de 20** |
| Mapa ilustrado | ✅ no guia, seção 05 |
| Poço épico (Dragão e Barão) | ✅ **funcionando** — casa [8,8], abre na rodada 5, vira Barão na 8 |
| Comeback / freio de bola de neve | ✅ **Retomada** — dado extra para quem está atrás |
| Herói derruba torre sozinho | ✅ **desde a v0.6.1** — bate na torre exposta, sem depender da onda |
| Nexus atacável por herói | ✅ **desde a v0.6.1** — exige uma rota inteira caída |
| Ergonomia de toque | ✅ auditada em 4 tamanhos de tela · alvos de 44px · arrastar para andar |
| Acampamentos de selva | ❌ **30 casas de selva, nenhum buff dentro** |
| Arauto no tabuleiro | ❌ tem arte, não tem regra |
| Zona de armadilha (cartas de reação) | ❌ 3 cartas declaram `quando:"reacao"` e o motor não lê o campo |
| Highlight estilo LoL no tutorial | ❌ não existe |
| Multiplayer em rede | ❌ não existe |

Uma partida completa fecha em **~19 rodadas** com os dois jogadores usando cartas — eram 15 antes
do tabuleiro crescer para 11×11.

Detalhe do que mudou: `docs/patch-notes.md`. Retrato do presente: `docs/ESTADO.md`.

---

## Estrutura do repositório

```
jogo/index.html      A estrutura da tela. Abre com duplo clique.
jogo/estilo.css      Toda a aparência — mexer aqui não quebra regra.
jogo/jogo.js         Motor de regras e interface.
guia/index.html      Manual navegável (regras, heróis, itens, mapa, glossário).
cartas/index.html    Visualizador das 20 cartas de herói.
data/catalogo.js     FONTE ÚNICA de conteúdo: heróis, itens, deck, classes.
arte/imagens.js      Índice de caminhos das imagens.
arte/herois/         Retratos · web/ é a versão leve usada em tela.
arte/cartas/         As 22 artes do Deck de Comando.
arte/mapa/           O mapa ilustrado.
arte/monstros/       Barão, Dragão e Arauto.
sim/bateria.js       Roda N partidas e imprime ritmo e assimetria. `node sim/bateria.js 20000`
sim/simetria.js      Confere se o tabuleiro é espelho de si mesmo. Sai com código 1 se falhar.
sim/motor.js         Carrega o jogo inteiro em Node, com DOM falso.
teste/JOGAR.html     O jogo inteiro em UM arquivo — para mandar para alguém testar.
docs/                Design, regras e decisões — leia na ordem numerada.
visual-lab/          Trilha de criação (universo, personagens, lore). Stack própria.
.claude/agents/      Agentes especializados para continuar o projeto no Claude.
```

### Documentos, na ordem

| Arquivo | O que tem |
|---|---|
| `docs/ESTADO.md` | **Comece por aqui numa janela nova.** Onde o jogo está agora |
| `docs/patch-notes.md` | Histórico de mudanças. Toda mudança de número está aqui |
| `docs/00-anatomia-moba.md` | Como um MOBA funciona e o que precisa sobreviver na mesa |
| `docs/01-proposta-v0.md` | O conceito do jogo do Técnico e o escopo |
| `docs/02-regras.md` | **As regras completas.** Comece por aqui para jogar |
| `docs/03-jogabilidade.md` | Os conflitos de interface que travavam o jogador, e as correções |
| `docs/04-draft-e-deck.md` | Draft, Deck de Comando e as cartas |
| `docs/REVISAO-EXTERNA.md` | A revisão do Vinicius e do Matheus, item a item, com o que a medição confirmou e o que ela derrubou |
| `docs/herois-aposentados.md` | Os 25 heróis que saíram na v0.4, prontos para voltar |
| `docs/ECOSSISTEMA.md` | **Como três pessoas (e duas IAs) mexem no mesmo jogo** sem se atropelar |
| `docs/ACESSO.md` | Para mandar para quem está entrando agora |
| `docs/COMO-CONTINUAR.md` | Como usar o Claude neste projeto |

---

## Limitações conhecidas

**1. Não dá para jogar cada um no seu celular.** O jogo é hotseat — um aparelho, passando a vez. Fazer multiplayer em rede exigiria servidor e sincronização de estado; é um projeto à parte, não um ajuste.

**2. Épico e Retomada não estão validados.** Estão no jogo desde a v0.5.5, mas `sim/bateria.js` não consegue medi-los: o agente joga ao acaso, então ela enxerga o custo (dado gasto, revide) e não o prêmio (Poder). Dando 6 dados extras à Retomada o número não se moveu. **Só playtest humano resolve.**

**3. Quem começa ganha 55,5%** (n=20000, z=15,4 — confirmado por segunda medição independente: 55,6%, z=15,7). Era 53,5% na v0.5.8, subiu para 57,1% na v0.6.1 e o tabuleiro 11×11 devolveu 1,6 ponto. Parte da diferença é o custo do épico e da Retomada que a simulação vê sem o prêmio que ela não vê — mas sobra um resto real. **É o problema aberto mais antigo do projeto.**

**4. Aparelho pequeno aperta o tabuleiro, e a v0.6.2 piorou isso.** Abaixo de 640px de altura o 8×8 já dava hexágono de ~28px, contra os 44 de referência de toque. O tabuleiro foi de 64 para **116 casas** e o hexágono encolhe junto. Todo o resto da tela está em 40–44px desde a v0.5.6; o mapa é o único que não alcança, não é conserto de CSS, e **ainda não foi reavaliado em tela pequena depois do 11×11**.

**5. O tutorial explica, mas não aponta.** Falta o highlight estilo LoL: escurecer a tela e iluminar só a região da vez.

**6. A selva está vazia.** O mapa 11×11 abriu 30 casas de selva para caber os acampamentos, e os acampamentos não entraram. Hoje elas são só atalho.

**7. Topo e baixo têm um estrangulamento de 1 casa.** O corredor foi desenhado com 2 de largura para suporte e atirador dividirem rota; o meio tem 2 em toda a extensão, topo e baixo têm um passo de 1. É simétrico entre os lados, então não dá vantagem a ninguém — mas naquele ponto a dupla ainda não passa junta.

---

## Próximos passos, na ordem

1. **Playtest de verdade** com as três pessoas — agora é o gargalo, não mais um item da lista. Épico, Retomada e loja dependem dele para serem ajustados, porque a simulação não os enxerga. Use `teste/JOGAR.html`: é o jogo inteiro num arquivo só, sem git e sem servidor.
2. **Acampamentos de selva** — a válvula contra dado ruim, e as 30 casas já estão lá esperando.
3. **Reavaliar o tabuleiro em tela pequena** depois do salto para 11×11.
4. **Arauto** — o poço já sabe trocar de morador, então entra sem motor novo.
5. **Highlight do tutorial.**
