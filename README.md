# Jagerlaramais

MOBA de tabuleiro de Vilker, Vinicius e Matheus. Jogo e criação visual compartilham um repositório, com fontes e estados explícitos.

**[Abrir o projeto](https://vilkers.github.io/jagerlaramais/)** · [Jogar](https://vilkers.github.io/jagerlaramais/jogo/) · [Visual Guide](https://vilkers.github.io/jagerlaramais/visual-lab/) · [Produção](https://vilkers.github.io/jagerlaramais/visual-lab/producao/)

## Onde estamos

| Trilha | Estado verificado no código |
| --- | --- |
| Jogo | Base v55.1, 20 heróis, 22 itens, 46 cartas de Comando, tutorial, IA e hotseat. Protótipo de salas existe; hospedagem e continuidade da conexão ainda pendentes. |
| Criação | Dona Chinela, P.O.M.B.O. e Catarino ativos. Dona define o craft; os outros dois precisam fechar master e derivados. |
| Publicação | GitHub Pages serve o projeto. O conteúdo mais recente do Visual Lab no ChatGPT foi incorporado. Ver relatório de migração para a verificação pública. |

Um asset existente não é necessariamente aprovado. A integração do novo elenco ao motor precisa de decisão própria.

## Para continuar

1. [ESTADO](docs/ESTADO.md): retrato atual. [PIPELINE](docs/PIPELINE.md): plano e próximas tarefas.
2. Criação: fontes descritas no [README do Visual Guide](visual-lab/README.md).
3. Mecânica: data/catalogo.js é a fonte de conteúdo; jogo/ contém o motor; [REGRAS](docs/REGRAS.md) contém as regras vigentes.
4. Histórico em [patch notes](docs/patch-notes.md); decisões não tomadas em [DECISOES-PENDENTES](docs/DECISOES-PENDENTES.md).

## Estrutura

| Pasta | Função |
| --- | --- |
| jogo/, data/, sim/, servidor/ | Jogo, catálogo, testes e protótipo de rede |
| guia/, cartas/ | Manual e cartas do elenco jogável |
| visual-lab/ | Universo, personagens e produção criativa |
| arte/ | Assets usados pelo jogo |
| docs/ | Estado, pipeline, regras, decisões e histórico |

## Verificar

```sh
node tools/build-visual-guide.mjs
node tools/check-visual-guide.mjs
node sim/testes.js
node sim/cenario.js
node sim/rede.js
```

Para servir localmente, use um servidor estático na raiz. Salas exigem `node servidor/sala.js`, conforme [servidor/LEIA.md](servidor/LEIA.md). GitHub Pages não executa esse servidor.

README anterior e retrato técnico de agosto preservados em docs/arquivo/; não usar como status vigente.
