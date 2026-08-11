# Proposta v0 — o jogo do Técnico

> **Substitui a v1 desta proposta.** O briefing real mudou o gênero do jogo: não é "cada jogador controla um campeão", é **cada jogador é o técnico de um time de 5**. Isso resolve 5v5 completo com 2 pessoas na mesa.

> 📜 **Documento de intenção, não de regra.** É a proposta que abriu o projeto, preservada como
> registro do raciocínio. **Vários números e sistemas daqui não são o jogo de hoje** — o inibidor
> e os super-creeps nunca foram implementados, e o Nexus tem 3 de vida, não 5.
> **As regras vigentes estão em `docs/02-regras.md`; o estado atual, em `docs/ESTADO.md`.**

---

## 1. O que o jogo é

**1v1. Cada jogador drafta 5 heróis — um por rota — e comanda o time inteiro.**
Mapa completo: 3 rotas + selva + rio. Partida de 40–45 min. Híbrido cartas + tabuleiro hexagonal.

A fantasia não é "eu sou o campeão". É **"eu sou o técnico assistindo o minimapa e decidindo onde a partida vai ser ganha"**. É a visão do coach, do analista, do jogador que grita "MID FALTANDO".

Isso destrava três coisas que 3v3 não daria:

- **Draft de verdade.** Você monta uma composição de 5, contra a composição dele. Pick/ban vira o coração do jogo.
- **Rotas com mecânicas completamente diferentes.** Cinco minijogos que conversam entre si.
- **Informação oculta barata.** Carta virada na mesa = jungler fora da visão. Zero componente extra.

---

## 2. O achado central: cada rota é um jogo diferente

Este é o motor do design. Não são cinco personagens com estatísticas diferentes — são **cinco subsistemas com fantasias e custos de atenção diferentes**.

| Rota | Apelido | Mecânica-assinatura | Custo de atenção |
|---|---|---|---|
| **Topo** | A Ilha | Duelo isolado que acumula Placas → Teleporte | Baixo |
| **Selva** | A Sombra | Ação programada em segredo, revelada depois | Médio |
| **Meio** | O Relógio | Vence a rota → ganha Prioridade → rotaciona ou age primeiro | **Alto** |
| **Atirador** | O Investimento | Escala por patamares de ouro; frágil sozinho | Médio |
| **Suporte** | A Memória | Recupera do cemitério + coloca Wards | Médio |

### 🔼 TOPO — "A Ilha"

No LoL o topo é o cara que joga sozinho do outro lado do mapa e ninguém liga — **até ele aparecer**.

- Os dois Topos duelam entre si a cada rodada, resolvido de forma quase automática (comparação de força + 1 dado). Poucas decisões, pouco tempo de mesa.
- Quem vence a rodada ganha **1 Placa**.
- **3 Placas → Teleporte:** o Topo sai da ilha e aparece em qualquer rota ou objetivo, entrando no combate em força total.

A tensão inteira é *quando puxar o gatilho*. Guardar mais uma rodada, ou aparecer agora e virar aquela luta? É a mecânica mais barata do jogo e uma das mais dramáticas.

### 🌑 SELVA — "A Sombra"

**Ideia do Vilker, e é a melhor do briefing.** O jungler é o único herói cuja ação é programada em segredo.

- No seu turno você coloca a **Carta de Rota do jungler virada para baixo** em uma de 4 zonas: rota de cima, meio, de baixo, ou selva.
- Ela é revelada **no fim do turno do oponente**.
- **Selva** → ouro + buff. **Rota** → gank: entra no combate daquela rota com bônus de emboscada.

O que isso cria:
- **Blefe real.** Vira carta na rota de cima, ele joga defensivo lá, e era só farm. Você acabou de ganhar a rota de baixo sem gastar nada.
- **Paranoia produtiva.** A pergunta "cadê o jungler dele?" existe na mesa, fisicamente, como uma carta virada que todo mundo está olhando.
- **Contra-jogo**: as **Wards do Suporte** revelam a carta antecipadamente.

Essa última linha é o que amarra o design: **Suporte e Selva são o mesmo sistema visto dos dois lados.** É exatamente assim no LoL.

### ⏱️ MEIO — "O Relógio"

*A função que estava em aberto.* A resposta está no que o mid realmente faz no LoL — e não é dano.

O mid é a rota mais curta. Quem empurra a onda primeiro fica **livre** para ir a qualquer lugar. No jargão do jogo isso se chama literalmente **prioridade de mid**, e é o que decide quem ganha cada objetivo do mapa.

**Mecânica:** se o seu Mid vence a troca de rota na rodada, ele ganha **Prioridade**. Prioridade se gasta de duas formas — e só uma:

1. **Rotacionar** — mover para qualquer rota ou objetivo **ainda nesta rodada**, virando um 1v1 em 2v1 onde você quiser.
2. **Iniciativa** — agir primeiro na próxima rodada. Num jogo de posicionamento, mover antes é uma arma.

Por que isso o torna o centro estratégico: **o Mid é o único herói que interage ativamente com todos os outros quatro subsistemas por escolha, toda rodada.** Ele dobra com o jungler, salva o ADC, contesta o Dragão, reforça o Topo. Ele não é o mais forte — ele é o que decide onde a força vai.

A decisão do Mid é o momento mais interessante de cada rodada. É onde o jogo mora.

### 🎯 ATIRADOR — "O Investimento"

- **Único herói que escala de verdade.** Acumula ouro e sobe **patamares de poder** (3 patamares ao longo da partida). No último, é a maior fonte de dano do time.
- **Sinergia com o Suporte** (ideia do Vilker): enquanto o Suporte estiver vivo e na mesma rota, o ADC ganha escudo + bônus de dano. Suporte morre → ADC fica nu.
- Frágil. Pego sozinho, morre.

Isso instala o **relógio da partida**: um time joga pra fechar antes do ADC ficar online, o outro joga pra segurar até lá. Essa tensão é o meta central do LoL inteiro, e ela cai de graça dessa mecânica.

### ♻️ SUPORTE — "A Memória"

- **Recuperação** (ideia do Vilker): traz de volta do cemitério — reduz o timer de respawn de um aliado, ou recupera uma Carta de Ação da pilha de descarte.
- **Visão**: coloca **Wards** nas rotas. Ward ativa revela a carta do jungler inimigo antes da hora.
- Gera pouco ouro próprio (fiel: suporte é pobre e não liga).

O Suporte é o único herói cujo poder é medido inteiramente pelo que os outros conseguem fazer. Não tem número próprio grande — tem influência.

---

## 3. O loop de turno

Peso leve, 40–45 min, e você comanda 5 heróis. Isso só funciona se você **não** ativar os cinco. A decisão central de cada rodada é: **onde eu ponho minha atenção?**

### Rodada

**1. Manutenção** *(automático, ~30s)*
Ondas de creeps avançam em todas as rotas. Ouro passivo entra. Timers de respawn e objetivos descem 1.

**2. Comando Oculto** *(simultâneo, ~20s)*
Ambos os jogadores colocam a carta do jungler virada.

**3. Ordens** *(alternado — o grosso do turno)*
Você **rola 3d6**. Cada dado é uma **Ordem**. Aloca cada dado num herói — mas cada herói só aceita certos valores.

> **3 dados, 5 heróis.** Você nunca comanda todo mundo. Quem não recebe Ordem farma automaticamente com renda reduzida — continua no jogo, mas sem decisão sua.

Essa é a tradução mecânica exata de olhar o minimapa e escolher onde intervir.

**4. Revelação** *(~10s)*
As cartas de selva viram. Emboscadas resolvem.

**5. Combate** *(por rota, de cima pra baixo)*
Dano = valor do dado alocado + bônus da habilidade + stat − armadura. **Sem rolagem extra.**
Dado **6 natural** ativa a linha `Crítico:` da carta.

**6. Loja** *(~20s)*
Heróis mortos ou na base compram itens.

~4 min por rodada. 10 rodadas ≈ 40 min. ✅

### Por que o dado é alocação e não sorte

Rolar 3d6 e distribuir entre 5 heróis com requisitos diferentes é aleatoriedade de **input**: a rolagem cria o problema, você cria a solução. O oposto de "role pra ver se acertou".

E o **formato do requisito é a personalidade da classe**:

| Classe | Requisito | Como se sente |
|---|---|---|
| Tanque | `qualquer` | Consistente. Sempre faz o que planejou |
| Assassino | `5–6` | Alta variância. Quando alinha, mata alguém |
| Mago | `dois dados iguais` / `soma ≥ 9` | Combo. Monta a jogada, e a jogada é grande |
| Atirador | baixos, escala por dado gasto | Quer despejar os 3 dados no mesmo alvo |
| Lutador | médios, bônus por 2 dados juntos | Compromete-se. Entra e não sai |
| Suporte | `qualquer`, **pode alocar dado em ficha aliada** | Faz o outro jogar melhor |

**Válvulas contra a má sorte:** Buff Azul da selva = re-rolar 1 dado. Buff Vermelho = +1 de dano em toda alocação. Itens de assinatura alteram requisitos ("Provocar agora aceita `2–6`").

Isso amarra selva → dados → itens num sistema só, e faz o jungler importar de verdade: ele controla quem tem mais controle sobre a própria sorte.

---

## 4. Vitória

Estruturas em cada rota: **2 torres → inibidor → Nexus (5 de vida)**.
Inibidor caído → aquela rota gera **super-creeps**. Cada onda de super-creeps que alcança o Nexus tira 1 de vida.

Ou seja: **empurrar rota é a condição de vitória**, não um meio pra ela. Fiel, visual, e dispensa contagem de pontos.

---

## 5. Contagem de cartas

Com draft de 5 heróis por jogador e pick/ban, o pool precisa dar escolha real por rota.

| | v0.1 (testar) | v0.2 (meta vivo) |
|---|---|---|
| **Heróis** | 10 — 2 por rota | **20 — 4 por rota** |
| **Itens** | 12 | **24** — camada única, 3 slots por herói, sem árvore de componentes |
| **Monstros** | 3 — Dragão, Barão, Arauto | **7** — + 4 acampamentos de selva (2 são os buffs de dado) |
| **Cartas de Ação** | — | 15 — o baralho que o Suporte recupera |
| **Feitiços** | — | 5 — Flash, Ignição, Teleporte, Cura, Explosão |
| **Total** | **25** | **~71** |

Jogo leve **não aguenta árvore de itens**. Itens de camada única, comprados direto com ouro. O que não pode faltar são os **itens de resposta** (anti-cura, anti-crítico, anti-magia) — sem eles todo mundo compra a mesma build e o meta morre no terceiro jogo.

Torres, inibidor e Nexus são peças no tabuleiro. Creeps são tokens.

---

## 6. O grafo de interação

Nenhuma rota é ilha — exceto o Topo, que é ilha **de propósito**, e essa é a piada:

```
        SUPORTE ──ward──→ SELVA ──gank──→ (qualquer rota)
           │
        presença
           ↓
        ATIRADOR                TOPO ──teleporte──→ (qualquer rota)

              MEIO ──prioridade──→ TODAS
```

Cinco subsistemas, quatro tipos de interferência, um mapa.

---

## 7. Roadmap

| Versão | Entrega |
|---|---|
| **v0.1** | Guia web + mapa hexagonal interativo com miniaturas + 10 heróis + 12 itens + simulador de dados |
| **v0.2** | 20 heróis, 24 itens, pick/ban, objetivos épicos, cartas de ação |
| **v0.3** | Playtest dos três + balanceamento + patch notes |
| **v1.0** | Arte das cartas (pipeline Magnific/Nano Banana), print-and-play |

---

## 8. Ainda em aberto 🔸

1. **O Topo é automático demais?** Se o duelo resolve sozinho, o jogador pode sentir que 1/5 do time não é dele. Testar: dar 1 decisão pequena por rodada.
2. **Timing da revelação da selva.** "Fim do turno do oponente" é o certo? Ou revela no início do próximo turno dele? Muda todo o blefe.
3. **3 dados é o número?** Pode ser 3 fixo, ou escalar (3 → 4 no late game, acelerando o fim).
4. **Nome do jogo.** Precisa de um.
