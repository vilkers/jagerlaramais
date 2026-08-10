# Patch notes — JAGERLARAMAIS

Histórico de mudanças. **Append-only**: entrada nova vai no topo, entrada antiga nunca é reescrita.
Regra do projeto: *toda mudança de número vira patch note.*

Como escrever uma entrada:

```
## vX.Y — título curto · AAAA-MM-DD
### O que mudou
### Por quê
### O que isso quebra
```

Se você mudou um número, a linha tem que dizer **de quanto para quanto**.

---

## v0.5.1 — a torre virou alvo, e sete habilidades voltaram a funcionar · 2026-08-09

### O que mudou

**Herói agora derruba torre.** Era o gesto central de MOBA que não existia: as torres estavam no
motor desde a v0.1, mas a lista de alvos só era preenchida com heróis, então o jogador empurrava
onda e esperava. Agora:

- Torre vira alvo de qualquer habilidade de dano contra inimigo — mira vermelha, um toque.
- **Só se a sua Frente de Onda já estiver encostada nela.** Sem isso um assassino sozinho derrubaria
  a base pelas costas. Quem derruba torre é a onda; o herói acelera.
- Golpe de herói tira **1 fixo** — a Força não entra. Torre não tem armadura, escudo nem status.
- **Uma torre aceita um golpe de herói por rodada.** Zera no fim da rodada.
- A torre **revida 2** em quem encostou. O revide **nunca mata**: para no último ponto de vida.
  É pedágio, não morte sem autor — `mata()` precisa de alguém para creditar o ouro.
- O golpe que derruba a torre não leva revide.

**Vida da torre: de 2 para 3.** Com o herói somando dano, 2 fazia a torre evaporar. Simulei partidas
por configuração com jogador aleatório: com **2** a mediana era **10 rodadas**, com **4** passava de
**18**, com **3** deu **13** — perto do alvo de ~15, e ainda sobra espaço para o herói cortar o
cerco pela metade.

### Bugs corrigidos

**`desloca()` estava com a direção invertida e ignorava a distância.** Puxar afastava e empurrar
aproximava, e todo deslocamento era de 1 casa independente do valor da habilidade — o Gancho do
Torvald (`puxar:3`) arrastava 1 casa, para o lado errado. Sete habilidades voltaram a funcionar:
Provocar, Puxada, Investida, Gancho, Investir, Puxada Funda e Empurrão.

**Item de alcance não valia para habilidade.** A mira usava `h.alc` cru em vez de `alcTotal(h)`.
O Cetro Cinéreo diz "+1 de Alcance", a carta do herói mostrava 4, e o motor mirava com 3.

**Gank ignorava os itens do Caçador.** O dano usava `cac.poder` em vez de `poderTotal(cac)` — os
itens e a aura ficavam de fora justo na jogada principal da selva.

**"Nova partida" não reiniciava o baralho.** A tela de fim chamava `novo()`, que reseta o tabuleiro
mas não o Deck de Comando: a partida seguinte começava com as mãos e o cemitério da anterior.
Agora chama `partida()`.

**Carta "avance a Frente de Onda" empurrava sem limite.** Não passava por trava nenhuma, e a frente
podia sair da rota. Agora usa a mesma regra do fim de rodada — torre viva trava o avanço.

### Faxina

Quatro funções tinham duas definições no mesmo arquivo, com a segunda sobrescrevendo a primeira em
silêncio: `calcula`, `perguntaCaca`, `abreLoja` e a órfã `alocaDado`. Quem editasse a cópia de cima
não veria efeito nenhum — o mesmo tipo de armadilha que os três catálogos de herói já criaram uma
vez. **78 linhas mortas a menos.**

### O que isso quebra

Quem tinha decorado que Provocar afastava vai levar um susto: agora puxa, que é o que a carta sempre
disse. Nenhum número de herói ou item mudou.

### Ressalva honesta

A calibragem da torre veio de jogador **aleatório**, que quase nunca usa o golpe em torre — mede o
ritmo só-onda. Amostra pequena e muitas partidas nem fecharam dentro do orçamento de tempo. Serve
para escolher entre 2, 3 e 4; **não** substitui playtest humano.

---

## v0.4 — corte de pool, arte completa e fonte única · 2026-08-08

### O que mudou

**Pool de heróis: 45 → 20.** Quatro por rota, um arquétipo distinto cada.

| Rota | Heróis |
|---|---|
| Topo | Vharn (tanque de controle) · Kaross (executor) · Ilva (mago de rota) · Xhera (bruiser com dreno) |
| Selva | Nyx (assassino) · Grumo (tanque que farma) · Kurr (rastreador à distância) · Pyk (gancho e execução) |
| Meio | Solenne (artilharia) · Zhet (assassino) · Nira (controlador) · Arden (dreno em área) |
| Atirador | Vesper (sustentado) · Cael (armadilheiro) · Nessa (móvel, executa) · Corvo (sniper alcance 4) |
| Suporte | Mirrha (curandeira) · Torvald (gancho com visão) · Gorm (escudo e engage) · Vidra (visão e doação de dado) |

Saíram 25: Draska, Orbek, Sarn, Thane, Vixa, Morgo, Vysh, Sombro, Lumen, Vok, Astra, Lyra, Bruk,
Rhia, Duno, Wren, Elna, Iseu, Vera, Ondi, Grald, Brann, Umbro, Skarn, Ygra.
Ficam em `docs/herois-aposentados.md`, prontos para colar de volta — nenhum foi perdido.

**Nenhum número de herói foi alterado.** Os 20 que ficaram mantêm vida, poder, armadura, alcance
e Força mínima exatamente como estavam.

**Banimento agora respeita a rota.** Antes: dois bans livres. Agora: **uma rota só pode perder um herói**.
Com 4 por rota, dois bans na mesma rota deixariam exatamente 2 heróis para 2 escolhas — counterpick zero.

**Arte:** 10 → 20 retratos. Todo herói do pool tem retrato pintado. O retrato provisório
(inicial sobre a cor da rota) virou só rede de segurança para id novo sem imagem.

**Deck de Comando ganhou face ilustrada.** As 22 cartas têm arte própria. Quando você compra no início
do turno, a carta **vira na tela** em tamanho grande, com a ilustração. Na mão, cada carta traz miniatura.
Nenhum efeito de carta mudou.

**Mapa ilustrado.** Entrou em `arte/mapa/mapa.jpg` e aparece no guia, seção 05. É referência de ficção —
o tabuleiro hexagonal continua sendo o que se joga.

**Peso dos arquivos.** `arte/imagens.js` era 275 KB de base64; virou índice de caminhos, 1,5 KB.
As ilustrações de monstro foram de ~23 MB (PNG) para 636 KB (JPG). O repositório inteiro de arte
fecha em ~9 MB.

### Por quê

O pool de 45 tinha 35 heróis sem arte, com retrato de letra. O draft ficava longo, feio e sem
identidade, e ninguém decorava 45 nomes. 20 com arte vale mais que 45 sem.

### O que isso quebra

Time salvo com herói aposentado não carrega mais. Como não existe save, não quebra nada em jogo.

---

## v0.4 — fonte única de verdade (mesmo patch, mudança estrutural) · 2026-08-08

### O que mudou

O jogo tinha **três catálogos de heróis** vivendo em paralelo:

| Onde | O que tinha | Estava |
|---|---|---|
| `jogo/index.html` | os 10 originais, formato do motor | correto |
| `guia/index.html` | os mesmos 10, formato próprio | **números da v0.1** — Vharn com 8 de vida em vez de 14 |
| `cartas/index.html` | os mesmos 10, terceiro formato | textos divergindo do motor |

Agora **`data/catalogo.js` é o único lugar** com conteúdo. Ele exporta:

- `HEROIS_BASE` — os 10 originais (vieram de dentro do `jogo/index.html`)
- `HEROIS_NOVOS` — os 10 da expansão
- `HEROIS` — os dois juntos, o catálogo de verdade
- `CLASSES` — a tabela de personalidade por classe
- `textoHab(hab)` — traduz o objeto de efeito do motor para português de manual
- `ITENS_NOVOS`, `DECK`, `montaDeck()`, `ORDEM_DRAFT`, `BANS`

`jogo/`, `guia/` e `cartas/` passaram a carregar `../data/catalogo.js` e a renderizar a partir dele.

### Por quê

Mexer no número de um herói exigia lembrar de três arquivos. Ninguém lembra de três arquivos.
Com três pessoas mexendo ao mesmo tempo, isso vira conflito toda semana.

### O que isso quebra

Quem tinha edições locais na lista de heróis do guia ou do visualizador de cartas perde essas
edições — o conteúdo agora vem do catálogo. Refaça em `data/catalogo.js` e as três telas pegam juntas.

---

## v0.3 — draft e Deck de Comando · 2026-08-08

- **Draft** com 2 banimentos e escolha alternada por rota (counterpick).
- **Deck de Comando**: 46 cartas em 22 tipos, 7 famílias (dado, tempo, reação, mapa, economia, buff, item).
  Compra 1 no início do turno, mão máxima 3, usadas vão para o cemitério.
- Buffs temporários (`aplicaBuff`/`limpaBuffs`) duram até o fim da rodada.
- Pool foi para 45 heróis e a loja para 22 itens.
- Partida completa passou a fechar em ~15 rodadas (era ~30 sem deck).

## v0.2 — jogabilidade e tutorial · 2026-08-08

- Seis conflitos de interface corrigidos (ver `docs/03-jogabilidade.md`): painel de comando explícito,
  cancelamento antes de gastar o dado, aviso de "ninguém no alcance", confirmação em dois toques,
  estado de seleção unificado, descrição calculada do efeito.
- Tutorial guiado de 9 passos.
- `<meta viewport>` — sem ele o celular renderizava a 980px e o jogo saía minúsculo.

## v0.1 — protótipo jogável · 2026-08-08

- Motor: mapa hexagonal, movimento, combate, morte, respawn, torres, ondas, Nexus.
- Dado Mestre de movimento + 3 dados de ação.
- Caçador com comando oculto. Placas do Topo, Prioridade do Meio.
- 10 heróis, 12 itens, loja.
