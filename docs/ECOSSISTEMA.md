# Como três pessoas mexem no mesmo jogo

Vilker, Vinicius e Matheus, cada um com a sua versão, e um jogo oficial que junta o que deu certo.

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

**2. Uma pessoa por área, quando der.** Duas pessoas editando `jogo/index.html` no mesmo dia é
conflito garantido, porque é um arquivo único e grande.

| Área | Arquivo |
|---|---|
| Conteúdo (heróis, itens, cartas) | `data/catalogo.js` |
| Regras e motor | `jogo/index.html`, bloco `<script>` |
| Aparência do jogo | `jogo/index.html`, bloco `<style>` |
| Manual | `guia/index.html` |
| Cartas impressas | `cartas/index.html` |

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

## Trabalhando com o Claude

Cada um abre a própria pasta no Claude Code. O `CLAUDE.md` da raiz é lido automaticamente e já
carrega as regras do projeto e os agentes (`@game-director`, `@balance-math`, `@playtester`…).

Primeira mensagem numa janela nova, para gastar pouco:

```
Leia docs/ESTADO.md e docs/patch-notes.md e me diga em que pé está o jogo.
```

Ver `docs/COMO-CONTINUAR.md` para o resto.
