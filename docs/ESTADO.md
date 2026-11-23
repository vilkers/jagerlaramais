# Estado do Jagerlaramais

Revisado em **23/11/2026**. Ponto de entrada para retomada. Plano em [PIPELINE](PIPELINE.md); medições e detalhes históricos em [arquivo/ESTADO-2026-08-20.md](arquivo/ESTADO-2026-08-20.md).

## Jogo

- Base mecânica v55.1. Esta revisão reorganiza guia e documentação sem mudar os números do motor.
- 20 heróis, 22 itens, 46 cartas de Comando. data/catalogo.js alimenta jogo, manual e cartas.
- Tutorial, draft, IA, loja, visão, Dragão, Barão e Retomada implementados.
- Mapa 11×11, 116 casas jogáveis, cenário 2D e obstáculos. Regras atuais em REGRAS.md.
- Rede existe como protótipo: servidor autoritativo, salas, intenção de jogada e estado filtrado. Faltam hospedagem, reconexão, abandono e draft em rede; ver ../servidor/LEIA.md.
- Pages é estático e não hospeda o servidor de salas.
- Playtest humano continua necessário para ritmo, economia, legibilidade e escolhas. Medições antigas valem no escopo em que foram feitas.

## Criação

Fonte atual: visual-lab/content/. Recuperada da publicação ChatGPT Sites v8, commit ca10548b4ae532d9158757f2b648865e19708271.

| Personagem | Estado | Próximo passo |
| --- | --- | --- |
| Dona Chinela | Concept, sheet e carta aprovados; referência de craft | Refazer miniatura em três views; vídeo anterior rejeitado |
| P.O.M.B.O. | Design-base aprovado; concept e sheet com craft pendente | Elevar master à régua da Dona, depois refazer derivados |
| Catarino | Design encaminhado; concept e sheet com craft pendente | Fechar master sem mudar rosto ou mecanismo |

Há 3/15 etapas aprovadas e 10/15 com imagem. Arquivo existente não equivale a aprovação. No Catarino, a fonte tem rótulo de design aprovado mas a nota diz encaminhado: preservar essa nuance, sem promover aprovação.

Pipeline: **Concept → Sheet → Versão 3D → Carta → Vídeo**. Render master faz parte do concept. O handoff anterior de seis etapas é histórico.

Frete e Bexiga não entram no trio ativo. Território BOT está em revisão. Não restaurar propostas descartadas a partir de documentos antigos.

## Próximas ações

1. ART-01/02: masters de P.O.M.B.O. e Catarino.
2. ART-03: sheets derivados dos masters aprovados.
3. ART-04: três miniaturas, uma colorida e duas clay em base hexagonal.
4. ART-05: cartas de P.O.M.B.O. e Catarino.
5. ART-06: validar retomada do vídeo da Dona; direção anterior preservada no handoff.
6. ART-07: revisão do lote e proposta de integração com o catálogo.

São tarefas documentadas, não gerações iniciadas ou itens enviados ao Google Tasks.

## Divergências que exigem decisão

- Trio criativo e 20 heróis jogáveis ainda não têm mapeamento integral aprovado.
- Guia criativo e direção do tabuleiro usam nomes diferentes para alguns monstros. Reconciliar antes do lote final; não substituir o motor nesta revisão.
- Imagem de mapa do Visual Guide é referência criativa histórica; geometria atual vem do motor e data/mapa.js.
- Documentos antigos dizem que rede não existe; a implementação local já existe, a hospedagem ainda não.
- Estado de preservação, hashes e checks: [REVISAO-VISUAL-GUIDE](REVISAO-VISUAL-GUIDE.md).

## Retomada

Ler este arquivo e PIPELINE.md. Depois abrir só a fonte da tarefa: visual-lab/content/ para criação; data/catalogo.js e jogo/ para mecânica; servidor/LEIA.md para rede. Não usar o snapshot visual-lab/app/ como fonte do guia atual.
