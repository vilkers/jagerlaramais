# v15.1 — consolidação pós-playtest

**Origem:** primeiro playtest humano da v15  
**Data:** 2026-08-11  
**Status:** em validação

## Escopo

Esta versão corrige os bugs observados em mesa, remove temporariamente a partida contra IA e separa o código por responsabilidade sem criar outro motor de jogo.

## Decisão de arquitetura

Existe uma única partida. Hoje as escolhas vêm de duas pessoas no mesmo aparelho. Uma futura IA deve apenas escolher entre ações legais expostas pelo motor; não deve ter turno, draft ou regra próprios.

## Validar no próximo playtest

- A sequência nunca foge de Azul → Carmim.
- Dois heróis conseguem atingir a mesma torre na mesma rodada.
- Escudo absorve, mostra o valor absorvido e desaparece na virada da rodada.
- A remoção da IA não deixou botão, pausa ou texto órfão.
- O aumento de pressão em torre não encurtou demais a partida.

## Decisões ainda abertas

- Se e quando a IA volta.
- Qual interface pública mínima o motor deve oferecer para um bot escolher ações sem sondar a UI.
- Compensação para quem abre. A medição intermediária com elencos trocados deu **39,4%** para o primeiro jogador (n=2000); o segundo age por último antes da apuração da rodada.
