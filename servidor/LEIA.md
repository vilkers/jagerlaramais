# O servidor de salas

PvP em rede, com sala e senha. **O hotseat não depende disto** — continua abrindo
com duplo clique, offline, como sempre.

## Subir

```
node servidor/sala.js            # porta 8787
PORT=3000 node servidor/sala.js  # outra porta
```

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

## O que ainda NÃO existe

- **o cliente.** Este servidor está pronto e testado, mas o jogo ainda não tem a
  tela de sala nem o modo `rede`. Ver `docs/DECISOES-PENDENTES.md`, item 13;
- reconexão e abandono — cair no meio da partida hoje é perder a partida;
- sala mora em memória: reiniciar o processo derruba as partidas em curso.
