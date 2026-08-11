# Como três pessoas mexem no mesmo jogo

Vilker, Vinicius e Matheus, cada um com a sua versão, e um jogo oficial que junta o que deu certo.

---

## Regra permanente a partir da v15

**Não substituir `jogo/index.html` diretamente na `main`.** O arquivo de 3 MB usado para teste é gerado; ele não é a fonte do jogo. Mudanças definitivas entram em `jogo/index.html`, `jogo/estilo.css`, `jogo/jogo.js` e `data/catalogo.js`, cada uma no lugar correto.

Toda contribuição usa branch + Pull Request e recebe um registro em `docs/versions/vNN/`. O checklist completo está em `docs/UPDATE-PROTOCOL.md`.

---

## O modelo: 1 oficial + 1 cópia para cada um

```
        vilkers/jagerlaramais          ← O OFICIAL
        github.com/vilkers/…              é o que vale, é o que publica no celular
                  ▲
      ┌───────────┼───────────┐
      │           │           │          ← as cópias (forks)
  vilker/     vinicius/    matheus/         cada um mexe na sua, sem pedir licença
```

**Fork é a "pasta com a cópia do jogo" que você pediu** — só que com um botão de trazer de volta.
Cada fork é um repositório inteiro, no GitHub da própria pessoa, com o próprio endereço de jogo.

| | |
|---|---|
| Mexer na sua versão | Você é dono. Não precisa de permissão de ninguém. |
| Levar uma mudança sua para o oficial | Abre um **Pull Request**. Os outros dois olham e aprovam. |
| Trazer o oficial atualizado para a sua versão | **Sync fork** (um botão na página do seu fork). |
| Jogar no celular | Cada fork pode ter o próprio endereço, ver abaixo. |

### Por que não três pastas dentro do mesmo repositório

Porque três cópias de `jogo/index.html` **divergem em uma semana** e não existe jeito de trazer o
conserto de uma para as outras — você acaba copiando trecho na mão e perdendo alterações.
Fork faz exatamente o que você descreveu **e** resolve isso: o Git sabe comparar as versões.

---

## Passo a passo

### Uma vez só, na sua máquina

```bash
git clone https://github.com/<seu-usuario>/jagerlaramais.git
cd jagerlaramais
```

Abra `jogo/index.html` com duplo clique. Não tem instalação, não tem servidor.

### No dia a dia

```bash
git switch -c minha-ideia      # trabalha numa linha separada
# … mexe, joga, mexe …
git add -A
git commit -m "novo herói de selva com marca"
git push -u origin minha-ideia
```

E na página do seu fork, clique em **Compare & pull request**.

### Antes de começar qualquer coisa

Na página do seu fork, clique **Sync fork**. Depois:

```bash
git pull
```

Isso evita 90% dos conflitos.

---

## As regras que evitam briga de merge

**1. Conteúdo só em `data/catalogo.js`.** Herói, item e carta vivem lá. Nunca escreva carta direto
no HTML — foi exatamente esse erro que criou três catálogos divergentes até a v0.3.

**2. Uma pessoa por arquivo, no mesmo dia.** O jogo foi separado em três arquivos exatamente para
isso: dá para mexer no visual e no motor ao mesmo tempo, sem se atropelar.

| Área | Arquivo | Quem mexe aqui pode quebrar regra? |
|---|---|---|
| Conteúdo (heróis, itens, cartas) | `data/catalogo.js` | sim — número é regra |
| Regras, motor e interface | `jogo/jogo.js` | sim |
| Aparência do jogo | `jogo/estilo.css` | **não** — mexa à vontade |
| Estrutura da tela | `jogo/index.html` | só se apagar um `id` |
| Manual | `guia/index.html` | não |
| Cartas | `cartas/index.html` | não |

> `jogo/estilo.css` é a área segura. Quem quiser reformar fonte, cor, sombra, animação e layout
> não precisa entender nada de regra — só **não renomear classe nem `id`**, porque o JavaScript
> procura por eles.

**3. Mudou número? Vira patch note.** `docs/patch-notes.md`, entrada nova no topo, dizendo
**de quanto para quanto**. Sem isso ninguém sabe por que o Vharn está diferente.

**4. `docs/ESTADO.md` é o retrato do presente.** Terminou uma frente? Tire de "o que NÃO existe"
e escreva o patch note. Esse arquivo é o que faz uma janela nova do Claude entender o projeto barato.

**5. Não commite `arte/` pesada.** Retrato de herói fecha em ~15 KB na pasta `web/`. Se um PNG de
8 MB entrar no histórico, ele fica lá para sempre.

---

## Publicar para jogar no celular

**GitHub Pages**, no repositório oficial:

`Settings → Pages → Source: Deploy from a branch → Branch: main → / (root) → Save`

Em um ou dois minutos o jogo fica em:

```
https://vilkers.github.io/jagerlaramais/jogo/
https://vilkers.github.io/jagerlaramais/guia/
https://vilkers.github.io/jagerlaramais/cartas/
```

Cada um pode fazer o mesmo no próprio fork e ter o próprio endereço para testar a sua versão.

> ⚠️ **Publicar não torna o jogo multiplayer.** Ele continua *hotseat*: os dois jogam no MESMO
> aparelho, passando a vez. Abrir em dois celulares dá duas partidas separadas.
> Rede exigiria servidor e sincronização de estado — é outro projeto, não um ajuste.

> 📌 **Pages exige repositório público** em conta gratuita. Se vocês preferirem manter privado,
> o jogo continua funcionando por duplo clique depois do `git clone` — só não tem endereço.

---

## Duas IAs ao mesmo tempo (Claude e ChatGPT)

Funciona bem, e por um motivo simples: **o conflito nunca é entre as IAs, é entre dois arquivos
editados ao mesmo tempo.** Quem arbitra é o Git, não o assistente.

### A divisão que faz isso funcionar

| | Claude Code | ChatGPT (ou outra IA sem acesso ao repositório) |
|---|---|---|
| **Boa em** | ler o repositório inteiro, rodar o jogo, testar por script, mexer em várias telas de uma vez | reformar um arquivo fechado: CSS, layout, tipografia, texto de carta |
| **Dê a ela** | `jogo/jogo.js` · `data/catalogo.js` · regra, balanceamento, bug | `jogo/estilo.css` · `guia/index.html` · `cartas/index.html` |
| **Por quê** | precisa ver o efeito da regra no jogo todo | é upgrade visual, não depende de entender a regra |

### O protocolo, em quatro passos

1. **`git pull` antes de começar.** Sempre. É o que evita quase todo conflito.
2. **Uma frente por vez em cada arquivo.** Visual no `estilo.css`, regra no `jogo.js`. Nunca os dois
   no mesmo arquivo no mesmo dia.
3. **Commit pequeno e frequente**, com uma frase dizendo o que mudou.
4. **Terminou uma frente?** Escreva no `docs/patch-notes.md` e atualize `docs/ESTADO.md`.
   É isso que faz a *outra* IA (e a outra pessoa) entender o que aconteceu sem você explicar de novo.

### Como abrir a conversa no ChatGPT

Ela não enxerga o repositório. Cole **um arquivo por conversa** e ancore as regras logo na primeira
mensagem, senão ela vai sugerir Tailwind, React e três bibliotecas de CDN:

> Isto é o CSS de um jogo de tabuleiro em HTML/CSS/JS puro. Restrições que **não** mudam:
> sem framework, sem npm, sem CDN, sem build — o jogo abre com duplo clique num arquivo local.
> Mobile-first, `100dvh`, alvo de toque mínimo 44px. Paleta: verde-petróleo escuro com um único
> acento de latão. **Não renomeie nenhuma classe nem `id`** — o JavaScript procura por eles.
> Quero um upgrade de tipografia, hierarquia e animação. Me devolva o arquivo inteiro.

E o mesmo, de volta: quando o CSS voltar reformado, cole no GitHub, faça commit, e peça ao Claude
*"o CSS foi reformado por fora — abre o jogo e me diz se quebrou alguma tela"*.

---

## Trabalhando com o Claude

Cada um abre a própria pasta no Claude Code. O `CLAUDE.md` da raiz é lido automaticamente e já
carrega as regras do projeto e os agentes (`@game-director`, `@balance-math`, `@playtester`…).

Primeira mensagem numa janela nova, para gastar pouco:

```
Leia docs/ESTADO.md e docs/patch-notes.md e me diga em que pé está o jogo.
```

Ver `docs/COMO-CONTINUAR.md` para o resto.
