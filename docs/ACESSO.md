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

**c)** Traga para o computador:

```bash
git clone https://github.com/<SEU-USUARIO>/jagerlaramais.git
cd jagerlaramais
```

**d)** Abra `jogo/index.html` com duplo clique. Pronto — não tem instalação, não tem servidor,
não tem npm. É HTML, CSS e JavaScript puro.

---

## 3 · Mexer com o Claude

O projeto foi feito para ser continuado dentro do **Claude Code**.

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
