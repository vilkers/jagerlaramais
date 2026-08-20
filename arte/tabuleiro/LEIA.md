# O tabuleiro pintado

`gabarito.png` / `gabarito.svg` — a geometria EXATA do tabuleiro, 116 hexágonos,
cada um com a coordenada e o papel (torre, bloqueado, acampamento, poço, Nexus).

## Para que serve

Um jogo de turnos tem **geometria fixa**. As mesmas 116 casas, partida após
partida. Isso quer dizer que o tabuleiro **não precisa ser desenhado pelo
programa** — ele pode ser **uma imagem pintada**, com o SVG por cima só para
interação e estado.

É assim que se ganha identidade sem trocar de engine: a arte deixa de ser
"hexágono com cor de preenchimento" e passa a ser um lugar desenhado, com
barraco, carro abandonado, mato, placa torta.

## Como usar

1. Pinte (ou gere) o tabuleiro **em cima deste gabarito**, na proporção
   **1,0563** (2252×2132 é o tamanho de referência);
2. As bordas do hexágono do gabarito são **linha de corte, não desenho**: elas
   não aparecem na arte final. O que precisa cair no lugar certo é o CONTEÚDO —
   o barraco da casa `3,4` tem de estar dentro do hexágono `3,4`;
3. Salve em `arte/tabuleiro/tabuleiro.jpg`.

## O que o código faz depois

O SVG ganha um `<image>` atrás dos hexágonos, e os hexágonos ficam
**transparentes** — eles continuam existindo para o toque, para o realce de
movimento, para a mira e para a névoa, que passa a ser um véu escuro por cima em
vez de cor sólida. São ~30 linhas.

**A geometria não muda.** Nenhum teste dos 307 é afetado: eles medem regra, e a
regra não sabe que existe imagem.

## Duas projeções, dois custos

| | O que é | Custo |
|---|---|---|
| **de cima** (a 1ª referência do Vilker) | o tabuleiro visto de cima, com relevo pintado | **quase nada** — troca de fundo, ~30 linhas |
| **isométrica** (a 2ª referência) | o tabuleiro em perspectiva, com altura | **alto** — o hexágono do toque deixa de bater com o hexágono pintado. A grade inteira precisa de transformação, e a peça precisa de deslocamento vertical para "pisar" na casa |

A primeira dá 90% da identidade por 5% do trabalho. A segunda é bonita e é outro
projeto.

## A identidade mais barata de todas

Nas referências, boa parte do que dá personalidade **não está no tabuleiro** —
está na MOLDURA: as placas tortas ("DEUS É GAMBIARRA", "FÉ EM SUCATA!",
"CUIDADO! KABUM!"), o lixo acumulado na borda, os carros. Isso fica **fora da
área de jogo**, não encosta em regra nenhuma, e é a coisa mais barata do projeto
inteiro em ganho de identidade por hora.
