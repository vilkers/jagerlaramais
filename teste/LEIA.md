# Como jogar a versão que está em avaliação

Vilker, Matheus — isto aqui é para **jogar**, não para ler código.

O GitHub não roda o jogo: um Pull Request mostra só o diff, e o site publicado
(`vilkers.github.io/jagerlaramais`) serve a **`main`**, que ainda não tem nada
desta leva. Por isso este arquivo existe.

## Baixar e abrir (3 passos)

1. Clique em **`JOGAR-v0.6.1.html`** aqui nesta pasta
2. No canto direito, clique em **Download raw file** (ícone de seta para baixo)
3. Abra o arquivo baixado com **duplo clique**

Só isso. Não precisa de git, servidor, npm nem internet — o jogo inteiro
(código, aparência e as 70 imagens) está dentro do arquivo. Funciona no celular
também: baixe e abra pelo navegador.

## O que olhar com atenção

O PR completo está em **[#1](https://github.com/vilkers/jagerlaramais/pull/1)**.
Os pontos que mais precisam do julgamento de vocês:

**1. Quem começa está forte demais?** É o número mais preocupante da leva:
**57,1%** de vitórias para quem abre, contra 53,5% da versão anterior
(n=20000). A simulação é cega a escolha — ela mede estrutura, não decisão —
então a impressão de vocês jogando vale mais que a medição. **É motivo legítimo
para reprovar.**

**2. O cerco por herói ficou bom ou virou atalho?** Agora o herói bate na torre
sem esperar a onda, e no Nexus depois que uma rota inteira cai. Antes ele
dependia do creep e ninguém cercava de verdade.

**3. A rota com 2 hexágonos de largura resolveu?** Suporte e atirador agora
cabem juntos numa rota. Cabe mesmo, ou ficou largo demais e ninguém se encontra?

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
node teste/empacota.js JOGAR-v0.6.1.html
```

Não edite o `.html` — mexa em `jogo/`, `data/` e `arte/`, e rode o script.
