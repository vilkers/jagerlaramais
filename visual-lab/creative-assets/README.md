# creative-assets — os masters

Aqui moram os arquivos **em resolução cheia**, do jeito que saíram da ferramenta.
É o arquivo morto da produção: nada aqui é servido para o navegador.

O que o Guide mostra são **derivadas web**, que vivem em `visual-lab/public/images/`
(autoria) e são espelhadas para `visual-lab/images/` (GitHub Pages) por
`node visual-lab/scripts/sync-imagens.mjs`.

```
characters/<slug>/01-concept/          02-render/       03-character-sheet/
                  04-miniature/        05-key-art/      06-video/
                  fonte.md   ← o diário de produção do personagem
```

Regras curtas:

- **Nunca regerar do zero quando existe master.** Os IDs de nuvem estão em
  `dados/criacao.json` e no `fonte.md` de cada personagem.
- Nome do arquivo: `<slug>-<etapa>-<variante>.<ext>`, minúsculo, sem acento.
  Sufixo de largura (`-900`, `-1600`) só nas derivadas web, nunca no master.
- Dois masters mandam em todas as etapas seguintes e por isso têm nome fixo:
  `<slug>-02-render-master` (identidade) e `<slug>-03-product-master` (a arma).
- Um asset que entra aqui precisa entrar também em `dados/criacao.json`, senão o
  Guide não sabe que ele existe. `node visual-lab/scripts/gerar-dados.mjs` reclama
  de arquivo citado que não existe, mas não adivinha arquivo que ninguém citou.

O procedimento completo — ordem das etapas, qual referência entra em qual geração,
anatomia do prompt e os portões de qualidade — está em `../PIPELINE-VISUAL.md`.
