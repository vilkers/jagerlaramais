# Visual Lab — como mexer sem quebrar

O Visual Guide é publicado em **dois lugares com regras diferentes**, e é daí que vêm
quase todos os bugs desta pasta:

| Onde | Serve o quê | Caminho |
|---|---|---|
| Sites / ChatGPT | o app Next rodando | raiz do domínio → `/assets/x` funciona |
| GitHub Pages | `index.html` estático + `assets/` | `/jagerlaramais/visual-lab/` → só caminho **relativo** funciona |

O `index.html` da pasta **é gerado**, não escrito à mão. Editar ele direto funciona
até alguém rodar o build de novo.

## O ciclo

```
1. edita  app/page.tsx  ·  app/globals.css  ·  dados/criacao.json
2. npm run publicar     ← gera dados, builda e reescreve index.html + assets
3. confere e commita
```

`npm run publicar` faz três coisas que ninguém lembra de fazer na mão:

- roda `gerar-dados.mjs`, que puxa atributos e skills de `data/catalogo.js`;
- reescreve todo caminho absoluto do HTML para relativo, **inclusive as fontes dentro
  do CSS** — era isso que fazia Anybody, Familjen e Spline Mono darem 404 no Pages e a
  página inteira cair em fonte de sistema;
- remove a hidratação do React, porque o Pages serve documento, não app. A única
  interação (o filtro de rota) é refeita em `static.js`.

`npm run checa` não escreve nada e acusa: número divergente do catálogo, arquivo citado
que não existe, imagem em só uma das duas pastas, asset órfão.

## Onde cada coisa mora

```
dados/criacao.json      camada CRIATIVA, escrita à mão: lore, território, arma, status, IDs de nuvem
dados/personagens.json  GERADO. criacao.json + data/catalogo.js. É o que a página lê
app/page.tsx            a página. NÃO digite atributo aqui — ver CLAUDE.md
app/globals.css         toda a aparência
static.js               a interatividade da versão estática
index.html + assets/    GERADOS por scripts/publicar-estatico.mjs
public/images/          derivadas web (autoria)
images/                 espelho de public/images para o Pages — sincronize, não copie na mão
creative-assets/        os masters em resolução cheia + o diário de cada personagem
PIPELINE-VISUAL.md      como um personagem nasce sem sair inconsistente
```

## As duas regras que valem mais que as outras

**1. Atributo de personagem não se digita aqui.** `data/catalogo.js` é a fonte de verdade
do jogo. A ligação personagem-criativo → herói-do-catálogo mora em `criacao.json`
(`"catalogo": {"id": "vharn", "confirmado": true}`), e os números vêm de lá. Foi assim que
apareceu a Dona Chinela com 13 de vida no guia enquanto o catálogo dizia 14.

**2. Toda interação nova precisa existir duas vezes** — no React e no `static.js` — enquanto
o Pages servir documento estático. Se isso passar de umas poucas linhas, é sinal de que
chegou a hora de o Guide virar página vanilla de verdade, sem build.

## Quando dividir em várias páginas

Hoje as fichas de personagem são seções da home, com âncora própria
(`#heroi-dona-chinela`) — link direto funciona e o botão voltar do celular funciona
sozinho. Isso aguenta bem até uns **6 personagens com kit completo**. Passando disso, a
home fica longa demais e cada ficha vira uma página em `herois/<slug>/`, com o
`publicar-estatico.mjs` capturando uma rota por personagem.
