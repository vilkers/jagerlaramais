# JAGERLARAMAIS

Um MOBA de tabuleiro para **duas pessoas**. Cada jogador é o **técnico de cinco heróis** — um por rota — num mapa com três rotas, selva, rio e objetivos.

Feito por Vilker, Vinicius e Matheus.

> **Estado atual:** v15.1 pós-playtest, em validação. O modo contra IA saiu temporariamente para existir um único motor de partida e a equipe focar na mecânica. Ver `docs/versions/v15.1/README.md`.

---

## Jogar agora

**No celular ou no navegador:** abra `jogo/index.html`.
Não precisa instalar nada, não tem build, não tem servidor. É HTML/CSS/JS puro.

Na abertura você escolhe:
- **Tutorial** — 9 passos que ensinam jogando
- **Partida com draft** — ban e escolha de heróis antes de começar
- **Partida rápida** — times pré-montados

> ⚠️ O jogo é _hotseat_: os dois jogam no MESMO aparelho, passando o celular a cada turno. Ainda não existe multiplayer em rede.

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

## Estado do desenvolvimento — v15.1

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
| Poço épico (Dragão e Barão) | ✅ **funcionando** — casa [8,8] no tabuleiro 11×11, muda de morador na rodada 8 |
| Comeback / freio de bola de neve | ✅ **Retomada** — dado extra para quem está atrás |
| Feitiço compartilhado | ✅ **Lampejo ou Retorno**, recarga de 3 rodadas |
| Acampamentos | ✅ **3 acampamentos de ouro**, respawn de 3 rodadas |
| Arauto no tabuleiro | ❌ tem arte, não tem regra |
| Highlight estilo LoL no tutorial | ❌ não existe |
| Multiplayer em rede | ❌ não existe |

A v15.1 fechou em **22 rodadas de mediana** no diagnóstico intermediário (n=2000). Com os elencos trocados na metade da amostra, quem jogou primeiro venceu **39,4%**: há vantagem estrutural do segundo jogador a resolver, mas a compensação ainda não foi escolhida.

Detalhe do que mudou: `docs/patch-notes.md`. Retrato do presente: `docs/ESTADO.md`.

---

## Estrutura do repositório

```
jogo/index.html      A estrutura da tela. Abre com duplo clique.
jogo/estilo.css      Toda a aparência — mexer aqui não quebra regra.
jogo/motor.js        Estado, geometria, turno, combate e regras.
jogo/interface.js    Renderização, interação, manual e tutorial.
jogo/cartas.js       Deck de Comando e efeitos das cartas.
jogo/jogo.js         Draft, abertura e inicialização hotseat.
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
| `docs/UPDATE-PROTOCOL.md` | **Regra permanente para receber e integrar novas versões** |
| `docs/versions/v15.1/` | Registro, changelog e arquivos da consolidação pós-playtest |

---

## Limitações conhecidas

**1. Não dá para jogar cada um no seu celular.** O jogo é hotseat — um aparelho, passando a vez. Fazer multiplayer em rede exigiria servidor e sincronização de estado; é um projeto à parte, não um ajuste.

**2. A v15.1 ainda pede confirmação.** Épico, Retomada, feitiços, acampamentos e Plano de Caça chegaram juntos. A simulação serve para detectar quebra, mas não substitui playtest humano dessas decisões.

**3. A ordem estrita expôs vantagem do segundo jogador.** Na medição intermediária da v15.1, quem começou venceu **39,4%** com os elencos trocados (n=2000). O sinal é forte, mas a regra de compensação deve ser decidida e então validada em 20 mil partidas.

**4. Aparelho pequeno aperta o tabuleiro.** O mapa atual é 11×11 e ainda não foi reavaliado abaixo de 640px de altura. O restante da interface usa alvos de 40–44px; o mapa continua sendo o ponto crítico.

**5. O tutorial explica, mas não aponta.** Falta o highlight estilo LoL: escurecer a tela e iluminar só a região da vez.

---

## Próximos passos, na ordem

1. **Playtest de confirmação da v15.1** — alternância, múltiplos golpes em torre e leitura de escudo.
2. **Escolher uma compensação simples para quem abre** e medir com elencos trocados antes de aprovar.
3. **Highlight do tutorial.**
4. **Arauto** — o poço já sabe trocar de morador, então entra sem motor novo.
5. **Decidir os pontos abertos da v15.1** registrados em `docs/versions/v15.1/README.md`.
