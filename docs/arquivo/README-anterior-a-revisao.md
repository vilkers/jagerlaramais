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
Cada dado alocado num herói vira a **Força** da habilidade dele — e o **valor** do dado escolhe **qual** das três habilidades sai. A faixa é **exata**, sem "ou mais": **1–2** a básica, **3–5** a do meio, **6** a Ultimate. Um 6 é Ultimate de qualquer um dos cinco, e não desce para pagar uma básica.

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
| Poço épico (Dragão e Barão) | ✅ **funcionando** — casa [4,4], muda de morador na rodada 8 |
| Comeback / freio de bola de neve | ✅ **Retomada** — dado extra para quem está atrás |
| Arauto no tabuleiro | ❌ tem arte, não tem regra |
| Highlight estilo LoL no tutorial | ❌ não existe |
| Multiplayer em rede | ❌ não existe |

Uma partida completa fecha em **~15 rodadas** com os dois jogadores usando cartas.

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
| `docs/ECOSSISTEMA.md` | **Como três pessoas (e duas IAs) mexem no mesmo jogo** sem se atropelar |
| `docs/ACESSO.md` | Para mandar para quem está entrando agora |
| `docs/COMO-CONTINUAR.md` | Como usar o Claude neste projeto |

---

## Limitações conhecidas

**1. Não dá para jogar cada um no seu celular.** O jogo é hotseat — um aparelho, passando a vez. Fazer multiplayer em rede exigiria servidor e sincronização de estado; é um projeto à parte, não um ajuste.

**2. Épico e Retomada não estão validados.** Estão no jogo desde a v0.5.5, mas `sim/bateria.js` não consegue medi-los: o agente joga ao acaso, então ela enxerga o custo (dado gasto, revide) e não o prêmio (Poder). Dando 6 dados extras à Retomada o número não se moveu. **Só playtest humano resolve.**

**3. Quem começa ganha 53,5%** (n=20000). Sem épico e sem Retomada são 50,5%, então parte da diferença é o custo que a simulação vê sem o prêmio que ela não vê — mas sobra um resto real de acesso desigual ao poço, 48% contra 52% de encontros.

**4. Aparelho pequeno aperta o tabuleiro.** Abaixo de 640px de altura o 8×8 dá hexágono de ~28px, contra os 44 de referência de toque. Todo o resto da tela está em 40–44px desde a v0.5.6; o mapa é o único que não alcança, e não é conserto de CSS.

**5. O tutorial explica, mas não aponta.** Falta o highlight estilo LoL: escurecer a tela e iluminar só a região da vez.

---

## Próximos passos, na ordem

1. **Playtest de verdade** com as três pessoas — agora é o gargalo, não mais um item da lista. Épico e Retomada dependem dele para serem ajustados.
2. **Highlight do tutorial.**
3. **Arauto** — o poço já sabe trocar de morador, então entra sem motor novo.
4. **Acampamentos de selva** — a válvula contra dado ruim.
