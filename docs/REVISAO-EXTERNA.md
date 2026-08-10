# Revisão externa — análise item a item

> Documento recebido: *"JAGERLARAMAIS — alterações propostas"*, do Vinicius e do Matheus.
> Analisado em 2026-08-10 contra a **v0.5.6**.

## A coisa mais importante deste documento

**Ele foi escrito contra a v0.4.1. O jogo está na v0.5.6.** Entre uma e outra entraram torre
atacável, iniciativa alternada, mapa 8×8, poço épico, Retomada e a auditoria de toque.

Isso não invalida a revisão — o diagnóstico da loja estava **certo e ainda valia**. Mas significa
que três itens já estavam resolvidos e que quatro propostas colidem com medição que já existe.
Nada aqui é sobre quem estava certo: é sobre não refazer trabalho nem desfazer o que foi medido.

**Combinado para as próximas rodadas:** quem for propor mudança, diga contra qual versão está
olhando. `docs/ESTADO.md` diz qual é a de hoje na primeira linha.

---

## Veredito rápido

| # | Item | Veredito |
|---|---|---|
| 1.1 | `ARTE_ITEM` não existia — loja quebrada | ✅ **entrou na v0.5.7** |
| 1.2 | Loja exigia o hexágono exato da base | ✅ **entrou na v0.5.7** |
| 1.3 | Herói morto não comprava | ⚪ já feito na v0.5.1 |
| 1.4 | Botões mortos com gaveta aberta | ✅ **entrou na v0.5.7** |
| 1.5 | Botões saindo da tela | ⚪ já feito na v0.5.6 |
| 2.1 | Mapa não é simétrico | ⚠️ **colide com medição** |
| 2.2 | Tabuleiro 9×9 espelhado | ⚠️ **colide com o 8×8 medido** |
| 2.3 | Rotas com duas casas de largura | 🟡 boa ideia, exige remedição |
| 3.1 | Santuário na base | 🟡 vale decidir |
| 3.2 | Cerco por herói | ⚠️ **já existe, diferente** |
| 3.3 | Limite de 15 rodadas | ❌ **o número está errado** |
| 3.4 | Tela de campeão com placar | ✅ **entrou na v0.5.8** |
| 4.1 | Painel de cerco em texto | 🟡 bom, mas custa altura |
| 4.2 | Toque longo explica a habilidade | ✅ **entrou na v0.5.8** |
| 5.1 | Doar Dado deixa agir duas vezes | ⚪ já corrigido |

---

## 1 · Correções — o diagnóstico estava certo

**1.1 e 1.2 são a resposta ao "a loja não abre".** São dois defeitos empilhados, e reproduzi os
dois antes de mexer:

- `naBase` comparava hexágono exato. Na rodada 1, **zero dos cinco heróis** contavam como estando
  na base — a gaveta abria escrito "Loja fechada".
- Forçando um herói para a casa exata, aí sim a loja tentava montar os cards e morria com
  `ARTE_ITEM is not defined`. As imagens estavam em `arte/itens/web/` o tempo todo.

**1.4 também era real.** Com qualquer gaveta aberta, `elementFromPoint` no botão TIME devolvia a
gaveta, não o botão. O código sempre teve a intenção de alternar de gaveta num toque, e o
escurecimento anulava isso.

**Os três entraram na v0.5.7.** Detalhe do que só 12 dos 22 itens têm arte: os outros 10 ganharam
um selo de latão com a inicial, no mesmo padrão do herói sem retrato.

**1.3 e 1.5 já estavam feitos** — v0.5.1 e v0.5.6.

---

## 2 · O tabuleiro — aqui mora o conflito

### O que o documento propõe
Reconstruir o mapa em 9×9 gerando metade e espelhando a outra, para zerar as assimetrias.

### Por que isso é delicado

**O tabuleiro é 8×8 desde a v0.5.4 e o número foi medido.** A mudança de 7×7 para 8×8 levou a
vantagem de quem abre de 55,9% para 52,4% na época. Hoje, com 20 000 partidas, o baseline sem
épico e sem Retomada está em **50,5%** — praticamente justo. O mapa atual **não** tem o problema
grave que o documento descreve, porque a geometria deixou de ser lista escrita à mão na v0.5.3 e
passa a sair de `const N`.

**E o conserto de simetria "óbvio" já foi tentado e medido.** Na v0.5.5 eu espelhei as torres
(`n-1-i` em vez de duas fórmulas independentes), que é exatamente o raciocínio do documento.
Resultado: a vitória de quem começa foi de **51,1% para 40,8%** — piorou muito, para o outro lado.
As duas fórmulas desencontradas estão compensando outra assimetria do sistema (`limitaFrente`
somado ao comprimento par/ímpar de cada rota). Está revertido e anotado no código.

> **A lição:** simetria por índice não é a mesma coisa que jogo justo. O que decide não é o mapa
> ser espelhado no papel, é o número de vitórias. E o número hoje é 50,5%.

**O que fazer:** não trocar para 9×9 às cegas. Se quiserem testar, a bateria já aceita
`node sim/bateria.js 20000 mapa=9` — roda a variante sem sujar o arquivo. Se der abaixo de 50,5%
de assimetria E mediana parecida, aí a troca se justifica com número na mão.

### 2.3 Rotas com duas casas de largura — esta é boa

É a proposta mais interessante da seção e não depende do 9×9. Dois heróis não passarem lado a
lado é uma limitação real. Os estreitamentos no rio e na entrada da base são bem pensados.

**O que ela mexe sem parecer:** `LANE` decide qual rota conta para empurrar a onda, e a Retomada
mede invasão em hexágonos de rota. Alargar a rota muda os dois. **Exige remedição**, não é
mudança cosmética. A selva encolhendo é um efeito colateral que o próprio documento sinaliza.

---

## 3 · Regras novas

### 3.1 Santuário na base — vale decidir
Curar 3 e ficar intocável sem poder atacar de lá. Não colide com nada. Interage com a correção
1.2 que acabou de entrar: agora é mais fácil estar "na base", então o santuário fica mais
acessível do que o documento imaginava. **Decisão de vocês** — eu acho que combina com o
Retomada, porque dá ao time que apanha um lugar para respirar.

### 3.2 Cerco por herói — já existe, e é diferente

O documento diz: *"antes disso, só a onda derrubava estrutura — o herói não tinha como acelerar o
cerco"*. Isso era verdade na v0.4.1 e **é falso desde a v0.5.1**.

Hoje o herói bate na torre: mira vermelha, um toque, 1 de dano, uma vez por rodada, e a torre
revida 2. A trava é que a **sua onda precisa estar encostada** na torre — senão um assassino
sozinho derrubaria a base pelas costas.

A proposta é outro mecanismo: maioria de encostados por duas rodadas seguidas. **Não dá para ter
os dois** — viraria duas formas concorrentes de derrubar a mesma torre. Se acharem o de vocês
melhor, é substituição, não adição, e aí a vida da torre (3) e o revide (2) precisam ser
recalibrados junto.

### 3.3 Limite de 15 rodadas — o número está errado

Medi a distribuição com 8 000 partidas:

| termina até a rodada | 10 | 12 | **15** | 18 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|---|
| % das partidas | 15,0 | 32,1 | **53,5** | 68,5 | 75,7 | 88,4 | 95,0 |

Mediana 15, p90 **26**, máximo 63.

Cortar em 15 decidiria **quase metade das partidas por critério de desempate em vez de Nexus** —
o oposto do que um limite deve fazer. O limite existe para matar a cauda, não para virar a regra.

**Contraproposta: 30 rodadas.** Corta 5% das partidas, que são justamente as travadas. Se
quiserem apertar o ritmo, o caminho é mexer no motor (Fúria do Barão empurrando onda já faz isso),
não no relógio.

O critério de desempate proposto — Nexus, depois torres, depois ouro — é bom e eu usaria igual.

### 3.4 Tela de campeão com placar — entra fácil
A tela já existe e hoje só mostra "AZUL venceu". Mostrar Nexus, torres e ouro dos dois lados e o
motivo da vitória é barato e melhora muito o fim de partida. **Sem conflito.**

---

## 4 · Interface

### 4.1 Painel de cerco — bom, mas há uma conta a fazer
A queixa é legítima: os números dentro dos losangos são pequenos no celular.

O porém: a v0.5.6 acabou de brigar por cada pixel de altura. O painel já estourava a tela nos
quatro tamanhos testados e só coube com a lista de comando rolando por dentro. **Um painel novo
abaixo do mapa tira altura do mapa**, e o mapa é o alvo de toque principal.

**Sugestão:** em vez de faixa fixa, colocar isso na gaveta que já existe (junto do Time), ou
aumentar o número dentro do losango — que resolve a queixa real sem custar altura.

### 4.2 Toque longo explicando a habilidade — o melhor item do documento
Alto valor e zero conflito. Mostrar Força mínima, alvo, alcance, a regra por extenso e **o
resultado estimado para cada um dos três dados na mesa** é exatamente o tipo de coisa que tira o
jogador do escuro. O detalhe de habilidade apagada aceitar o toque longo está certíssimo: é
quando mais se quer saber.

O motor já tem `descreve(h,hb,dado)`, que calcula o texto por dado. A ficha é montar em cima
disso — **não precisa de regra nova**.

---

## 5 · Pontos para decidir

**Doar Dado** — o filtro `hb.ef.doar && o.agiu` já existe: não dá para doar para quem já agiu.
Hoje é a suporte gastando a ação dela para dar ação a um aliado. Continua forte, mas não é o
buraco que o documento descreve.

**Curva de ouro e voltar para comprar** — a correção 1.2 tornou a segunda observação verdadeira
agora: comprar ficou mais barato. **A bateria não mede isso**, porque o agente não faz compras.
É item de playtest, e vai na mesma lista do épico e da Retomada.

**Tamanho da selva** — só vira questão se o 9×9 com rotas largas entrar.

---

## O que eu faria, na ordem

1. ✅ **Correções da seção 1** — feito, v0.5.7.
2. ✅ **Toque longo na habilidade** (4.2) e **tela de campeão com placar** (3.4) — feito, v0.5.8,
   junto com **arrastar para andar**, que não estava no documento e resolve a mesma queixa de
   usabilidade por outro caminho.
3. **Playtest** com as três seções 1 já dentro. Épico, Retomada e agora a loja estão todos
   esperando mão humana — a bateria é cega a mecânica de escolha (ver v0.5.5).
4. **Limite de rodadas em 30**, com o critério de desempate proposto.
5. **Santuário** (3.1), se o playtest mostrar que quem apanha não tem onde respirar.
6. **Rotas largas** (2.3) como experimento medido — é a proposta estrutural que mais promete.
7. **9×9** só se a bateria mostrar número melhor que os 50,5% de hoje.

O que eu **não** faria: espelhar torres (medido, piora), trocar o cerco por herói que já existe
sem recalibrar torre junto, e cortar a partida em 15 rodadas.
