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
