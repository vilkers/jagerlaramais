# Entrando no Jagerlaramais

Vinicius, Matheus — é isto aqui. Leva uns 10 minutos.

---

## 1 · Só jogar (2 minutos, no celular)

Abra:

**https://vilkers.github.io/jagerlaramais/jogo/**

Escolha **Jogar o tutorial** na primeira vez. São 9 passos e ensinam jogando.

> O jogo é dos dois no **mesmo aparelho**, passando a vez — como jogo de tabuleiro mesmo.
> Cada um no seu celular abre duas partidas separadas.

O manual completo: **https://vilkers.github.io/jagerlaramais/guia/**
As 20 cartas de herói: **https://vilkers.github.io/jagerlaramais/cartas/**

---

## 2 · Ter a sua versão para mexer

**a)** Crie uma conta no GitHub, se ainda não tiver: [github.com/signup](https://github.com/signup)

**b)** Abra [github.com/vilkers/jagerlaramais](https://github.com/vilkers/jagerlaramais) e clique
em **Fork**, no canto superior direito. Isso cria uma cópia inteira do jogo na sua conta.
Ela é sua: mexa à vontade, não quebra nada do oficial.

**c)** Agora escolha um dos dois caminhos:

### Caminho A — sem instalar nada (recomendado para começar)

Na página do **seu** fork, aperte a tecla **`.`** (ponto). O GitHub abre um VS Code inteiro dentro
do navegador, com todos os arquivos do jogo. Você edita, e no painel da esquerda (o ícone de galhos)
escreve o que mudou e clica em **Commit & Push**. Pronto — não instalou nada.

Para **ver a sua versão rodando**, ligue o Pages no seu fork:
`Settings → Pages → Source: Deploy from a branch → Branch: main → / (root) → Save`.
Em dois minutos o seu jogo fica em `https://<SEU-USUARIO>.github.io/jagerlaramais/`.

### Caminho B — no seu computador

```bash
git clone https://github.com/<SEU-USUARIO>/jagerlaramais.git
cd jagerlaramais
```

Abra `jogo/index.html` com duplo clique. Não tem instalação, não tem servidor, não tem npm.
É HTML, CSS e JavaScript puro. (Precisa do Git instalado: [git-scm.com](https://git-scm.com/downloads).)

---

## 3 · Mexer com IA

O projeto foi feito para ser continuado com ajuda de IA — Claude Code, ChatGPT, o que você preferir.
Os arquivos são separados justamente para isso (ver `docs/ECOSSISTEMA.md`, seção "duas IAs ao mesmo tempo").

### No Claude Code

**a)** Abra a pasta `jagerlaramais` no Claude Code (terminal, app ou claude.ai/code).

**b)** Primeira mensagem — esta aqui é de propósito, porque gasta pouco contexto:

```
Leia docs/ESTADO.md e docs/patch-notes.md e me diga em que pé está o jogo.
```

O Claude já vai entender o resto sozinho: existe um `CLAUDE.md` na raiz que ele lê automaticamente,
com as regras do projeto e os agentes especializados.

**c)** Coisas que funcionam bem de pedir:

```
@game-director vale a pena colocar o Dragão no tabuleiro agora?
@balance-math o Corvo com alcance 4 está forte demais? simula 500 duelos
@playtester tenta quebrar o Deck de Comando, procura combo infinito
@ux-game joga o tutorial no celular e me diz onde eu travaria
@card-smith escreve 3 heróis novos de suporte, com arquétipo diferente dos 4 que já existem
```

### No ChatGPT (ou qualquer IA que não enxerga o repositório)

Ela não lê os seus arquivos sozinha. Cole **um arquivo por conversa** e diga o que ele é:

| Quer mexer em | Cole |
|---|---|
| Aparência do jogo | `jogo/estilo.css` |
| Regras, turno e combate | `jogo/motor.js` |
| Interface e interação | `jogo/interface.js` |
| Deck de Comando | `jogo/cartas.js` |
| Draft e abertura | `jogo/jogo.js` |
| Herói, item, carta | `data/catalogo.js` |
| Manual | `guia/index.html` |

Comece a conversa com: *"Isto é o CSS de um jogo de tabuleiro em HTML/CSS/JS puro, sem framework,
sem npm e sem CDN — tem que continuar abrindo com duplo clique. Não mude nenhum nome de classe."*
Depois cole o arquivo inteiro de volta no GitHub e faça commit.

---

## 4 · Devolver o que você fez

```bash
git add -A
git commit -m "o que você mudou, em uma frase"
git push
```

Depois, na página do seu fork no GitHub, aparece um botão **Compare & pull request**. Clique.
Os outros dois olham e aprovam. É assim que a sua ideia entra no jogo oficial.

Para trazer o oficial atualizado para a sua versão: botão **Sync fork**, e depois `git pull`.

---

## As três regras que não se quebra

**1. Herói, item e carta vivem em `data/catalogo.js`.** Nunca escreva carta direto no HTML.
O jogo, o guia e o visualizador de cartas leem todos desse arquivo.

**2. Mudou um número? Escreve no `docs/patch-notes.md`,** dizendo de quanto para quanto.

**3. Nada de framework, npm ou CDN.** O jogo tem que continuar abrindo com duplo clique.

---

## Se travar

- O jogo abre em branco → abra o console (F12) e veja o erro. Cole no Claude.
- Uma função "não existe" sem erro no console → é quase sempre a armadilha do `const`.
  Está explicada em `docs/ESTADO.md`.
- Não entendeu uma regra → `docs/02-regras.md` tem tudo, escrito para quem nunca jogou.
