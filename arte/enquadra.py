#!/usr/bin/env python3
"""Enquadra arte de herói no formato que o jogo usa.

O JOGO PEDE 293x440 (retrato 2:3) e recorta com `object-position: 50% 18%` —
na peça do tabuleiro, na ficha e no painel de comando ele mostra só uma janela
do TERÇO DE CIMA. Arte com o rosto no meio vira arte com o queixo cortado.

Este script resolve as duas coisas de uma vez:

  1. ACHA O PERSONAGEM. A arte nova vem sobre fundo cinza chapado (token redondo
     ou busto recortado). Ele lê a cor dos cantos, mede a caixa do que NÃO é
     fundo, e joga o resto fora;
  2. ENQUADRA PARA O RECORTE. Em vez de centralizar, ele posiciona o personagem
     de modo que a CABEÇA caia na janela que as telas mostram.

Uso:
    python3 arte/enquadra.py arte/entrada/kaross.png kaross
    python3 arte/enquadra.py arte/entrada/*.png --lote     # nome = nome do arquivo

Sempre confira o resultado: `arte/enquadra.py --contato` monta uma folha de
contato com o recorte que as telas realmente fazem.
"""
import sys, os, glob
from PIL import Image

LARG, ALT = 293, 440           # o que o jogo usa hoje
JANELA_Y = 0.18                # object-position vertical das telas
DESTINO = "arte/herois/web"

def cor_de_fundo(im):
    """a cor dos quatro cantos, se elas concordarem"""
    w, h = im.size
    cantos = [im.getpixel(p) for p in ((2,2),(w-3,2),(2,h-3),(w-3,h-3))]
    m = tuple(sum(c[i] for c in cantos)//4 for i in range(3))
    # os cantos precisam concordar, senão não é fundo chapado
    espalha = max(max(abs(c[i]-m[i]) for i in range(3)) for c in cantos)
    return m if espalha < 22 else None

def caixa_do_personagem(im, tol=26):
    """bounding box do que difere do fundo"""
    im = im.convert("RGB")
    fundo = cor_de_fundo(im)
    if fundo is None:
        return (0, 0, *im.size)
    w, h = im.size
    px = im.load()
    x0, y0, x1, y1 = w, h, 0, 0
    passo = max(1, min(w, h)//400)          # amostra: 400 linhas bastam
    for y in range(0, h, passo):
        for x in range(0, w, passo):
            p = px[x, y]
            if max(abs(p[i]-fundo[i]) for i in range(3)) > tol:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    if x1 <= x0 or y1 <= y0:
        return (0, 0, w, h)
    return (x0, y0, x1+1, y1+1)

def enquadra(caminho, saida, folga=0.06):
    im = Image.open(caminho).convert("RGB")
    x0, y0, x1, y1 = caixa_do_personagem(im)
    lp, ap = x1-x0, y1-y0

    """A ALTURA MANDA, e a conta é de propósito assim: o personagem tem de caber
       em pé, e o espaço que sobra vai para BAIXO — porque a janela que as telas
       recortam é a de cima. Centralizar aqui seria empurrar a cabeça para fora
       dela."""
    alvo_a = int(ap * (1 + folga*2))
    alvo_l = int(alvo_a * LARG / ALT)
    if alvo_l < lp * (1 + folga*2):                  # personagem largo demais
        alvo_l = int(lp * (1 + folga*2))
        alvo_a = int(alvo_l * ALT / LARG)

    cx = (x0 + x1) // 2
    nx0 = cx - alvo_l//2
    ny0 = int(y0 - alvo_a * JANELA_Y * 0.55)         # deixa um respiro acima da cabeça

    quadro = Image.new("RGB", (alvo_l, alvo_a), cor_de_fundo(im) or (237,235,226))
    quadro.paste(im.crop((max(0,nx0), max(0,ny0),
                          min(im.width, nx0+alvo_l), min(im.height, ny0+alvo_a))),
                 (max(0,-nx0), max(0,-ny0)))
    quadro.resize((LARG, ALT), Image.LANCZOS).save(saida, "JPEG", quality=88, optimize=True)
    return (x1-x0, y1-y0)

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lote = "--lote" in sys.argv
    if not args:
        print(__doc__); sys.exit(1)
    if lote:
        for c in args:
            nome = os.path.splitext(os.path.basename(c))[0]
            d = os.path.join(DESTINO, nome + ".jpg")
            print(f"  {c}  ->  {d}   (personagem {enquadra(c, d)})")
    else:
        origem, ident = args[0], args[1]
        d = os.path.join(DESTINO, ident + ".jpg")
        print(f"  {origem}  ->  {d}   (personagem {enquadra(origem, d)})")
