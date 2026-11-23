# Revisão e recuperação do Visual Guide

23/11/2026. Pedido: preservar o conteúdo mais recente do ChatGPT, reorganizar o site e continuar pelo GitHub antes de excluir a publicação antiga.

## Fontes comparadas

| Fonte | Revisão | Achado |
| --- | --- | --- |
| GitHub main anterior | f8d1b520533bca02f0e65deaee7299add3d61112 | Jogo mais recente, mas Visual Guide com roster e material criativo anteriores |
| ChatGPT Sites | versão 8, ca10548b4ae532d9158757f2b648865e19708271 | Fichas e assets novos de Dona Chinela, P.O.M.B.O. e Catarino |

A data posterior do último commit do jogo não comprovava que sua área criativa estivesse atualizada. A comparação de conteúdo confirmou a observação de Vilker.

## Preservação

Todos os 58 arquivos rastreados da fonte publicada foram incorporados sem perda de bytes. Caminhos, SHA-256 e tamanhos em visual-lab/archive/sites-v8/manifest.json. README do starter preservado no arquivo indicado pelo manifest. app/ e demais arquivos do starter permanecem como snapshot recuperável; o frontend atual vem de content/, ui/ e do gerador.

As 12 imagens em public/images/heroes/ incluem concepts, renders intermediários, sheets, estudos de miniatura e a carta da Dona. O thumbnail da Dona e a prancha renderizada também foram atualizados com os bytes da publicação. Nenhuma imagem nova foi gerada; status anteriores foram preservados.

Nenhuma alteração em jogo/, data/, sim/, servidor/, guia/, cartas/ ou arte/. Mecânica, números e elenco jogável permanecem na base anterior.

## Organização entregue

- Entrada curta com estado, trio e próximas ações.
- Personagens com filtro, ficha individual, cinco etapas, galeria ampliada e downloads.
- Universo reúne lore, direção, mapa, bestiário e itens sem repetir o pipeline três vezes.
- Produção reúne estados reais, tarefas com dependências, aceite e marcos.
- Documentação de retomada atualizada; versões anteriores preservadas em docs/arquivo/.
- Imagem histórica de mapa identificada como referência; não apresentada como geometria tática atual.
- Diferenças de nomenclatura de monstros registradas como decisão pendente, sem substituir o catálogo.

## Verificação antes de publicar

- node tools/check-visual-guide.mjs: 58 hashes idênticos, sete páginas, 225 links/assets locais, fontes presentes e dependências de tarefas sem ciclos.
- node --check: gerador e JavaScript da interface válidos.
- 307 testes do motor e 13 do cenário passaram.
- Primeira suíte de rede: 18/19; compra na loja teve timeout de 15 s. Reexecução sem alterações passou 19/19. Há intermitência a investigar; os arquivos dessa suíte e do servidor são idênticos aos da base.
- Revisão no navegador: home, três imagens carregadas, navegação, filtro por rota, ficha de P.O.M.B.O., abertura de etapa e lightbox funcionando. Layout responsivo implementado; não foi feita emulação específica de iPhone nesta revisão.

## Publicação

Publicação concluída em main no commit b6b2e01e11fc4472f452dbc4ad09a3f6e4fb15df. GitHub Actions run 45112306242 terminou com success. Endereço: https://vilkers.github.io/jagerlaramais/visual-lab/.

Checagem pública: 32 recursos (sete páginas, CSS, JavaScript e 23 imagens da fonte recuperada) responderam e tiveram SHA-256 idêntico aos arquivos locais publicados. A página pública foi aberta no navegador e mostrou o novo guia com o trio.

O nº 15, Jagerlaramais — Visual Lab no ChatGPT, pode ser excluído manualmente pelo usuário: a fonte publicada está preservada no GitHub, os assets estão servidos pelo Pages e não há D1/R2 declarado nesse snapshot. A exclusão não foi executada por este assistente. O repositório e o Pages devem ser mantidos.
