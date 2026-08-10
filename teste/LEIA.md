# Como jogar a versão que está em avaliação

Vilker, Matheus — isto aqui é para **jogar**, não para ler código.

O GitHub não roda o jogo: um Pull Request mostra só o diff, e o site publicado
(`vilkers.github.io/jagerlaramais`) serve a **`main`**, que ainda não tem nada
desta leva. Por isso este arquivo existe.

## Baixar e abrir

> **O arquivo precisa ser BAIXADO — não adianta só clicar.** O GitHub entrega
> `.html` como texto puro, então clicar no link mostra o código-fonte em vez de
> abrir o jogo. E na aba *Files changed* do Pull Request ele nem aparece: 3 MB
> passa do limite que o GitHub renderiza.

1. Abra **[`teste/JOGAR.html`](JOGAR.html)** pela aba **Code** do repositório
   (não pela aba *Files changed* do PR)
2. No canto direito, clique em **Download raw file** — o ícone **⤓**
3. Abra o arquivo baixado com **duplo clique**

Não precisa de git, servidor, npm nem internet — o jogo inteiro (código,
aparência e as 70 imagens) está dentro do arquivo. No celular funciona igual:
baixe e abra pelo navegador.

## O que olhar com atenção

O PR completo está em **[#1](https://github.com/vilkers/jagerlaramais/pull/1)**.
Os pontos que mais precisam do julgamento de vocês:

**1. Quem começa está forte demais?** O tabuleiro 11×11 melhorou isso —
**55,0%** de vitórias para quem abre, contra 57,1% em 9×9 — mas ainda é acima
dos 53,5% da v0.5.8. A simulação é cega a escolha — ela mede estrutura, não decisão —
então a impressão de vocês jogando vale mais que a medição. **É motivo legítimo
para reprovar.**

**2. O cerco por herói ficou bom ou virou atalho?** Agora o herói bate na torre
sem esperar a onda, e no Nexus depois que uma rota inteira cai. Antes ele
dependia do creep e ninguém cercava de verdade.

**3. A rota com 2 hexágonos de largura resolveu?** Suporte e atirador agora
cabem juntos numa rota. Cabe mesmo, ou ficou largo demais e ninguém se encontra?

**3b. A selva de 38 casas vale a pena?** Ela mais que dobrou (eram 16), mas
**continua vazia** — acampamentos de selva não existem. É mais chão para andar
e flanquear, não mais o que fazer. E o hexágono encolheu para ~32px no celular,
contra os 44px de referência de toque. **Reparem se erra o dedo.**

**4. Nenhum golpe mata de vida cheia — menos três.** A meta era essa, mas
Nyx/Bote, Cael/Armadilha e Kurr/Salto Mortal ainda chegam a 10 de dano contra
vida 10, por causa do bônus fixo de +2. Baixar para +1 fecharia. **Ficou de
propósito para vocês decidirem.**

**5. A v0.5.5–v0.5.8 veio junto e nunca foi revisada** — poço épico, Retomada,
a correção da loja (que nunca abria), mira por toque e arrastar-para-andar.
Também precisa do olhar de vocês.

## Se o arquivo estiver velho

Ele é **gerado**, não escrito à mão. O cabeçalho do arquivo traz o commit de
origem. Para regerar a partir da fonte:

```bash
node teste/empacota.js
```

Não edite o `.html` — mexa em `jogo/`, `data/` e `arte/`, e rode o script.
