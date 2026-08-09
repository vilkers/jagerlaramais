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

## Estado do desenvolvimento — v0.4

| Sistema | Status |
|---|---|
| Motor de regras (movimento, combate, morte, respawn) | ✅ funcionando |
| Mapa hexagonal, torres, ondas, Nexus | ✅ funcionando |
| Dado Mestre + 3 dados de ação | ✅ funcionando |
| Caçador com comando oculto (gank) | ✅ funcionando |
| Placas do Topo · Prioridade do Meio | ✅ funcionando |
| Loja e itens (22 itens) | ✅ funcionando |
| Tutorial guiado | ✅ funcionando |
| Draft com ban e counterpick | ✅ funcionando |
| Deck de Comando (46 cartas) | ✅ funcionando, com face ilustrada |
| Pool de heróis | ✅ **20 heróis, 4 por rota** |
| Arte dos heróis | ✅ **20 de 20** |
| Mapa ilustrado | ✅ no guia, seção 05 |
| Objetivos épicos (Dragão, Barão) no tabuleiro | ❌ nas regras e no mapa, fora do jogo |
| Comeback / freio de bola de neve | ❌ não existe |
| Highlight estilo LoL no tutorial | ❌ não existe |
| Multiplayer em rede | ❌ não existe |

Uma partida completa fecha em **~15 rodadas** com os dois jogadores usando cartas.

Detalhe do que mudou: `docs/patch-notes.md`. Retrato do presente: `docs/ESTADO.md`.

---

## Estrutura do repositório

```
jogo/index.html      O jogo. Arquivo único, abre com duplo clique.
guia/index.html      Manual navegável (regras, heróis, itens, mapa, glossário).
cartas/index.html    Visualizador das 20 cartas de herói.
data/catalogo.js     FONTE ÚNICA de conteúdo: heróis, itens, deck, classes.
arte/imagens.js      Índice de caminhos das imagens.
arte/herois/         Retratos · web/ é a versão leve usada em tela.
arte/cartas/         As 22 artes do Deck de Comando.
arte/mapa/           O mapa ilustrado.
arte/monstros/       Barão, Dragão e Arauto.
docs/                Design, regras e decisões — leia na ordem numerada.
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
| `docs/herois-aposentados.md` | Os 25 heróis que saíram na v0.4, prontos para voltar |
| `docs/ECOSSISTEMA.md` | **Como três pessoas mexem no mesmo jogo** sem se atropelar |
| `docs/ACESSO.md` | Para mandar para quem está entrando agora |
| `docs/COMO-CONTINUAR.md` | Como usar o Claude neste projeto |

---

## Limitações conhecidas

**1. Não dá para jogar cada um no seu celular.** O jogo é hotseat — um aparelho, passando a vez. Fazer multiplayer em rede exigiria servidor e sincronização de estado; é um projeto à parte, não um ajuste.

**2. Falta pressão de tempo.** Sem os objetivos épicos no tabuleiro, dois jogadores passivos arrastam a partida. É a próxima correção prioritária.

**3. Sem comeback.** Quem abre vantagem não devolve nada. Precisa de playtest para medir o tamanho do problema.

**4. O tutorial explica, mas não aponta.** Falta o highlight estilo LoL: escurecer a tela e iluminar só a região da vez.

---

## Próximos passos, na ordem

1. **Objetivos épicos no tabuleiro** — Dragão na rodada 5, Barão na 8. Resolve a passividade e é uma tarde de trabalho.
2. **Comeback** — carta extra ou ouro para quem está atrás.
3. **Highlight do tutorial.**
4. **Playtest de verdade** com as três pessoas e anotação do que trava.
