# Diagnóstico de jogabilidade — por que travava

Levantado em cima do protótipo v0.2, depois do relato "fiquei bastante travado".
Todos os itens abaixo foram **corrigidos** em `jogo/index.html`.

---

## Os seis conflitos

### 1. O mesmo toque fazia três coisas diferentes 🔴 *causa principal*

`cliqueHeroi()` decidia entre três ações lendo variáveis invisíveis:

```
se (habilidade escolhida e este é alvo) → ataca
senão se (dado selecionado)            → aloca o dado
senão                                   → seleciona pra mover
```

O jogador tocava no mesmo lugar e acontecia coisa diferente, sem nada na tela explicando por quê. É o clássico **modo escondido** — e é a razão nº 1 do travamento.

**Correção:** um modo por vez, sempre explícito. Toque num herói abre um **painel de comando** com as opções escritas: *Mover*, e cada habilidade com nome, efeito e custo. Nada acontece por adivinhação.

### 2. Não existia cancelar 🔴

`alocaDado()` marcava `d.usado = 1` **na hora**. Alocou no herói errado? O dado já era. Sem desfazer, sem escapatória — travava a rodada inteira.

**Correção:** o dado só é consumido no instante em que a habilidade é **confirmada**. Antes disso, o `✕` devolve tudo. Escolher uma habilidade e desistir não custa nada.

### 3. Habilidade sem alvo não dava resposta 🟠

Escolhia a habilidade, a lista de alvos vinha vazia, e a tela simplesmente não mudava. O jogador ficava tocando sem entender.

**Correção:** `"ninguém no alcance"` aparece como aviso e o modo se cancela sozinho.

### 4. Auto-alvo disparava sem confirmação 🟠

Habilidades que miram o próprio herói (Muralha, Sombra, Recarregar) executavam no primeiro toque. Um toque errado gastava a ultimate.

**Correção:** primeiro toque arma e escreve **"— confirmar"** no botão; o segundo executa.

### 5. Duas variáveis para o mesmo herói 🟠

Movimento lia `selHeroi`, ação lia `ativo`. Elas saíam de sincronia, então às vezes dava pra mover depois de agir e às vezes não — sem explicação visível.

**Correção:** uma única `selHeroi` + um `modo` explícito (`null` / `mover` / `mirar`).

### 6. Você tinha que decorar tudo 🟠

Nada na tela dizia o que uma habilidade fazia, quanto dano causava, ou qual dado ia gastar.

**Correção:** cada linha do comando mostra **efeito calculado** (`~7 de dano · puxa · prende`) e **qual dado será gasto**. A carta completa abre em um toque.

---

## Escolha automática de dado

O passo "escolher qual dado usar" era puro atrito. Agora o jogo **pega sozinho o menor dado que serve** à habilidade — e desde a v49, em que cada habilidade tem uma **faixa exata** de dado (1–2 básica, 3–5 do meio, 6 Ultimate), "servir" quer dizer estar dentro da faixa. O 6 não é mais disputado entre as três: ele só paga a Ultimate.

Quer gastar um dado específico? Toque nele antes. O automático só decide quando você não decidiu.

---

## O que ainda está aberto 🔸

**Partida longa demais com jogadores passivos.** Uma simulação com dois bots que quase não atacam levou **30 rodadas** para fechar (o alvo é ~10). O bot é ruim e exagera o efeito, mas o sinal é real: **não existe pressão de tempo no jogo.** Quem não quer brigar, não briga, e nada obriga.

É o mesmo buraco que os objetivos épicos preenchem no LoL — o Barão é o relógio que força a luta. Hoje eles estão nas regras (`02-regras.md`) mas não no protótipo.

Ordem sugerida de correção:
1. **Objetivos épicos no tabuleiro** — Dragão a partir da rodada 5, Barão na 8. Resolve a passividade.
2. **Comeback** — hoje quem abre vantagem não devolve mais nada.
3. **Limite de rodadas** — critério de desempate se ninguém fechar.
