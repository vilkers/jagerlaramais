# Draft e Deck de Comando

Duas camadas novas. A primeira faz cada partida começar diferente; a segunda faz cada rodada ter uma surpresa.

---

## 1 · O Draft — escolher o time antes de jogar

**Pool de 20 heróis**, quatro por rota (era 30 quando este documento foi escrito — ver `patch-notes.md` v0.4). Cada jogador monta um time de cinco — um por rota.

### Como funciona

```
BANIMENTO   A bane 1  →  B bane 1        (2 heróis fora da partida)
            uma rota só pode perder UM herói — senão o counterpick dela morre

ESCOLHA     rota por rota, alternando quem escolhe primeiro:
            TOPO      A escolhe → B escolhe
            SELVA     B escolhe → A escolhe
            MEIO      A escolhe → B escolhe
            ATIRADOR  B escolhe → A escolhe
            SUPORTE   A escolhe → B escolhe
```

**Quem escolhe depois vê a escolha do adversário.** É o counterpick — a decisão mais interessante do draft. E como a ordem alterna a cada rota, ninguém leva vantagem em tudo.

### Por que isso importa

Sem draft, 50 partidas são a mesma partida. Com draft, o mesmo conjunto de cartas gera composições diferentes toda vez, e o jogo ganha uma camada de conversa antes de qualquer dado ser rolado.

É também o item de **melhor custo-benefício do projeto**: zero componente novo, dez minutos de tensão pura.

---

## 2 · O Deck de Comando — a mão do técnico

Um baralho de **46 cartas em 22 tipos**, compartilhado. É o que os dados não fazem: quebrar a regra num momento pontual.

### Como funciona

- **Compre 1 carta** no início do seu turno.
- **Mão máxima de 3.** Comprou a quarta? Descarte uma.
- Cartas se jogam **de graça**, a qualquer momento do seu turno — exceto as de **Reação**, que se jogam no turno do adversário.
- Carta usada vai para o **cemitério** (pilha de descarte, comum aos dois).

### Por que isso fecha um buraco do design

O briefing original dizia que o Suporte *"pode trazer cartas de volta do cemitério"* — e até agora não havia cemitério nenhum, porque não havia cartas para recuperar. **Agora há.** O Suporte recupera Cartas de Comando, e a habilidade dele passa a ter função real.

### As cinco famílias

| Família | Cartas | O que faz |
|---|---|---|
| **Dado** | 8 | Conserta a rolagem ruim |
| **Tempo** | 5 | Compra uma jogada a mais |
| **Reação** | 6 | Jogada no turno do adversário |
| **Mapa** | 6 | Move peça, onda ou visão |
| **Economia** | 5 | Ouro e desconto |

### As 15 cartas (30 no baralho, com cópias)

**DADO — 8 cartas**
| Carta | Cópias | Efeito |
|---|---|---|
| Segunda Chance | 3 | Re-role um dado de ação |
| Mão Firme | 3 | Ajuste um dado de ação em ±1 |
| Improviso | 2 | Descarte um dado de ação: ganhe o dobro do valor em movimento |

**TEMPO — 5 cartas**
| Carta | Cópias | Efeito |
|---|---|---|
| Respiro | 2 | +2 de movimento nesta rodada |
| Adiantar | 2 | Role um dado de ação a mais |
| Dobradinha | 1 | Um herói que já agiu pode receber outro dado |

**REAÇÃO — 6 cartas** · *jogadas no turno do adversário*
| Carta | Cópias | Efeito |
|---|---|---|
| Recuo | 2 | Mova um herói seu 1 casa |
| Anteparo | 2 | Anule 3 de dano de um golpe |
| Contra-emboscada | 2 | Revele a carta do Caçador inimigo agora |

**MAPA — 6 cartas**
| Carta | Cópias | Efeito |
|---|---|---|
| Sinalizador | 2 | Ward: revela o Caçador inimigo na próxima revelação |
| Convocar | 2 | Teletransporte um herói seu para a sua base |
| Pressão | 2 | Avance a Frente de Onda 1 casa numa rota |

**ECONOMIA — 5 cartas**
| Carta | Cópias | Efeito |
|---|---|---|
| Pilhagem | 2 | +4 de ouro para um herói |
| Barganha | 2 | O próximo item custa 3 a menos |
| Herança | 1 | Recupere uma carta do cemitério |

---

## O que isso muda no equilíbrio 🔸

**A favor:** as cartas de Dado são a válvula contra má sorte que hoje só existe via Placas do Topo. Quem está perdendo o Topo passa a ter outra saída.

**Risco:** compra de carta é **vantagem acumulada** — mais uma coisa que ajuda quem já está na frente. Precisa ser medido no playtest. Se virar bola de neve, a correção é dar **carta extra para quem está atrás** (número de torres perdidas, por exemplo) — o que de quebra resolve o problema de comeback já sinalizado em `03-jogabilidade.md`.

**Ordem de implementação sugerida:** draft primeiro (mais simples, impacto imediato), deck depois.
