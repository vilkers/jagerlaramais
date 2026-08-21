# O servidor de salas

PvP em rede: **um cria a sala, manda o convite, o outro entra**. Sem endereço
para digitar e sem senha para ditar. **O hotseat não depende disto** — continua
abrindo com duplo clique, offline, como sempre.

## Publicar uma vez, e nunca mais digitar endereço  ← comece por aqui

Este é o passo que faz o pedido *"não preciso botar o IP, apenas criar a sala e
passar o código"* virar verdade. Enquanto o servidor mora na máquina de alguém,
o jogo **tem** de perguntar onde ele está; publicado num lugar fixo com https, o
endereço vira uma constante e some da tela.

1. **Suba o servidor.** `render.yaml` na raiz já descreve o serviço: em
   render.com → *New* → *Blueprint* → aponte para este repositório. Railway, Fly
   e Deno Deploy servem igual — o comando é sempre `node servidor/sala.js`, sem
   build, sem dependência.
2. **Copie a URL** que o serviço devolver (`https://algo.onrender.com`).
3. **Cole em `SALA_PADRAO`**, no topo do bloco *A SALA* de `jogo/jogo.js`.
4. **Publique o site.**

Feito isso, o fluxo é: **Criar sala → Copiar convite → mandar na conversa**. Quem
tocar no link cai dentro da partida; quem preferir digita o código de 6.

> Plano gratuito costuma **dormir** depois de alguns minutos parado, e a primeira
> chamada leva ~30s para acordar. A tela de sala já avisa isso em vez de dizer
> "não deu".

## Rodar na sua máquina — para desenvolver, ou para jogar na mesma rede

```
node servidor/sala.js            # porta 8787
PORT=3000 node servidor/sala.js  # outra porta
```

Ele imprime o endereço da sua rede. **Abra ESSE endereço nos dois celulares** —
o servidor serve o jogo também, e o campo de endereço já vem preenchido.

### Por que abrir pelo servidor, e não pelo site

Abrir pelo `vilkers.github.io` e apontar para o seu servidor **não funciona**, e
não é defeito de nenhum dos dois: o site vem por **HTTPS** e o seu servidor é
**HTTP** num IP de rede. O navegador bloqueia essa mistura (*mixed content*)
antes de a chamada sair — a requisição nunca chega no servidor, então nada que se
mexa nele resolve.

Servido daqui, página e sala têm a **mesma origem**: sem mixed content, sem CORS,
sem endereço para digitar. Se você tentar o caminho do site mesmo assim, a tela
de sala explica isso em vez de dizer "o servidor está de pé?".

Zero dependência: só `http` e `crypto` do Node. Roda em qualquer lugar que rode
Node — Deno Deploy, Fly, Render, Railway, ou uma máquina na sua rede local.

Conferir se está de pé: `curl localhost:8787/saude` → `{"ok":1,"salas":0}`

## Por que ele é AUTORITATIVO, e não um repassador de mensagens

Porque a névoa é o jogo. Se o servidor só repassasse o estado inteiro para os
dois lados, qualquer um abriria o console do navegador e leria a posição do
Caçador escondido — e rotação secreta, emboscada e blefe de gank acabariam.

Aqui o estado de verdade mora no servidor. Cada lado recebe `estadoPara(lado)`,
que esconde:

| O quê | Por quê |
|---|---|
| posição de herói inimigo fora da sua visão | o óbvio, e o menor deles |
| condições, itens, recursos e escudo desse herói | saber que "alguém está sangrando" já entrega que ele existe |
| a rotação do Caçador adversário | ela é secreta **por regra** desde a v46 |
| as wards do adversário | olho plantado é informação comprada com ouro |
| entradas do log que **nomeiam** esse herói | o vazamento menos óbvio: 75 mensagens do motor citam o herói pelo nome |

## Um motor só

O servidor **não reimplementa regra nenhuma**. Ele carrega `jogo/jogo.js` pelo
mesmo `sim/motor.js` que a suíte de testes usa. Regra que muda no jogo muda aqui
junto, por construção — é o que impede hotseat e online de divergirem.

O cliente manda **intenção** ("mover o herói X para a casa Y"), nunca estado. A
lista de ações aceitas é fechada; qualquer coisa fora dela é recusada.

## Protocolo

| Rota | O que faz |
|---|---|
| `POST /criar` `{senha?}` | cria a sala · devolve `{sala, lado:0, segredo}`. **A senha é opcional** — sem ela a sala abre só com o código |
| `POST /entrar` `{sala, senha?}` | entra · devolve `{sala, lado:1, segredo}` |
| `GET /eventos?sala&lado&segredo` | SSE: empurra o estado **filtrado** a cada jogada |
| `POST /jogada` `{sala, segredo, acao, dados}` | executa uma ação |
| `GET /saude` | está de pé? |

Ações: `mover` `habilidade` `estrutura` `converterDado` `rerolar` `ajustar`
`prioridade` `gasto` `item` `vender` `ward` `carta` `encerrar` `rotacao`.

Transporte é **SSE + POST**, não WebSocket: um jogo de turnos manda ~11 KB por
jogada, a `EventSource` do navegador resolve isso sem handshake, e WebSocket sem
biblioteca custaria ~150 linhas de parsing de frame para ganhar latência que
jogo de tabuleiro não usa.

## Segurança — o que já está travado, com teste

- **o código é o segredo** (31 caracteres possíveis, 6 posições ≈ 887 milhões de
  combinações, sala que vive 2h e aceita **um** segundo jogador);
- **freio de tentativa por IP**: 30 erros em 10 minutos e aquele IP para de
  poder entrar até a janela virar. É o que substituiu a senha obrigatória —
  varrer códigos deixou de ser um laço de `for`;
- senha continua existindo para quem quiser: quando enviada, ela é **nunca
  guardada em claro** (sal por sala + sha256) e comparada em tempo constante,
  para o tempo de resposta não virar oráculo;
- código de sala sem `0 O 1 I L` — ele vai ser ditado em voz alta;
- terceiro jogador não entra;
- **não dá para jogar fora do seu turno**;
- **não dá para mexer no herói do adversário**;
- **não dá para mirar em quem você não enxerga** — a névoa vale para a jogada,
  não só para o desenho;
- o segredo de um lado não abre o canal do outro.

Tudo isso é `node sim/rede.js` — 19 testes contra o servidor de verdade.

## Jogar (v56)

1. os dois abrem o jogo e tocam em **Jogar com um amigo · sala**;
2. um toca em **Criar sala** e depois em **Copiar convite**;
3. manda o link na conversa. O outro toca no link e já está dentro.

Quem preferir ditar: o código de 6 aparece grande na tela, e o outro digita em
*"Ou entre com o código"*. Não há endereço nem senha em lugar nenhum do caminho.

**Como o jogo acha o servidor**, em ordem — o primeiro que responder `/saude`
vence:

| Ordem | De onde | Para quê |
|---|---|---|
| 1 | `?srv=` na URL | apontar para outro servidor sem mexer no código |
| 2 | a própria origem | quando o jogo é servido pelo `sala.js`: mesma origem, sem CORS |
| 3 | `SALA_PADRAO` | o servidor publicado — o caminho de todo mundo |
| 4 | o que ficou salvo | quem já digitou um endereço continua com ele |

Se os quatro falharem, e **só** nesse caso, a tela volta a pedir um endereço — e
explica que está pedindo porque não há servidor publicado.

A partida começa sozinha quando o segundo entra. O canto de baixo diz de quem é
a vez, e fora do seu turno o tabuleiro não aceita gesto.

### Conferido com dois navegadores de verdade

Duas abas, uma sala, contra este servidor: cada lado recebeu **os próprios 5
heróis e ZERO posições inimigas**, desenhou só as próprias peças, e o aviso de
vez virou no outro lado no instante do "encerrar". Quando uma peça de um entrou
no campo de visão do outro, ela **apareceu** — de 0 para 1 inimigo visível, 5
para 6 peças desenhadas. A névoa é dinâmica e é o servidor que a aplica.

## O que ainda NÃO existe

- **reconexão e abandono** — cair no meio da partida hoje é perder a partida;
- **draft em rede**: a sala começa com times sorteados. Draft a dois exige uma
  fase de escolha alternada por cima do mesmo canal;
- sala mora em memória: reiniciar o processo derruba as partidas em curso;
- **hospedagem**: `render.yaml` descreve o serviço, mas alguém precisa apertar o
  botão uma vez e colar a URL em `SALA_PADRAO`. Enquanto isso não acontece, o
  modo online só funciona na mesma rede.
