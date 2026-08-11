# Arquitetura pragmática do projeto

O projeto tem quatro superfícies. Elas podem evoluir separadas, mas só uma contém regra executável.

| Superfície | Responsabilidade | Regra de manutenção |
|---|---|---|
| `jogo/` | motor, interação e interface da partida | toda regra nasce aqui e precisa de teste |
| `data/` | conteúdo mecânico e metadados publicados | catálogo é editável; retrato é gerado |
| `guia/`, `cartas/`, `teste/` | leitura e distribuição | consomem as fontes; não inventam regra |
| `visual-lab/` | criação do cânone visual futuro | não altera o motor até o conteúdo ser aprovado |

## Um fluxo só

```bash
npm run atualizar
```

O comando sincroniza a documentação inferível, valida sintaxe/regras/geometria e regenera `teste/JOGAR.html`. Motivo de decisão, resultado de playtest e risco continuam sendo texto humano em patch notes e registro da versão.

## O que foi revisado como sobra

- `teste/LEIA.md` estava preso à v0.6/PR antigo e foi substituído pelo roteiro atual.
- `teste/JOGAR.html` é grande, mas fica: é o pacote offline de avaliação e sempre deve ser gerado.
- `docs/PLANO-v05.md`, `REVISAO-EXTERNA.md`, propostas e versões antigas ficam como histórico; não são retrato do jogo atual.
- `visual-lab/images/` alimenta a versão estática e `visual-lab/public/images/` alimenta o app-fonte. A duplicação é deliberada até unificar o build do laboratório.
- arte de Arauto e outros conceitos sem regra pode existir, mas precisa estar explicitamente marcada como não implementada.

## Como escalar sem engrossar o projeto

1. Manter uma única máquina de turno. Uma IA futura escolhe ações pelo mesmo motor; não recebe fluxo próprio.
2. Trocar conteúdo de teste por IDs estáveis. Nome, texto e arte podem mudar sem alterar efeitos ou estado salvo.
3. Adicionar regra somente com teste de regressão e entrada no patch note.
4. Medir balanceamento na simulação; decidir experiência em playtest humano.
5. Só introduzir servidor quando multiplayer em rede virar prioridade real.

## Entrada do cânone visual

Quando um personagem do `visual-lab/` for aprovado, a migração deve entregar: ID estável, posição, classe, atributos, três habilidades usando efeitos suportados, retrato leve, carta e registro de substituição. A implementação entra em lote pequeno para separar erro de conteúdo de erro do motor.
