# JAGERLARAMAIS

Um MOBA de tabuleiro para **duas pessoas**. Cada jogador é o **técnico de cinco heróis** — um por rota — num mapa com três rotas, selva, rio e objetivos.

Feito por Vilker, Vinicius e Matheus.

> Os números deste arquivo saem do código, não da memória de quem escreve.
> Ver `docs/DOCUMENTACAO.md` — e, ao mudar o jogo, rodar `node sim/docs.js --escrever`.

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
**As cartas:** abra `cartas/index.html` — os <!--n:herois-->20<!--/n--> heróis em formato de carta.

---

## As três regras que explicam tudo

**1 · Um dado move o time inteiro.**
Você rola um **Dado Mestre** por rodada. O valor é o total de casas que os seus **cinco** heróis andam **juntos**. Aproximar o assassino custa o recuo do atirador.

**2 · Três dados de ação, cinco heróis.**
Cada dado alocado num herói vira a **Força** da habilidade dele. Toda habilidade tem uma Força mínima — ultimates pedem 5 ou 6.

**3 · Quem não age, enriquece.**
Herói que recebe dado ganha <!--n:ouroAgiu-->1<!--/n--> de ouro. Quem fica de fora **farma <!--n:ouroFarmou-->3<!--/n-->**. Como só três dos cinco agem, dois sempre estão enriquecendo. **Agir custa dinheiro.**

---

## Estado do desenvolvimento — <!--n:versao-->v0.6.3<!--/n-->

> **Em teste, não aprovada.** A leva v0.5.9 → v0.6.2 mudou tamanho de tabuleiro e
> condição de vitória, e espera o julgamento dos três. Ver `teste/LEIA.md`.

| Sistema | Status |
|---|---|
| Motor de regras (movimento, combate, morte, respawn) | ✅ funcionando |
| Mapa hexagonal, torres, ondas, Nexus | ✅ funcionando |
| Dado Mestre + 3 dados de ação | ✅ funcionando |
| Caçador com comando oculto (gank) | ✅ funcionando |
| Placas do Topo · Prioridade do Meio | ✅ funcionando |
| Loja e itens (<!--n:itens-->22<!--/n--> itens) | ✅ funcionando |
| Tutorial guiado | ✅ funcionando |
| Draft com ban e counterpick | ✅ funcionando |
| Deck de Comando (<!--n:cartas-->46<!--/n--> cartas, <!--n:tiposCarta-->22<!--/n--> tipos) | ✅ funcionando, com face ilustrada |
| Pool de heróis | ✅ **<!--n:herois-->20<!--/n--> heróis, <!--n:heroisPorRota-->4<!--/n--> por rota** |
| Arte dos heróis | ✅ <!--n:herois-->20<!--/n--> de <!--n:herois-->20<!--/n--> |
| Mapa ilustrado | ✅ no guia, seção 05 |
| Poço épico (Dragão e Barão) | ✅ **funcionando** — casa <!--n:poco-->[8,8]<!--/n-->, muda de morador na rodada <!--n:rodadaBarao-->8<!--/n--> |
| Comeback / freio de bola de neve | ✅ **Retomada** — dado extra para quem está atrás |
| Herói derruba torre e Nexus | ✅ **desde a v0.6.1** — sem depender da onda |
| Zona de armadilha (cartas de reação) | ❌ o campo existe no catálogo, o motor não lê |
| Acampamentos de selva | ❌ a selva tem <!--n:casasSelva-->30<!--/n--> casas e nenhum acampamento |
| Arauto no tabuleiro | ❌ tem arte, não tem regra |
| Highlight estilo LoL no tutorial | ❌ não existe |
| Multiplayer em rede | ❌ não existe |

Uma partida completa fecha em **~19 rodadas** (mediana medida, n=20000, v0.6.2).

Detalhe do que mudou: `docs/patch-notes.md`. Retrato do presente: `docs/ESTADO.md`.

---

## O tabuleiro de hoje

| | |
|---|---|
| Tamanho | **<!--n:tabuleiro-->11×11<!--/n-->**, <!--n:casas-->116<!--/n--> casas jogáveis |
| Selva | <!--n:casasSelva-->30<!--/n--> casas |
| Rotas | corredor de <!--n:casasCorredor-->82<!--/n--> casas, **2 de largura**, estreitando só na boca da base |
| Torres | <!--n:torres-->12<!--/n--> ao todo · <!--n:vidaTorre-->3<!--/n--> de vida · revidam <!--n:revideTorre-->2<!--/n--> em quem encosta |
| Nexus | <!--n:vidaNexus-->3<!--/n--> de vida, exposto só quando uma rota inteira cai |
| Poço épico | casa <!--n:poco-->[8,8]<!--/n--> · Dragão (<!--n:vidaDragao-->3<!--/n--> de vida) da rodada <!--n:rodadaDragao-->5<!--/n-->, Barão (<!--n:vidaBarao-->5<!--/n-->) da <!--n:rodadaBarao-->8<!--/n--> |

O mapa **é gerado**, não escrito à mão: sai de `const N` em `jogo/jogo.js`, por metade
espelhada em coordenada cúbica. Mudar `N` redesenha rotas, bases, rio e torres.
`node sim/simetria.js` prova que os dois lados são iguais e sai com código 1 se não forem.

---

## Estrutura do repositório

```
jogo/index.html      A estrutura da tela. Abre com duplo clique.
jogo/estilo.css      Toda a aparência — mexer aqui não quebra regra.
jogo/jogo.js         Motor de regras e interface.
guia/index.html      Manual navegável (regras, heróis, itens, mapa, glossário).
cartas/index.html    Visualizador das cartas de herói.
data/catalogo.js     FONTE ÚNICA de conteúdo: heróis, itens, deck, classes.
arte/imagens.js      Índice de caminhos das imagens.
arte/herois/         Retratos · web/ é a versão leve usada em tela.
arte/cartas/         As artes do Deck de Comando.
arte/mapa/           O mapa ilustrado.
arte/monstros/       Barão, Dragão e Arauto.
sim/                 Medição e testes — rodam em Node, sem navegador.
teste/               Empacotador de arquivo único, para quem vai avaliar.
docs/                Design, regras e decisões — leia na ordem numerada.
.claude/             Agentes e automações para continuar o projeto no Claude.
```

### Os scripts

```bash
node sim/bateria.js 20000   # ritmo e assimetria. Leia o cabeçalho: ela é cega a escolha
node sim/simetria.js        # o tabuleiro é espelho de si mesmo? sai 1 se não for
node sim/numeros.js         # os números canônicos, extraídos do código
node sim/docs.js            # a documentação bate com o código? sai 1 se não bater
node sim/docs.js --escrever # atualiza os números da documentação
node teste/empacota.js      # gera teste/JOGAR.html, o jogo inteiro num arquivo só
```

### Documentos, na ordem

| Arquivo | O que tem |
|---|---|
| `docs/ESTADO.md` | **Comece por aqui numa janela nova.** Onde o jogo está agora |
| `docs/patch-notes.md` | Histórico de mudanças. Toda mudança de número está aqui |
| `docs/DOCUMENTACAO.md` | **Como a documentação se mantém sozinha.** Leia antes de mexer em número |
| `docs/glossario.md` | O léxico. Termo definido não muda de nome |
| `docs/00-anatomia-moba.md` | Como um MOBA funciona e o que precisa sobreviver na mesa |
| `docs/01-proposta-v0.md` | O conceito do jogo do Técnico e o escopo |
| `docs/02-regras.md` | **As regras completas.** Comece por aqui para jogar |
| `docs/03-jogabilidade.md` | Os conflitos de interface que travavam o jogador, e as correções |
| `docs/04-draft-e-deck.md` | Draft, Deck de Comando e as cartas |
| `docs/herois-aposentados.md` | Os heróis que saíram na v0.4, prontos para voltar |
| `docs/ECOSSISTEMA.md` | **Como três pessoas (e duas IAs) mexem no mesmo jogo** sem se atropelar |
| `docs/ACESSO.md` | Para mandar para quem está entrando agora |
| `docs/COMO-CONTINUAR.md` | Como usar o Claude neste projeto |
| `docs/REVISAO-EXTERNA.md` | A revisão do Vinicius e do Matheus, item a item |

---

## Limitações conhecidas

**1. Não dá para jogar cada um no seu celular.** O jogo é hotseat — um aparelho, passando a vez. Fazer multiplayer em rede exigiria servidor e sincronização de estado; é um projeto à parte, não um ajuste.

**2. Épico e Retomada não estão validados.** Estão no jogo desde a v0.5.5, mas `sim/bateria.js` não consegue medi-los: o agente joga ao acaso, então ela enxerga o custo (dado gasto, revide) e não o prêmio (Poder). Dando 6 dados extras à Retomada o número não se moveu. **Só playtest humano resolve.**

**3. Quem começa ganha 55,5%** (z=15,41, n=20000, v0.6.2) — era 53,5% na v0.5.8 e chegou a 57,1% na v0.6.1. O tabuleiro maior devolveu 1,6 ponto e ainda sobram +2,0 sobre a base. Não é ruído, e o freio continua sendo o comeback.

**4. O hexágono encolheu.** Com o tabuleiro <!--n:tabuleiro-->11×11<!--/n--> ele fica em ~33px numa tela de 390px de largura, contra os **44px** de referência de toque do projeto. A peça vale o hexágono inteiro, então dá para jogar — mas é o menor alvo já medido, e precisa de olho humano em tela pequena.

**5. O tutorial explica, mas não aponta.** Falta o highlight estilo LoL: escurecer a tela e iluminar só a região da vez.

**6. O visualizador de mapa do guia está atrasado.** Ele desenha um 7×7 escrito à mão, da era anterior ao mapa gerado. `node sim/docs.js` avisa disso toda vez.

---

## Próximos passos, na ordem

1. **Playtest de verdade** com as três pessoas — agora é o gargalo, não mais um item da lista. Épico, Retomada e a loja dependem dele.
2. **Highlight do tutorial.**
3. **Arauto** — o poço já sabe trocar de morador, então entra sem motor novo.
4. **Acampamentos de selva** — a válvula contra dado ruim, e o que dá função às <!--n:casasSelva-->30<!--/n--> casas de selva.
5. **Zona de armadilha** — fazer o motor ler o `quando:"reacao"` que o catálogo já declara.
