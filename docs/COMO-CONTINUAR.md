# Como continuar o Jagerlaramais no Claude

Para Vinicius, Matheus, ou qualquer pessoa que pegar este repositório.

---

## Em 2 minutos

1. Clone o repositório e abra a pasta no **Claude Code** (terminal, app, ou claude.ai/code).
2. Abra `jogo/index.html` no navegador e **jogue o tutorial**. Não pule — o projeto inteiro faz sentido depois dele.
3. Leia `docs/02-regras.md`.
4. Peça o que você quiser mudar. O Claude já vai entender o contexto: existe um `CLAUDE.md` na raiz que ele lê sozinho.

**Numa janela nova, comece por isto** — gasta pouco contexto e já situa o Claude:

```
Leia docs/ESTADO.md e docs/patch-notes.md e me diga em que pé está o jogo.
```

Entrando agora no projeto? `docs/ACESSO.md`. Mexendo em grupo? `docs/ECOSSISTEMA.md`.

---

## O que já está pronto e o que não está

Veja a tabela de status no `README.md`. Resumindo o que **falta** e vale atacar:

| Prioridade | O que | Por quê |
|---|---|---|
| 🔴 1 | **Playtest humano** do poço épico, da Retomada e da loja | Entraram na v0.5.5–v0.5.7 e a simulação **não consegue medi-los** — ver abaixo. Mande `teste/JOGAR.html`: é o jogo inteiro num arquivo só |
| 🟠 2 | Acampamentos de selva | Buffs Azul e Vermelho, as válvulas contra dado ruim. **A v0.6.2 abriu 30 casas de selva e não pôs nada dentro** |
| 🟠 3 | Reavaliar o tabuleiro em tela pequena | O mapa saltou de 64 para 116 casas na v0.6.2 e o hexágono encolheu junto. Nunca foi reavaliado depois disso |
| 🟡 4 | Arauto no tabuleiro | Tem arte e o poço já troca de morador — entra sem motor novo |
| 🟡 5 | Highlight estilo LoL no tutorial | Ele explica, mas não aponta para onde tocar |
| 🟡 6 | Zona de armadilha | 3 cartas declaram `quando:"reacao"` e o motor nunca lê esse campo |
| 🟡 7 | Feitiços de invocador | 5 cartas, alto retorno em história |

> **Cuidado com `sim/bateria.js`.** Ela mede estrutura (geometria, onda, torre, ritmo) muito bem e
> é **cega a qualquer mecânica de escolha** — épico, Retomada, Prioridade, Placas, itens, cartas.
> O agente joga ao acaso, então dado a mais não vira vitória. Medido: 6 dados extras por turno não
> moveram o número. Ela vê o custo e não vê o prêmio. Leia o cabeçalho do arquivo antes de usar.

---

## Os agentes do projeto

Este repositório traz agentes especializados em `.claude/agents/`. Chame com `@nome`:

| Agente | Para quê |
|---|---|
| `@game-director` | Escopo: o que entra, o que corta, roadmap. É o dono do "não" |
| `@moba-analyst` | Como funciona no LoL e como traduzir para a mesa |
| `@systems-designer` | Mecânicas, loop de turno, economia |
| `@balance-math` | Probabilidade, TTK, curvas — escreve e roda simulação |
| `@card-smith` | Texto e nome de cartas, templating |
| `@web-prototyper` | O guia web e o jogo |
| `@playtester` | Quebrar o jogo antes dos jogadores |
| `@ux-game` | Onde o jogador trava, tutorial, clareza de tela |

Exemplos que funcionam bem:

```
@balance-math o Vysh com Verbo Final está forte demais? simula 500 duelos
@playtester tenta quebrar o Deck de Comando, procura combo infinito
@ux-game joga o tutorial no celular e me diz onde eu travaria
@game-director vale a pena adicionar feitiços de invocador agora?
```

---

## As regras do projeto (respeite ou o Claude vai brigar)

Estão no `CLAUDE.md` da raiz, que o Claude lê automaticamente:

- **`data/catalogo.js` é a fonte de verdade** do conteúdo — jogo, guia e cartas leem dele.
  Nunca escreva carta direto no HTML: foi assim que nasceram três catálogos divergentes.
- **Vanilla puro** — sem framework, sem npm, sem CDN. O jogo tem que abrir com duplo clique.
- **Nomes e história são autorais.** A referência ao LoL é interna (o campo `ref` de cada herói) e nunca aparece no produto.
- **Glossário é lei.** Termo definido não muda de nome.
- **Toda mudança de número vira patch note** em `docs/patch-notes.md`, dizendo de quanto para quanto.

---

## Como o jogo está montado por dentro

Um arquivo, três camadas, nesta ordem:

```
jogo/index.html      HUD · mapa (SVG) · painel de comando · bottom sheet
jogo/estilo.css      CSS mobile-first, tokens em :root
jogo/jogo.js
    ├── CATÁLOGO     lê data/catalogo.js — este arquivo não guarda conteúdo
    ├── GEOMETRIA    grid hexagonal, rotas, torres
    ├── ESTADO       novo(), o objeto J com a partida inteira
    ├── TURNO        fase oculta → turno → revelação → fim de rodada
    ├── AÇÕES        alocaDado, moveAte, usaHab, aplicaDano
    ├── DECK/DRAFT   compra, jogaCarta, iniciaDraft
    └── UI           pinta(), desenhaMapa(), telas
```

**A separação que importa:** o *motor de regras* (catálogo → ações) é estável e não deve mudar quando você mexe na aparência. A *camada de UI* (`pinta`, `desenhaMapa`, telas) já foi reescrita duas vezes sem quebrar o motor. Mantenha assim.

Na v0.4.1 o arquivo único virou três, para que visual e motor possam ser mexidos em paralelo — por duas pessoas ou por duas IAs. Ver `docs/ECOSSISTEMA.md`.

### Duas armadilhas que já custaram tempo

> A lista completa — são seis — está em `docs/ESTADO.md`. Estas duas são as que matam o script
> inteiro sem deixar rastro no console, então repetem aqui.

**1. `poderTotal`, `armTotal` e `ehAgil` são `const`.** Tentar reatribuí-las para adicionar um efeito lança `TypeError` e **mata o script inteiro dali para baixo**, sem erro visível no console — o sintoma é uma função que "não existe". Para adicionar bônus, escreva nos campos que o motor já soma (`extraPoder`, `arm`, `agil`) e guarde quanto aplicou para devolver depois. Veja `aplicaBuff` / `limpaBuffs`.

**2. IDs duplicados entre `<section>` e o container interno.** `querySelector` pega o primeiro e você acaba apagando a seção inteira. Já aconteceu no guia.

### Como adicionar um herói

Edite `data/catalogo.js`:

```js
meuheroi:{n:"Nome",ep:"o Epíteto",pos:"topo",cls:"Lutador",ref:"referência de kit do LoL",
  vida:12,poder:3,arm:2,alc:1,agil:1,   // agil e patamar são opcionais
  habs:[{n:"Básica",f:1,alvo:"in",ef:{dano:1}},
        {n:"Tática",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Ultimate",f:5,alvo:"eu",ef:{danoVizinhos:1}}]},
```

`alvo`: `"in"` inimigo · `"al"` aliado · `"eu"` o próprio.

**Use apenas efeitos que o motor executa** — senão a carta não faz nada:
`dano · danoFixo · extra · bonusFerido · executa · area · danoVizinhos · danoRaio · escudo · cura · ouro · ouroSeMatar · recarga · intocavel · ward · revive · marca · doar · puxar · empurrar · prende · prendeVizinhos · alcExtra · semAlcance`

O herói aparece **no draft, no guia e no visualizador de cartas** automaticamente — os três leem
do mesmo arquivo. Falta só a arte: `arte/herois/web/<id>.jpg` e a entrada em `arte/imagens.js`.

O pool tem **4 por rota** de propósito. Antes de somar o quinto, veja quem ele empurra para fora —
os aposentados estão em `docs/herois-aposentados.md`.

---

## Testar sem jogar 40 minutos

O console do navegador tem acesso a tudo. Uma partida inteira automática:

```js
novo(); pinta();
// e então dirija o estado: J.dados, J.mov, selHeroi, iniciaHab(0), confirmaHab(alvo)
```

Peça ao Claude: *"roda uma partida completa por script e me diz se dá erro"*. Ele sabe fazer isso — foi assim que os bugs de fluxo foram achados.

---

## Subir no GitHub e mexer em grupo

Está tudo em **`docs/ECOSSISTEMA.md`**: o modelo de um repositório oficial + um fork por pessoa,
o fluxo de pull request, as regras que evitam conflito de merge e como publicar no GitHub Pages.

Para mandar para alguém que está entrando agora: **`docs/ACESSO.md`**.
