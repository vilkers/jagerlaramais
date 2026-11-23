# Visual Guide — Jagerlaramais

Guia oficial: https://vilkers.github.io/jagerlaramais/visual-lab/.

Reorganização de 23/11/2026. Fonte da publicação ChatGPT Sites v8 recuperada, com novas fichas e imagens. Não confundir versão do jogo (v55.1) com a publicação no ChatGPT (8).

## Editar e publicar

HTML estático gerado, com CSS e JavaScript em módulos separados. Sem instalação de dependências.

| Fonte | Responsabilidade |
| --- | --- |
| content/heroes.json | Fonte atual de fichas, etapas, aprovações e caminhos de arte |
| content/project.json | Fase, tarefas com dependências e marcos |
| content/world.json | Lore, territórios e bestiário |
| ui/guide.css | Layout, tipografia, responsividade e movimento |
| ui/guide.js | Filtros, ampliação e navegação de etapas |
| ../tools/build-visual-guide.mjs | Templates e geração das sete páginas |
| public/images/ | Assets recuperados da publicação |

Na raiz, executar `node tools/build-visual-guide.mjs` e `node tools/check-visual-guide.mjs`. Incluir páginas geradas no mesmo commit e publicar em main. O Pages existente continua sendo a hospedagem. Não usar o build do starter antigo para atualizar o Pages.

## Organização

- Entrada: estado atual, primeiro trio e próximas ações.
- personagens/: roster e matriz de estados.
- heroes/<slug>/: ficha, cinco etapas, galeria e downloads.
- universo/: lore, direção de arte, mapa, bestiário e itens.
- producao/: tarefas, dependências, marcos e backlog técnico em paralelo.

## Fonte preservada

app/, build/, worker/ e a configuração do starter são uma cópia histórica da fonte do Sites. Não são a interface publicada pelo Pages. A fonte editável de produção é content/ + ui/ + gerador.

archive/sites-v8/manifest.json registra SHA-256, tamanho e destino de cada arquivo da publicação no commit ca10548b4ae532d9158757f2b648865e19708271. O README genérico do starter está em archive/sites-v8/README.md. O handoff criativo anterior preserva IDs Magnific e decisões, mas seu pipeline de seis etapas foi substituído pelas cinco etapas da publicação v8.

O snapshot não declara D1 nem R2. Fichas e imagens são arquivos do projeto; não foi encontrada persistência de usuário a migrar no código dessa publicação. Isso não é auditoria de outros serviços externos.

## Apagar a publicação antiga

Conferir ../docs/REVISAO-VISUAL-GUIDE.md: hashes preservados, páginas e imagens no Pages e commit remoto confirmado. Só então apagar o nº 15 no ChatGPT, preservando este repositório.
