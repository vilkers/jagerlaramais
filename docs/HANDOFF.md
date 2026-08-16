# HANDOFF — sessão de 13–14/08/2026 (v23 → v37)

> **Para continuar em outra janela do Claude:** cole este arquivo, ou peça para
> ele ler `docs/HANDOFF.md` no repositório. Depois dele, leia `docs/ESTADO.md`
> (retrato do presente) e `docs/DECISOES-PENDENTES.md` (medido e não decidido).

**Repositório:** `vilkers/jagerlaramais` · branch **`claude/moba-board-game-dgvlkk`**
**Último commit:** `34cc99e` (v37) · **123 testes passando** · árvore limpa

---

## 0. LEIA ISTO PRIMEIRO — o estado que surpreende

**A branch está 21 commits à frente da `main`, e a `main` NUNCA foi atualizada.**
O site publicado (`vilkers.github.io/jagerlaramais`) serve a partir da `main`,
que ainda está no commit `2bac860` — a **v23**. Ou seja: **tudo o que está
descrito aqui é invisível no link publicado.**

O Vilker já clicou no link e reportou "não tá a foto dos personagens nem os
nomes". Não era bug: era a `main` desatualizada. **Ele ainda não autorizou o
merge nem o PR** — não faça nenhum dos dois sem pedir.

Enquanto isso, o jeito de ele jogar é:
- **`teste/JOGAR.html`** — arquivo único, ~3,4 MB, tudo embutido, abre offline;
- **um zip do site estático** para arrastar em `app.netlify.com/drop` (ele está
  usando isso: `e17c5b.netlify.app`).

---

## 1. O que esta sessão fez, versão por versão

| | O quê |
|---|---|
| **v24** | Dragão de 4 → **3 de vida** (cabe em Ultimate + básica) |
| **v25** | Loja destravada · escudo visível · **sangramento/veneno** · **zonas** · **cura de base** · Reforço 6+2 → 10+4 |
| **v26** | **Barão apanha como herói** (16 vida, 3 armadura) · teto de escudo 12 · Égide 7 → 4 |
| **v27** | **Janela de escolha de alvo** · Ultimates travadas voltam a escalar |
| **v28** | **Rotação do Caçador** |
| **v29** | **Três níveis de IA** + crash com time inteiro morto |
| **v30–31** | **Dez heróis novos**, rotas e nomes corrigidos |
| **v32–36** | Retratos dos dez (5 iterações — ver §6) |
| **v37** | Ficha da habilidade nunca mais mostra fórmula |

Cada uma tem entrada em `docs/patch-notes.md` com o porquê e a medição.

---

## 2. As regras do projeto que NÃO se negocia

Estas vêm do `CLAUDE.md` e do histórico. Quebrar qualquer uma custou versão
inteira antes.

1. **`data/catalogo.js` é a fonte de verdade.** `jogo/`, `guia/` e `cartas/`
   leem de lá. **Nunca escreva carta direto no HTML** — já criou três catálogos
   divergentes, e o terceiro foi morto nesta sessão (§5).
2. **Bug relatado vira TESTE antes de virar correção.** Se o teste não falha
   antes do conserto, ele não está testando o bug.
3. **Toda mudança de número vira patch note** em `docs/patch-notes.md`
   (append-only: entrada nova no topo, antiga nunca reescrita).
4. **Uma mudança de cada vez quando for medir** — senão o número não tem endereço.
5. **`poderTotal`/`armTotal`/`ehAgil` são `const`.** Reatribuir mata o script
   inteiro sem erro no console. Use `aplicaBuff`/`limpaBuffs`.
6. **`visual-lab/` não é o guia** — é a trilha de criação do Vilker com o
   ChatGPT, tem stack própria e **não deve ser apagada** pela regra do "vanilla".
7. **Nomear personagem e definir rota é trilha de CRIAÇÃO, não sua.** Nesta
   sessão eu inventei 4 nomes e deduzi 4 rotas — **errei 3 nomes e 4 rotas**.
   Pergunte em vez de deduzir.

---

## 3. As armadilhas de MEDIÇÃO — leia antes de rodar qualquer bateria

Esta é a parte mais cara da sessão. Três achados que mudam como se mede.

### 3.1 `times=espelho` é obrigatório para mudança que toca herói

`sim/bateria.js` sempre rodou **um confronto fixo**: vharn/nyx/solenne/vesper/mirrha
contra kaross/grumo/zhet/cael/torvald. Dez dos vinte heróis, repartidos
fixamente entre os lados.

Mudança **estrutural** (mapa, torre, onda, ouro, respawn) cai igual nos dois e a
medição vale. Mudança que toca **herói, habilidade ou item** cai só de um lado —
e aí "quem começa" mede o CONFRONTO, não a ordem.

Na v25 isso me custou uma conclusão inteira: duas das sete habilidades novas
estavam no time 1 e nenhuma no time 0. A bateria acusou 53,5% com z=6,60 e eu
**quase registrei uma regressão que não existia**.

```
node sim/bateria.js 4500 times=espelho      # os dois lados com os MESMOS heróis
```

### 3.2 "Quem começa" tem dois números

| Arranjo | quem começa |
|---|---|
| confronto fixo (toda a série histórica) | ~51,2% |
| **espelhado** | **~52,9%** |

Os dois estão certos e medem coisas diferentes. **Não corrigi nada por causa
disso** — mudar a compensação de ordem com base numa métrica que acabou de trocar
de definição repetiria o erro que `DECISOES-PENDENTES` existe para evitar.
Item 11 daquele arquivo.

### 3.3 A medição do poço é QUANTIZADA

O agente da bateria só compromete dado com o poço quando consegue **fechar no
mesmo turno**. Isso quantiza o resultado em degraus inteiros de heróis
necessários:

| Heróis necessários | Barão morto |
|---|---|
| 4 | 55–58% |
| 5 | 44–46% |

Passar de 4 para 5 derruba 10 pontos de uma vez. **Leitura de vida do poço acima
de ~5 golpes típicos mede o agente desistindo, não o objetivo.** Foi o que
produziu um "penhasco" entre vida 30 e 36 que não existe no jogo.

### 3.4 O de sempre

- `quem começa` precisa de **n ≥ 2000 por execução**, rodado 2–3 vezes.
- A bateria **é cega para agência**: mede estrutura (mapa, torre, onda, ritmo) e
  **não** mede escolha (épico, Retomada, Prioridade, itens, cartas).
- **`sim/niveis.js` é o único que dirige a IA de verdade.** Os outros usam o
  agente quase-aleatório, que NÃO é a IA do jogo.

---

## 4. Mecânicas novas desta sessão — como funcionam

### Efeito com prazo (sangramento / veneno)
Cobra **no início do turno da vítima**, 1×/rodada, e **ignora armadura e escudo**
— é o golpe que já chegou, cobrando depois. Reaplicar **renova**, nunca empilha.
Morrer limpa. **Mora no slot de controle ou na Ultimate, nunca na básica** (com
efeito de graça em todo golpe, a habilidade do meio deixava de pagar o próprio
dado — há teste).

### Zona (controle de área)
Efeito posto no **chão**: quem **começa o turno dentro** é envenenado. **O prazo
é contado em TURNOS DO ADVERSÁRIO (2), nunca em rodadas** — em rodadas, a zona
de quem joga primeiro vigiaria o dobro da do segundo. É o mesmo erro que a v20
corrigiu nas ondas. Há teste travando a simetria.

### Cura de base
**3 por rodada** na própria base. Com inimigo a **2 ou menos**, trata **uma vez**
e para até o cerco sair de perto.

### Rotação do Caçador
No início da rodada os dois escolhem **às cegas** o destino do próprio Caçador;
no turno dele, migra. Bônus **só se chegar**: acampamento próprio +3 ouro ·
neutro +1 Poder · inimigo +4 ouro · poço +1 por golpe no poço.

**NÃO HÁ TELEPORTE, e isso é o ponto.** A v18 já teve uma rotação em que o
Caçador *saía do tabuleiro*, e a v19 desfez. Aqui ele **anda**, até 3 casas de
graça, no mapa, interceptável. Dois testes existem só para a versão da v18 não
voltar.

### Os dois moradores do poço contam coisas diferentes
- **Dragão**: conta **GOLPES** (básica 1, Ultimate 2, o dado não entra). Vida 3.
- **Barão**: conta **DANO**, pela regra dos heróis. **16 de vida, 3 de armadura.**

**O que faz o Barão exigir grupo é a ARMADURA, não a vida.** Com armadura 3 e
Poder 3, básica de dado 2 tira 2 e Ultimate de dado 6 tira 8 — quatro vezes mais.
16 fica abaixo da vida de todos os 20 heróis: o objetivo não é o saco de pancada
mais gordo da mesa.

### Três níveis de IA
**Dificuldade mexe na qualidade da decisão, NUNCA nos números.** Nenhum nível
ganha dano, vida, ouro ou visão a mais. Medido em `sim/niveis.js`:
Mestre 55,8% × Veterano · Veterano 72,7% × Aprendiz.

---

## 5. O elenco — 10 substituídos, `id` internos mantidos

Os `id` **não** mudaram, e isso é decisão: 206 referências em 6 arquivos,
incluindo os 123 testes e o confronto fixo da bateria. Mantendo a chave, os
testes seguem verdes e **toda a medição anterior continua comparável**.

| Rota | Personagem | `id` (chassi herdado) |
|---|---|---|
| topo | O Taxista | `vharn` |
| topo | Dona Chinela | `kaross` |
| selva | Pombo Ciborgue | `nyx` |
| selva | Valti | `kurr` |
| meio | Parabólica Diabólica | `solenne` |
| meio | Gari Mago | `nira` |
| adc | Zé Griteco | `vesper` |
| adc | Catarino | `nessa` |
| sup | Emerson Emo | `mirrha` |
| sup | Caramêlo 2.0 | `gorm` |

Ficaram: Ilva e Xhera (topo), Grumo e Pyk (selva), Zhet e Arden (meio), Cael e
Corvo (adc), Torvald e Vidra (sup). **2 por rota substituídos, 4 por rota
mantidos.**

**Nenhum número de balanceamento mudou** — cada personagem herdou vida, Poder,
Armadura, alcance e o formato das três habilidades do substituído. Só mudaram
nome, epíteto e o nome de cada habilidade.

A arte entra por `id`: `arte/herois/web/<id>.jpg`, **293×440**.

---

## 6. ENQUADRAMENTO DE RETRATO — a lição que custou 5 versões

O padrão do jogo é **meio corpo, cabeça no terço superior, tronco preenchendo o
resto, com ar em volta**. A cabeça ocupa ~20% da altura. Olhe `grumo.jpg`,
`zhet.jpg`, `cael.jpg`, `pyk.jpg` antes de recortar qualquer coisa.

O card do draft mostra **uma faixa do topo** da imagem. Retrato fechado no rosto
vira testa e olhos no card — o personagem some justamente onde precisa ser
reconhecido.

O vai e volta, registrado para não repetir: v32 saiu de corpo inteiro → o
playtest pediu "o rosto é obrigatório" → v33 e v35 fecharam cada vez mais no
rosto → só com o **print da tela** ficou claro que o alvo era o padrão do JOGO.
**Se eu tivesse aberto um retrato original na primeira vez, teria acertado de
cara.** Quando existe padrão no projeto, medir o padrão vem antes de interpretar
o pedido.

**Print da tela é a informação mais útil que o Vilker manda. Peça.**

---

## 7. Comandos

```
node sim/testes.js              # 123 testes de regressão
node sim/bateria.js 4500 times=espelho   # estrutura + ordem (espelho é obrigatório
                                         # se a mudança tocar herói)
node sim/epicos.js 2500         # Dragão e Barão
node sim/habs.js                # cada habilidade contra a básica do próprio herói
node sim/ouro.js 600            # economia: renda contra preço
node sim/niveis.js 600          # os 3 níveis da IA, com a IA DE VERDADE
node sim/simetria.js            # o tabuleiro é espelho de si mesmo?
node teste/empacota.js          # regera teste/JOGAR.html
```

**Variantes úteis:** `times=espelho` · `curabase=N` · `dot=off` · `zonas=off` ·
`baraodano=N` · `baraoarm=N` · `baraogolpe=on` · `mato=off` · `muralha=off` ·
`respawn=fixo` · `armtorre=` · `revide=off`

**Para gerar o zip do Netlify:**
```
mkdir site && cp -r index.html .nojekyll jogo guia cartas data arte teste site/
zip -qr site.zip site
```

---

## 8. Onde as coisas moram

```
jogo/jogo.js        motor de regras + interface (~4.400 linhas)
jogo/estilo.css     TODA a aparência — mexer aqui não quebra regra
data/catalogo.js    heróis, itens, deck, classes, textoHab()
arte/herois/web/    retratos 293×440, nomeados pelo id do chassi
sim/motor.js        harness (DOM falso) · a PONTE expõe o que os testes usam
sim/agente.js       o jogador artificial quase-aleatório (NÃO é a IA do jogo)
docs/ESTADO.md      retrato do presente — leia primeiro
docs/REGRAS.md      regras completas, extraídas do motor
docs/patch-notes.md histórico, append-only
docs/DECISOES-PENDENTES.md   medido e não decidido
```

---

## 9. Erros que EU cometi nesta sessão (registrados de propósito)

1. **Li ruído como sinal, e depois sinal como ruído.** Braços de n=3000
   inverteram de lado entre execuções. Só o A/B com braço de controle resolveu.
2. **Confundi desequilíbrio de confronto com regressão de ordem** (§3.1).
3. **Os níveis de IA nasceram invertidos** — dei piso 8 ao Mestre supondo "mais
   ativo = melhor", e ele perdia do Veterano. O comentário do próprio código já
   explicava que o piso existe para a IA guardar o dado.
4. **Inventei 4 nomes e deduzi 4 rotas** de personagens. Errei 3 e 4.
5. **Filtrei uploads por extensão minúscula** e cinco arquivos `.PNG` sumiram da
   busca — reportei "não chegaram" com convicção, e estavam lá.
6. **Persegui o pedido literal em vez de medir o padrão** nos retratos (§6).
7. **Deixei de escrever patch notes da v27 e v28** — um `assert` do meu script
   falhou e eu não conferi a saída.

---

## 10. O que está aberto

**Decisão do Vilker, do Vinicius e do Matheus:**

- **O merge para a `main`.** 21 commits esperando. Nada disso está publicado.
- **A renda de ouro** — medida: herói acumula **61**, build de 3 itens mais caro
  custa **25**. Paga o build 2,4×. `sim/ouro.js` tem `farma=`, `agiu=`, `matar=`.
  Recomendo testar `farma=2` primeiro, **sempre com `times=espelho`**.
- **"Quem começa" no espelho é ~52,9%**, não os ~51% históricos (§3.2).
- **Cartas de reação** — 3 cartas declaram `quando:"reacao"` e o motor nunca lê o
  campo. Três opções em `DECISOES-PENDENTES`, item 4.
- **O Barão subiu para 59,1%** de fechamento depois da Rotação do Caçador (o
  destino "poço" soma +1 por golpe). Continua na faixa saudável, mas é drift
  numa direção só. **Se cair fácil demais no playtest, mexa no +1 do destino
  "poço", não na vida dele**, que acabou de ser calibrada.

**Ainda não existe:** Arauto (tem arte, não tem regra) · highlight estilo LoL no
tutorial · comeback · multiplayer em rede (o jogo é hotseat).

**Texto do jogo que continua mentindo:** o painel *Como jogar* diz que "uma Ward
acende os dois matos de uma vez", o que a regra da v22 desfez. Conserto de dois
minutos, nunca priorizado.

---

## 11. Como o Vilker trabalha (e o que funciona)

- Ele manda **print da tela do celular** quando algo está errado. É a informação
  mais valiosa que chega — peça quando o relato for vago.
- Ele testa no **Netlify Drop**, não no GitHub Pages.
- Ele fala em português, direto e curto. Responda igual.
- Quando ele diz "tá quebrado", **reproduza antes de consertar**. Uma vez a
  causa era a `main` desatualizada; outra, o arquivo local no celular. Chromium
  está instalado neste ambiente (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`)
  e Playwright abre o jogo para conferir erros de console de verdade.
