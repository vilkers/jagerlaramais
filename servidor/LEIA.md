# O servidor de salas

PvP em rede, com sala e senha. **O hotseat não depende disto** — continua abrindo
com duplo clique, offline, como sempre.

## Subir e jogar — o caminho curto

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
| `POST /criar` `{senha}` | cria a sala · devolve `{sala, lado:0, segredo}` |
| `POST /entrar` `{sala, senha}` | entra · devolve `{sala, lado:1, segredo}` |
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

- senha **nunca guardada em claro** (sal por sala + sha256) e comparada em tempo
  constante, para o tempo de resposta não virar oráculo;
- código de sala sem `0 O 1 I L` — ele vai ser ditado em voz alta;
- terceiro jogador não entra;
- **não dá para jogar fora do seu turno**;
- **não dá para mexer no herói do adversário**;
- **não dá para mirar em quem você não enxerga** — a névoa vale para a jogada,
  não só para o desenho;
- o segredo de um lado não abre o canal do outro.

Tudo isso é `node sim/rede.js` — 19 testes contra o servidor de verdade.

## Jogar (v53)

1. suba o servidor numa máquina que os dois alcancem — a sua, na mesma rede,
   já serve: `node servidor/sala.js`;
2. os dois abrem o jogo e tocam em **Jogar com um amigo · sala**;
3. no campo *endereço*, o IP da máquina do servidor (`http://192.168.0.10:8787`).
   Ele fica guardado no aparelho, então só se digita uma vez;
4. um escolhe a senha e toca **Criar sala** — aparece um código de 6;
5. o outro digita código e senha e toca **Entrar**.

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
- **hospedagem**: roda em qualquer Node, mas alguém precisa subir em algum lugar
  para jogar fora da mesma rede.
