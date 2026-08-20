# Proposta de identidade para o site

Mockup **funcional** (é HTML de verdade, não imagem): abra
`arte/proposta-site/index.html` por um servidor local — `file://` bloqueia fonte
por CORS.

## O diagnóstico

O site antigo usava `Avenir Next Condensed` / `Copperplate` / `Iowan Old Style`
— fontes do sistema da Apple. Elas são bonitas e **não são de ninguém**: dão o
mesmo ar editorial, refinado e neutro que qualquer página bem-feita tem. Some-se
o fundo creme chapado, a coluna centralizada e o canto arredondado, e o resultado
é competente e anônimo.

## O que mudou

**Três fontes, hospedadas no repositório** (`arte/fontes/`, 72 KB no total). Não
é CDN: continua abrindo com duplo clique e funcionando offline.

| Papel | Fonte | Por quê |
|---|---|---|
| Títulos | **Alfa Slab One** | slab pesadíssima — é letra de placa pintada, de botequim, de fachada de feira |
| Rótulos | **Staatliches** | condensada em caixa alta, com cara de estêncil em caixote |
| Corpo | **Bitter** | slab de texto: aguenta corpo pequeno e não briga com o título |

**O fundo é construído, não é foto.** Parede de reboco ocre batida de sol,
manchas de umidade, escorrido de ferrugem descendo do topo, chapa ondulada no
rodapé, e uma pichação desbotada — **DEUS É GAMBIARRA** — atrás de tudo. É SVG e
gradiente: pesa ~2 KB e escala em qualquer tela.

Quando a arte do universo existir, ela entra **por cima** disto, não no lugar:
assim a página nunca fica sem chão enquanto a arte não vem.

**O layout deixou de ser lista de botões.** O título é uma placa pregada, torta,
com rebite. Os itens são chapas com número de estêncil, cada uma inclinada para
um lado. O aviso é papel com fita crepe.

O Visual Guide é o único elemento fora do universo, e é **de propósito**: ele é a
porta para outra coisa e tem de parecer outra coisa.

## Antes de virar o site de verdade

- **A licença.** As três fontes são SIL OFL, que permite uso comercial e
  redistribuição **mas exige que o texto da licença acompanhe os arquivos**.
  Falta baixar `OFL.txt` de cada uma para `arte/fontes/`;
- decidir se a pichação é fixa ou se muda por página ("FÉ EM SUCATA" no manual,
  "CUIDADO! KABUM!" nas cartas);
- o guia e as cartas precisam do mesmo tratamento, senão o site volta a ter duas
  metades — que foi o defeito que a v50 e a v51 gastaram duas versões corrigindo.
