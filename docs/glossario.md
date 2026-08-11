# Glossário — o léxico do Jagerlaramais

> **Glossário é lei.** Termo definido não muda de nome. Sinônimo inventado no meio da
> partida é o começo de uma discussão de regra.

Este arquivo é o **texto canônico**. O guia (`guia/index.html`, seção 09) renderiza a
mesma lista para quem está jogando, e `node sim/docs.js` falha se um termo existir num
e não no outro — foi para isso que o teste nasceu.

Termo novo entra aqui **e** no guia, na mesma mudança.

---

## Os dados

| Termo | O que é |
|---|---|
| **Ordem** | Um dado alocado num herói. Você tem três por rodada e cinco heróis. |
| **Dado Mestre** | O dado de movimento. Seu valor é o total de casas que os cinco heróis andam juntos na rodada. |
| **Força** | O valor do dado de ação alocado num herói. Toda habilidade exige uma Força mínima. |
| **Crítico** | Efeito extra na carta, ativado por um 6 natural no dado alocado. |

## As rotas e suas moedas

| Termo | O que é |
|---|---|
| **Placa** | Ficha que o Topo ganha ao dominar a rota. 1 ajusta um dado em ±1; 2 re-rolam um dado. |
| **Prioridade** | Ficha que o Meio ganha ao dominar a rota. Gasta 1 para rolar um dado de ação a mais. |
| **Patamar** | Degrau de poder do Atirador, comprado com ouro acumulado. Três no total. |
| **Gank** | Quando a carta da Selva revela numa rota em vez da selva. Entra no combate com bônus de emboscada. |
| **Ward** | Ficha de visão do Suporte. Revela a carta da Selva inimiga antes dela virar. |
| **Cemitério** | Pilha de descarte. Só o Suporte tira coisas de lá. |

## O mapa e os objetivos

| Termo | O que é |
|---|---|
| **Poço** | A casa neutra do meio do mapa onde o épico desce. Um só, e ele troca de morador: Dragão até a rodada 8, Barão depois. |
| **Herança do Dragão** | +1 de Poder em todo o time, permanente e acumulativo, por Dragão levado. |
| **Fúria do Barão** | Por 2 rodadas: +2 de Poder no time e as três ondas avançam sozinhas, com herói na rota ou sem. |
| **Retomada** | Freio de bola de neve. Torre sua caída conta 2, hexágono de onda inimiga do seu lado conta 1; passou a conta do adversário em 2, você rola um dado de ação a mais, em 4 também ganha +1 no Dado Mestre. |
| **Super-creep** | Creep reforçado, gerado por inibidor caído. Desenhado, sem regra no motor. |

---

## Termos internos — do código, não da mesa

Não são regra: são o vocabulário de quem mexe no motor. Aparecem em `jogo/jogo.js`,
nos patch notes e nas conversas de desenvolvimento, **nunca no produto**.

| Termo | O que é |
|---|---|
| **Espinha** | A lista ordenada de casas de uma rota (`ROTAS`). É ela que indexa torre e Frente de Onda: `frentes` guarda um índice dela. Alargar a espinha mudaria o significado de todo índice do motor. |
| **Corredor** | A rota como o jogador anda nela: a espinha mais as casas alargadas ao lado (`CORREDOR`/`LANE`). Duas casas de largura, estreitando só na boca da base. |
| **Torre exposta** | A torre mais avançada que ainda está de pé numa rota. É a única que aceita golpe de herói; enquanto ela vive, a de trás está protegida. |
| **Meio do vão** | O ponto médio entre as torres dos dois lados de uma rota, **sem arredondar**. É o divisor que a Retomada usa para medir invasão — `centroRota` arredonda e enviesa. |
| **Rota aberta** | Rota com as duas torres de um lado no chão. É o que expõe o Nexus daquele lado. |
| **Marcador de número** | O `<!--n:chave-->valor<!--/n-->` que faz a documentação se atualizar sozinha. Ver `docs/DOCUMENTACAO.md`. |
