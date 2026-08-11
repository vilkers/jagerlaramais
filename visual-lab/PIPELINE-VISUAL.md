# Pipeline visual — como um personagem nasce sem sair inconsistente

> Documento operacional da trilha de **criação**. O que está aqui é procedimento, não opinião.
> A intenção criativa (DNA, craft, roadmap) mora em `JAGERLARAMAIS-CREATIVE-HANDOFF.md`.
> Este arquivo responde uma pergunta só: **em que ordem, com que referência, com que prompt.**

Escrito a partir da engenharia reversa do único kit que já fechou — a **Dona Chinela**.
Ela é o padrão-ouro: se um personagem novo não passa nos mesmos portões que ela passou,
ele ainda não está pronto.

---

## 1. Por que as imagens saem inconsistentes

Três causas, e todas são de processo, não de ferramenta.

**Causa 1 — redescrever o personagem em texto a cada etapa.**
Se cada prompt reescreve "avó baixinha de cabelo branco", o modelo reinventa o rosto toda vez.
Texto é bom para pedir *diferença* (pose, ângulo, luz, ambiente). É péssimo para manter *identidade*.
Identidade se mantém com **imagem de referência**, sempre.

**Causa 2 — usar a arte ambientada como referência de identidade.**
A key art da etapa 05 já tem luz dramática, cor de ambiente e fumaça. Usá-la como referência
contamina a próxima geração: o personagem volta com a pele do ambiente anterior grudada nele.
A referência de identidade é **sempre o master limpo em fundo neutro** (etapa 02).
Não é coincidência que o kit da Dona tenha um "master limpo do corpo" separado (`O6Nh38tynm`) —
essa peça existe exatamente para isso.

**Causa 3 — deixar o modelo "melhorar" a arma.**
O Corretivo virou marreta e ganhou cabo em várias tentativas. Arma é a parte da silhueta que o
modelo mais gosta de reinterpretar. Por isso ela sai da prancha e vira **product master isolado**
(`4R3f2Jm9Aa` / `4R3fnnb9Aa`), que entra como segunda referência em toda etapa seguinte.

**A regra que resolve as três:**

> **Depois da etapa 02, nada nasce de texto puro.**
> Toda geração recebe um master anterior como referência de imagem.
> O texto descreve só o que muda.

---

## 2. As três peças que todo personagem tem que ter antes de virar carta

Não são etapas do pipeline. São os **arquivos-chave** que o pipeline produz e depois consome
para sempre. Se um deles não existe, o personagem vai divergir mais cedo ou mais tarde.

| Peça | O que é | De onde sai | Para que serve |
|---|---|---|---|
| **CHARACTER MASTER** | Personagem inteiro, pose neutra, fundo neutro, sem FX | Etapa 02 | Referência de identidade de **todas** as etapas seguintes |
| **PRODUCT MASTER** | A arma/objeto isolada, fundo neutro, 3/4 | Etapa 03 (extraída) | Impede a arma de mutar |
| **FICHA DE TRAVAS** | Bloco de texto curto com o que nunca muda | Craft, antes de gerar | Colado literal em todo prompt |

A Dona Chinela tem os três. P.O.M.B.O. e Catarino ainda não têm nenhum — é por isso que eles
ainda estão em "concept wave 1" e é por isso que gerar a ambientada deles agora, direto do
concept, vai produzir um personagem diferente do que está no concept.

---

## 3. As seis etapas

Ordem fixa. Não pule. Uma etapa só começa quando a anterior tem um master aprovado.

### 01 — Concept ilustrado
- **Referência de entrada:** nenhuma (única etapa de texto puro) + moodboard de material, se ajudar.
- **Resolve:** silhueta, proporção, arquétipo, obsessão, arma, atitude.
- **Sai:** 1 imagem. Ilustrado, pode ter linework.
- **Portão:** a leitura funciona em miniatura de 64px? Se a silhueta não conta quem é o
  personagem em preto sobre branco, volte para o craft — não avance.

### 02 — Render master
- **Referência de entrada:** o concept 01.
- **Resolve:** rosto, materiais, acabamento 3D premium, paleta final. Aqui o personagem
  ganha rosto definitivo — este é o arquivo mais importante do kit inteiro.
- **Sai:** 2 arquivos. `render-master` (pose hero 3/4, fundo neutro quente) e, se a pose hero
  tiver oclusão, um **master limpo do corpo** com a arma afastada.
- **Portão:** fundo neutro, sem FX, sem fumaça, sem luz de cena. Se tiver drama, não serve
  como referência.

### 03 — Character sheet + expressões
- **Referência de entrada:** o render master 02.
- **Resolve:** costas, perfil, duas expressões, arma isolada.
- **Layout fixo** (é o da Dona, e vira o do elenco todo):
  ```
  ┌──────────┬──────────────────┬──────────┐
  │ 2 COSTAS │  1 HERO 3/4      │ 3 PERFIL │
  ├──────────┴───────┬──────────┴──────────┤
  │ 4 DUAS EXPRESSÕES│ 5 ARMA ISOLADA      │
  └──────────────────┴─────────────────────┘
  ```
  Painéis numerados no canto, fundo neutro quente único, mesma luz nos cinco.
- **Sai:** a prancha + **o painel 5 recortado como PRODUCT MASTER**.
- **Portão:** as duas expressões são autorais e opostas (a Dona tem "julgamento contido" e
  "prazer travesso"). Duas variações do mesmo sorriso não contam.

### 04 — Miniatura 3D
- **Referência de entrada:** render master 02 + prancha 03.
- **Resolve:** viabilidade de impressão. Clay render + versão colorida, frente e costas,
  **base hexagonal**, peças frágeis engrossadas, pontos de apoio resolvidos.
- **Portão:** nada mais fino que ~1,5mm na escala real. Se a antena/tubo/corrente quebra
  no papel, quebra na resina.

### 05 — Carta ambientada (key art)
- **Referência de entrada:** render master 02 (identidade) + product master (arma) + placa de
  território. **Nunca** o concept 01, **nunca** a prancha 03 inteira.
- **Resolve:** acting, território, luz de cena, drama.
- **Sai:** 2 arquivos. **Arte limpa** (sem UI) e **arte aplicada** no layout da carta.
- **Espaço seguro obrigatório** na arte limpa — ver seção 5.
- **Portão:** é a etapa mais criativa e a mais perigosa. Rode a **prova neutra** antes de
  aprovar (seção 6).

### 06 — Vídeo
- **Referência de entrada:** a key art 05 como primeiro frame + character master 02 +
  product master.
- **Não precisa fechar em loop.**
- **Resolve:** acting marcante em poucos segundos. Câmera praticamente travada.
- **Sai:** MP4 H.264 + WebM + poster estático (o frame usado como pôster é o da carta parada).
- **Portão:** rosto não pode deformar. O teste `jUSpalFLD0` foi rejeitado exatamente por isso —
  Seedance Mini deformou rosto e expressão. Rota atual recomendada: **Kling 3.0**.

---

## 4. A anatomia de um prompt

Todo prompt de toda etapa tem quatro blocos, nesta ordem. Os blocos A e B são **colados
literalmente, sem reescrever**. Só o bloco C muda entre etapas.

```
[BLOCO A — DNA DO ELENCO]     ← idêntico para todo personagem, sempre
[BLOCO B — TRAVAS DO PERSONAGEM] ← idêntico para todas as etapas dele, sempre
[BLOCO C — PEDIDO DA ETAPA]   ← a única parte que você escreve
[BLOCO D — NEGATIVOS]         ← DNA + travas negativas, colado
```

### BLOCO A — DNA do elenco (colar literal)

```
Estilo: 3D estilizado com acabamento ilustrado, qualidade de key art de jogo competitivo
premium. Volumes toyéticos, anatomia estilizada com peso claro, proporções que sobrevivem
como miniatura impressa. Materiais com memória: madeira, azulejo, plástico, tecido, sucata —
cada superfície conta uma história de uso antes de qualquer texto. Luz suave e volumétrica
com definição de forma limpa. Leitura garantida em thumbnail. Silhueta primeiro: uma grande
forma dominante, uma secundária, poucos detalhes terciários. Cor de rota aparece como acento
tático, nunca domina a identidade.
Tom: cotidiano brasileiro periférico levado a escala épica. Comédia irreverente na superfície,
afeto e perda por baixo. Fantasia do improviso — todo poder nasce de uma solução caseira.
```

### BLOCO B — Travas (uma por personagem, ver seção 7)

Regra de escrita das travas: **substantivo + material + relação**, nunca adjetivo solto.
"Óculos dourados de meia-lua com corrente presa no vestido" trava. "Óculos bonitos" não trava.
Máximo ~10 linhas. Se passar disso, o personagem tem detalhe demais para virar miniatura.

### BLOCO C — Pedido da etapa

Descreve **só a diferença**: ângulo, pose, expressão, ambiente, luz, enquadramento.
Não repete nada que já está no bloco B.

### BLOCO D — Negativos (colar literal)

```
Não: estilo anime, cel-shading chapado, realismo fotográfico, proporção realista,
linework grosso de cartoon 2D, personagem genérico de fantasia medieval, armadura de placa,
sci-fi limpo e polido, logotipo, marca d'água, texto legível na imagem, assinatura,
membro extra, mão deformada, olhar morto, sorriso de banco de imagem.
```

---

## 5. Espaço seguro da carta

A carta ambientada precisa nascer já sabendo onde a UI vai entrar. Peça o enquadramento
com estas zonas livres — é mais barato do que recompor depois.

```
┌─────────────────────────────┐
│  ░░ topo 12% — livre ░░     │  nome + epíteto
│                             │
│                             │
│        ACTING               │  rosto no terço superior
│        (personagem)         │  arma legível, não cortada
│                             │
│                             │
│  ░░ base 22% — livre ░░     │  atributos + 3 skills
└─────────────────────────────┘
   ↑ 8% ↑                ↑ 8% ↑     laterais: sem detalhe crítico
```

- Proporção da arte limpa: **3:4**.
- O rosto vive no terço superior. Se o rosto cai no meio, a UI de baixo come o corpo.
- Nada de detalhe narrativo importante nos 22% de baixo — ele vai sumir.
- Gere **também** uma versão sem nenhum crop (full bleed) para o vídeo da 06 ter margem.

---

## 6. Os três portões de qualidade

Rodar antes de dar um asset por aprovado. Custam pouco e evitam refazer o kit.

**Portão 1 — Thumbnail.** Reduza para 64px de largura. Ainda dá para dizer quem é?
Se não, a silhueta falhou e nenhuma etapa seguinte conserta.

**Portão 2 — Prova neutra.** Gere o personagem **e** a arma juntos, pose neutra, fundo neutro,
usando os masters como referência. É o `eI8wQ8odqL` do kit da Dona. Compare lado a lado com o
render master 02. Se rosto, proporção ou arma mudaram, a etapa que você acabou de gerar está
contaminada — descarte e refaça referenciando o master limpo, não a última imagem gerada.

**Portão 3 — Tira de continuidade.** Coloque, lado a lado, na mesma altura:
`02 render` · `03 painel 1` · `04 colorido` · `05 key art` · `06 poster`.
Cinco imagens, um personagem. Se um dos cinco parece outra pessoa, ele volta.

---

## 7. Fichas de travas

### Dona Chinela — TOPO · TANQUE (aprovada)

```
TRAVAS — DONA CHINELA
Avó baixa e roliça, silhueta de pera, cabeça grande. Cabelo branco em nuvem enorme e
volumosa, quase do tamanho do torso. Óculos dourados de meia-lua na ponta do nariz, com
corrente fina descendo até o vestido. Bochechas coradas, sorriso fechado e travesso.
Vestido floral escuro de manga curta, estampa miúda de rosas. Avental de ferramentas bege
acolchoado na cintura, bolsos cheios de canetas, chaves, tesoura, alicate, doces e bugigangas
coloridas. Ombreira única de azulejo português azul e branco no ombro esquerdo, presa por
alça de tecido. Meias listradas coloridas. Tamancos de madeira gastos nos pés.
ARMA — O CORRETIVO: tamanco gigante de madeira avermelhada usado como bazuca. Fivela metálica
no peito do pé, pistão cromado embutido na sola, dentes metálicos serrilhados na borda,
argola de metal na traseira, o nome "ODETE" gravado na lateral.
```

```
NEGATIVOS — DONA CHINELA
Não: transformar O Corretivo em marreta, martelo ou machado. Não adicionar cabo, haste ou
empunhadura comprida ao tamanco. Não deixar a avó magra, alta ou jovem. Não trocar o cabelo
nuvem por coque ou cabelo liso. Não remover a corrente dos óculos. Não colocar mais de uma
ombreira de azulejo.
```

Território: **pátio do Conjunto Fortaleza** — azulejo, reboco descascado, varais cruzando o
alto, caixas-d'água, antenas, puxadinhos, Nexus verde-lima rachando o chão.

### P.O.M.B.O. — SELVA · ASSASSINO (concept, precisa de refine)

```
TRAVAS — P.O.M.B.O.
Pombo urbano ciborgue brasileiro, escala de praga, não de mascote. Peito estufado e inflado
como postura dominante. Um olho substituído por lente óptica mecânica, o outro orgânico e
nervoso. Próteses assimétricas: uma pata de metal recuperado, uma asa parcialmente mecânica.
Pequeno moicano de penas eriçadas no topo da cabeça. Mochila de roteador com antena torta
presa às costas por cintas. Crucifixo ciborgue integrado ao peitoral, com aparência de
relíquia pessoal gasta. Penas encardidas de cidade, cinza-chumbo com iridescência oleosa no
pescoço. Sucata urbana como material dominante: chapa, arame, fita, plástico queimado.
Postura sempre baixa, tensa, de quem vai roubar e sair correndo.
```

```
NEGATIVOS — P.O.M.B.O.
Não: robô sci-fi limpo e polido, ave genérica simpática, mascote fofo de app, pombo realista
de fotografia, corpo simétrico, penas brancas de pomba. Não reduzir a linework 2D grosso —
o acabamento é 3D premium. Não deixar dócil: ele é nervoso, oportunista e territorial.
```

Território: **Ferro-Velho Vivo** — sucata biotecnológica que cresce, caça e recicla invasores.

### Catarino — MEIO · MAGO (concept, precisa de refine)

```
TRAVAS — CATARINO
Criança pequena e congestionada, energia de moleque que apronta. Catarro verde visivelmente
escorrendo do nariz, tratado com humor cartunesco, nunca com gore realista. Dente da frente
tortinho, joelho ralado com casquinha, roupa vivida: camiseta puída, bermuda folgada,
chinelo. Olhos vivos e um pouco desfocados de quem está sempre gripado.
ARMA/MOCHILA: mochila química improvisada nas costas, com garrafão, mangueiras e válvulas —
lógica funcional de aparato de mago-químico, sem copiar personagem existente. A arma na mão
precisa explicar visualmente como o catarro é coletado, pressurizado e disparado: bomba
manual, tubo de sucção que sobe até o nariz, câmara de pressão transparente, bico de disparo.
Materiais: plástico de garrafa, elástico de câmara de ar, fita isolante, cano de PVC.
```

```
NEGATIVOS — CATARINO
Não: esfera de magia verde genérica flutuando na mão — a fonte do catarro tem que ser um
objeto peculiar e memorável. Não copiar Singed nem qualquer personagem existente. Não gore
realista, não muco fotorrealista repulsivo. Não criança limpinha e comportada — ele é over,
caótico e um pouco nojento, mantendo apelo de personagem de jogo.
```

Território: **Praça da Transmissão** — antenas disputando a última frequência da Várzea.

---

## 8. Estado real de P.O.M.B.O. e Catarino, e o que fazer agora

Os dois estão em **concept wave 1** e o handoff registra que os dois precisam de refine antes
de virar master. **Gerar a ambientada e o vídeo deles agora, direto do concept, é exatamente a
receita da inconsistência** descrita na seção 1 — não existe render master limpo para servir de
referência de identidade, então a etapa 05 vai inventar um rosto novo, e a 06 vai inventar
outro em cima desse.

A ordem que economiza retrabalho:

1. **Refine do concept** (01') com as decisões já tomadas: moicano e crucifixo no P.O.M.B.O.;
   objeto peculiar de coleta e mochila química no Catarino.
2. **Render master 02** de cada um, fundo neutro, sem FX. → é este arquivo que destrava tudo.
3. **Prancha 03** com as duas expressões + recorte do product master.
4. **Prova neutra** (portão 2) contra o render master.
5. Só então **05 ambientada** e **06 vídeo**.

As etapas 02 e 03 podem rodar em paralelo entre os dois personagens. As etapas 05 e 06 não —
a 06 depende do frame aprovado da 05.

---

## 9. Onde os arquivos moram

```
visual-lab/creative-assets/characters/<slug>/
  01-concept/          <slug>-01-concept-<n>.jpg
  02-render/           <slug>-02-render-master.jpg
                       <slug>-02-body-master.jpg      ← master limpo, sem oclusão
  03-character-sheet/  <slug>-03-sheet.jpg
                       <slug>-03-product-master.jpg   ← arma recortada do painel 5
  04-miniature/        <slug>-04-clay.jpg  <slug>-04-color.jpg
  05-key-art/          <slug>-05-keyart-limpa.jpg
                       <slug>-05-keyart-carta.jpg
  06-video/            <slug>-06.mp4  <slug>-06.webm  <slug>-06-poster.jpg
  fonte.md             travas, IDs de nuvem, prompts usados, o que foi rejeitado e por quê
```

Nomes em minúsculo, sem acento, separados por hífen. A largura no fim do nome (`-900`, `-1600`)
existe só nas derivadas web, nunca no master.

**Masters ficam em `creative-assets/` em resolução cheia.** As derivadas que o Guide consome
ficam em `visual-lab/images/` (servida pelo GitHub Pages) e `visual-lab/public/images/`
(servida pelo Next). Sim, são duas cópias — é o preço de a mesma página ser publicada por
duas hospedagens diferentes. Rode `node visual-lab/scripts/sync-imagens.mjs` para não
sincronizar na mão e não esquecer um lado.

**Nada de regenerar do zero quando existe master.** Os IDs de nuvem do kit da Dona estão em
`JAGERLARAMAIS-CREATIVE-HANDOFF.md` e em `dados/personagens.json`.

---

## 10. Checklist de fechamento de personagem

Um personagem só sai de "em produção" quando todas as linhas estão marcadas.

- [ ] Craft escrito: arquétipo, obsessão, cicatriz de lore, território, rota, função, 3 skills
- [ ] Ficha de travas escrita (≤10 linhas) e negativos escritos
- [ ] 01 concept aprovado · passou no portão thumbnail
- [ ] 02 render master em fundo neutro + body master limpo
- [ ] 03 prancha com 2 expressões opostas + product master recortado
- [ ] 04 clay + colorido, base hexagonal, nada fino demais para imprimir
- [ ] Portão prova neutra rodado contra o render master
- [ ] 05 key art limpa (3:4, espaço seguro) + versão aplicada na carta
- [ ] 06 vídeo em MP4 + WebM + poster, sem deformar rosto
- [ ] Portão tira de continuidade: os cinco parecem a mesma pessoa
- [ ] Atributos e skills batendo com `data/catalogo.js` (`node sim/checa-visual.js`)
- [ ] `dados/personagens.json` atualizado e `fonte.md` preenchido
