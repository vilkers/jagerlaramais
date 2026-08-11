# JOGAR.html — o jogo inteiro num arquivo só

Vilker, Vinicius, Matheus — isto aqui é para **jogar**, não para ler código.

O GitHub não roda o jogo: um Pull Request mostra só o diff. Este arquivo existe
para tirar o jogo do repositório e pôr na mão de alguém — inclusive de quem não
usa git.

## Baixar e abrir

> **O arquivo precisa ser BAIXADO — não adianta só clicar.** O GitHub entrega
> `.html` como texto puro, então clicar no link mostra o código-fonte em vez de
> abrir o jogo. E em diff de Pull Request ele nem aparece: 3 MB passa do limite
> que o GitHub renderiza.

1. Abra **[`teste/JOGAR.html`](JOGAR.html)** pela aba **Code** do repositório
2. No canto direito, clique em **Download raw file** — o ícone **⤓**
3. Abra o arquivo baixado com **duplo clique**

Não precisa de git, servidor, npm nem internet — o jogo inteiro (código,
aparência e as 70 imagens) está dentro do arquivo. No celular funciona igual:
baixe e abra pelo navegador.

**Quem tem o repositório clonado não precisa disto** — é só abrir `jogo/index.html`.
O `JOGAR.html` é para mandar por WhatsApp, e-mail ou pendrive.

## O que ainda precisa do julgamento de vocês

A leva v0.5.5 → v0.6.2 já está na `main`, revisada e mergeada. Mas revisar código
não é jogar, e **três coisas centrais continuam sem validação humana** — a
simulação é cega a elas:

**1. Quem começa está forte demais.** É o problema aberto mais antigo do projeto.
`sim/bateria.js` mede estrutura (geometria, onda, torre, ritmo) e **não mede
escolha**: dando 6 dados extras à Retomada o número não se moveu, porque o agente
joga ao acaso. A impressão de vocês jogando vale mais que a medição aqui.

**2. O poço épico e a Retomada valem o que custam?** Entraram na v0.5.5 e nunca
foram avaliados por gente. Na simulação o time que levava 62% dos épicos *perdia* —
ela via o dado gasto e o revide, não via o Poder ganho.

**3. A loja tem o peso certo?** A correção da v0.5.7 barateou voltar para comprar.
O agente não faz compras, então só playtest diz se ficou bom.

## O que olhar enquanto joga

**O cerco por herói ficou bom ou virou atalho?** Desde a v0.6.1 o herói bate na
torre exposta sem esperar a onda, e no Nexus depois que uma rota inteira cai.
Antes ele dependia do creep e ninguém cercava de verdade — os golpes de herói em
torre por partida foram de 1,4 para ~3.

**A rota com 2 hexágonos de largura resolveu?** Suporte e atirador deveriam caber
juntos. O meio tem 2 casas em toda a extensão; **topo e baixo têm um passo de 1
casa** onde a dupla ainda não passa lado a lado. Reparem se atrapalha.

**A selva de 30 casas vale a pena?** Ela quase dobrou e **continua vazia** —
acampamentos de selva não existem ainda. É mais chão para andar e flanquear, não
mais o que fazer.

**O hexágono encolheu.** O tabuleiro foi de 64 para 116 casas e o alvo de toque
caiu junto, abaixo dos 44px de referência. **Reparem se erra o dedo** — é a
dívida mais provável da leva v0.6, e ninguém reavaliou em tela pequena.

**Três habilidades ainda matam de vida cheia.** Nyx/Bote, Cael/Armadilha e
Kurr/Salto Mortal chegam a 10 de dano contra vida 10, por causa do bônus fixo de
+2. Baixar para +1 fecharia a meta da v0.5.9. **Ficou de propósito para vocês
decidirem.**

## Se o arquivo estiver velho

Ele é **gerado**, não escrito à mão. O cabeçalho do arquivo traz o commit de
origem. Para regerar a partir da fonte:

```bash
node teste/empacota.js
```

Não edite o `.html` — mexa em `jogo/`, `data/` e `arte/`, e rode o script.
