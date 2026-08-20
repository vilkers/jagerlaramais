# Arte nova entra por aqui

Ponha os arquivos de arte nesta pasta e faça commit. É o único jeito de eles
chegarem até mim: imagem colada na conversa eu **vejo**, mas não consigo gravar
em disco — anexo de conversa não vira arquivo. Pelo git, vem.

```
git add arte/entrada/ && git commit -m "arte nova" && git push
```

## Um arquivo por personagem, com o id no nome

O nome do arquivo é o **id do catálogo**, não o nome do herói:

| id | herói | | id | herói |
|---|---|---|---|---|
| `vharn` | O Taxista | | `nira` | Gari Mago |
| `kaross` | Dona Chinela | | `arden` | Arden |
| `ilva` | Ilva | | `vesper` | Zé Griteco |
| `xhera` | Xhera | | `cael` | Cael |
| `nyx` | Pombo Ciborgue | | `nessa` | Catarino |
| `grumo` | Grumo | | `corvo` | Corvo |
| `kurr` | Valti | | `mirrha` | Emerson Emo |
| `pyk` | Pyk | | `torvald` | Torvald |
| `solenne` | Parabólica Diabólica | | `gorm` | Caramêlo 2.0 |
| `zhet` | Zhet | | `vidra` | Vidra |

Folha com vários personagens juntos também serve — eu corto. Mas um arquivo por
personagem sai melhor, porque cortar de folha perde resolução.

## O formato, e por que ele importa

O jogo usa **293×440** (retrato 2:3). Mais importante que o tamanho: as telas
recortam com `object-position: 50% 18%` — a peça no tabuleiro, a ficha e o painel
de comando mostram só uma **janela do terço de cima**.

**Arte com o rosto no meio vira arte com o queixo cortado.** Não precisa se
preocupar com isso ao gerar: `arte/enquadra.py` acha o personagem no fundo
chapado e posiciona a cabeça na janela certa.

```
python3 arte/enquadra.py arte/entrada/kaross.png kaross
python3 arte/enquadra.py arte/entrada/*.png --lote
```

Depois de trocar, **reempacote**: `node teste/empacota.js`.
