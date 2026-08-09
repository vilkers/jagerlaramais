# Heróis aposentados na v0.4

Os 25 heróis que saíram quando o pool foi de 45 para 20. Nada aqui está errado — saíram por
**arquétipo repetido** ou por **não ter arte**, não por serem ruins.

Para trazer um de volta: cole a definição em `HEROIS_NOVOS`, dentro de `data/catalogo.js`, e gere o
retrato (`arte/herois/web/<id>.jpg` + a entrada em `arte/imagens.js`). Ele aparece no draft sozinho.

> Antes de reativar, olhe quem ele empurra para fora. O pool tem **4 por rota** de propósito —
> ver `docs/patch-notes.md`, v0.4.

---

## TOPO

```js
draska:{n:"Draska",ep:"a Lâmina de Gelo",pos:"topo",cls:"Lutador",ref:"Camille / Fiora",
  vida:11,poder:3,arm:2,alc:1,agil:1,
  habs:[{n:"Estocada Gélida",f:1,alvo:"in",ef:{dano:1}},
        {n:"Passo de Vidro",f:3,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Sentença Branca",f:5,alvo:"in",ef:{dano:1,executa:5}}]},

orbek:{n:"Orbek",ep:"o Rochedo",pos:"topo",cls:"Tanque",ref:"Malphite / Ornn",
  vida:15,poder:1,arm:4,alc:1,
  habs:[{n:"Punho de Pedra",f:1,alvo:"in",ef:{dano:1}},
        {n:"Falha Sísmica",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Erupção",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},

sarn:{n:"Sarn",ep:"o Renegado",pos:"topo",cls:"Lutador",ref:"Garen / Sett",
  vida:13,poder:3,arm:3,alc:1,
  habs:[{n:"Golpe Largo",f:1,alvo:"in",ef:{dano:1,bonusFerido:3}},
        {n:"Fôlego",f:2,alvo:"eu",ef:{cura:5}},
        {n:"Decapitar",f:5,alvo:"in",ef:{dano:1,executa:6}}]},

brann:{n:"Brann",ep:"o Vigia",pos:"topo",cls:"Tanque",ref:"Shen",
  vida:14,poder:2,arm:4,alc:1,
  habs:[{n:"Corte Firme",f:1,alvo:"in",ef:{dano:1}},
        {n:"Guarda",f:2,alvo:"al",ef:{escudo:4}},
        {n:"Presença",f:5,alvo:"eu",ef:{escudo:6,prendeVizinhos:1}}]},

umbro:{n:"Umbro",ep:"o Lenho",pos:"topo",cls:"Tanque",ref:"Trundle / Volibear",
  vida:16,poder:3,arm:2,alc:1,
  habs:[{n:"Porrete",f:1,alvo:"in",ef:{dano:1}},
        {n:"Raízes",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Tronco Velho",f:5,alvo:"eu",ef:{cura:7,escudo:4}}]},
```

## SELVA

```js
thane:{n:"Thane",ep:"o Colosso",pos:"selva",cls:"Tanque",ref:"Zac / Amumu",
  vida:15,poder:2,arm:3,alc:1,
  habs:[{n:"Massa Viscosa",f:1,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Absorver",f:2,alvo:"eu",ef:{cura:4,ouro:2}},
        {n:"Impacto",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},

vixa:{n:"Vixa",ep:"a Caçadora de Ecos",pos:"selva",cls:"Assassino",ref:"Evelynn",
  vida:9,poder:5,arm:1,alc:1,agil:1,
  habs:[{n:"Corte Duplo",f:1,alvo:"in",ef:{dano:1,extra:1}},
        {n:"Desaparecer",f:3,alvo:"eu",ef:{intocavel:1}},
        {n:"Execução Silente",f:5,alvo:"in",ef:{dano:1,executa:6}}]},

morgo:{n:"Morgo",ep:"o Faminto",pos:"selva",cls:"Lutador",ref:"Warwick / Udyr",
  vida:12,poder:3,arm:2,alc:1,
  habs:[{n:"Dentada",f:1,alvo:"in",ef:{dano:1}},
        {n:"Perseguir",f:2,alvo:"in",ef:{dano:1,puxar:1}},
        {n:"Frenesi",f:5,alvo:"in",ef:{dano:1,danoVizinhos:1}}]},

skarn:{n:"Skarn",ep:"o Ferrão",pos:"selva",cls:"Assassino",ref:"Rengar / Kha'Zix",
  vida:10,poder:5,arm:1,alc:1,agil:1,
  habs:[{n:"Ferroada",f:1,alvo:"in",ef:{dano:1}},
        {n:"Espreitar",f:3,alvo:"eu",ef:{intocavel:1}},
        {n:"Bote Fatal",f:5,alvo:"in",ef:{dano:1,extra:5}}]},

ygra:{n:"Ygra",ep:"a Matriarca",pos:"selva",cls:"Tanque",ref:"Sejuani",
  vida:15,poder:2,arm:4,alc:1,
  habs:[{n:"Chifrada",f:1,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Convocar Matilha",f:2,alvo:"eu",ef:{cura:3,ouro:3}},
        {n:"Inverno",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},
```

## MEIO

```js
vysh:{n:"Vysh",ep:"o Verbo",pos:"meio",cls:"Mago",ref:"Xerath / Vel'Koz",
  vida:9,poder:4,arm:1,alc:4,
  habs:[{n:"Sílaba",f:1,alvo:"in",ef:{dano:1}},
        {n:"Eco Longo",f:2,alvo:"eu",ef:{recarga:4}},
        {n:"Verbo Final",f:6,alvo:"in",ef:{danoFixo:12,semAlcance:1}}]},

sombro:{n:"Sombro",ep:"o Duplo",pos:"meio",cls:"Assassino",ref:"Fizz / Ekko",
  vida:9,poder:4,arm:1,alc:1,agil:1,
  habs:[{n:"Lâmina Curta",f:1,alvo:"in",ef:{dano:1}},
        {n:"Imagem",f:2,alvo:"eu",ef:{escudo:3}},
        {n:"Convergir",f:5,alvo:"in",ef:{dano:1,area:1}}]},

lumen:{n:"Lumen",ep:"a Prisma",pos:"meio",cls:"Mago",ref:"Lux",
  vida:9,poder:4,arm:1,alc:3,
  habs:[{n:"Raio",f:1,alvo:"in",ef:{dano:1}},
        {n:"Amarra de Luz",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Prisma Final",f:6,alvo:"in",ef:{danoFixo:12,area:1}}]},

vok:{n:"Vok",ep:"o Devorador de Almas",pos:"meio",cls:"Mago",ref:"Vladimir",
  vida:12,poder:3,arm:2,alc:2,
  habs:[{n:"Transfusão",f:1,alvo:"in",ef:{dano:1,cura:3}},
        {n:"Poça",f:2,alvo:"eu",ef:{intocavel:1}},
        {n:"Hemorragia",f:5,alvo:"in",ef:{dano:1,area:1,cura:4}}]},

astra:{n:"Astra",ep:"a Cronista",pos:"meio",cls:"Suporte",ref:"Zilean / Bard",
  vida:10,poder:3,arm:1,alc:3,
  habs:[{n:"Instante",f:1,alvo:"in",ef:{dano:1}},
        {n:"Adiar",f:2,alvo:"al",ef:{escudo:4}},
        {n:"Reverter",f:4,alvo:"al",ef:{revive:1,escudo:3}}]},
```

## ATIRADOR

```js
lyra:{n:"Lyra",ep:"a Precisa",pos:"adc",cls:"Atirador",ref:"Ashe / Varus",
  vida:9,poder:3,arm:1,alc:3,patamar:1,
  habs:[{n:"Flecha",f:1,alvo:"in",ef:{dano:1}},
        {n:"Flecha de Gelo",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Chuva Longa",f:5,alvo:"eu",ef:{danoRaio:3}}]},

bruk:{n:"Bruk",ep:"o Canhão",pos:"adc",cls:"Atirador",ref:"Jinx / Tristana",
  vida:8,poder:2,arm:1,alc:3,patamar:1,
  habs:[{n:"Tiro Curto",f:1,alvo:"in",ef:{dano:1}},
        {n:"Sobrecarga",f:2,alvo:"eu",ef:{recarga:5}},
        {n:"Bombardeio",f:5,alvo:"in",ef:{dano:1,area:1}}]},

rhia:{n:"Rhia",ep:"a Tempestade",pos:"adc",cls:"Atirador",ref:"Miss Fortune",
  vida:9,poder:3,arm:1,alc:3,patamar:1,
  habs:[{n:"Tiro Duplo",f:1,alvo:"in",ef:{dano:1,extra:1}},
        {n:"Ricochete",f:3,alvo:"in",ef:{dano:1,area:1}},
        {n:"Barragem",f:5,alvo:"eu",ef:{danoRaio:3}}]},

duno:{n:"Duno",ep:"o Artilheiro",pos:"adc",cls:"Atirador",ref:"Corki / Ziggs",
  vida:8,poder:3,arm:1,alc:4,patamar:1,
  habs:[{n:"Morteiro",f:1,alvo:"in",ef:{dano:1}},
        {n:"Espoleta",f:2,alvo:"eu",ef:{recarga:4}},
        {n:"Bomba Grande",f:5,alvo:"in",ef:{dano:1,area:1,semAlcance:1}}]},

wren:{n:"Wren",ep:"a Silenciosa",pos:"adc",cls:"Atirador",ref:"Ashe",
  vida:9,poder:3,arm:1,alc:4,patamar:1,
  habs:[{n:"Flecha Longa",f:1,alvo:"in",ef:{dano:1}},
        {n:"Marca de Caça",f:2,alvo:"in",ef:{marca:5}},
        {n:"Flecha Cristalina",f:5,alvo:"in",ef:{dano:1,prende:1,semAlcance:1}}]},
```

## SUPORTE

```js
elna:{n:"Elna",ep:"a Lamparina",pos:"sup",cls:"Suporte",ref:"Soraka / Sona",
  vida:11,poder:1,arm:2,alc:3,
  habs:[{n:"Luz Quente",f:1,alvo:"al",ef:{escudo:3}},
        {n:"Doar Chama",f:1,alvo:"al",ef:{doar:1}},
        {n:"Alvorada",f:4,alvo:"al",ef:{revive:1}}]},

iseu:{n:"Iseu",ep:"o Sussurro",pos:"sup",cls:"Suporte",ref:"Bard / Pyke",
  vida:10,poder:2,arm:2,alc:2,
  habs:[{n:"Sussurro",f:1,alvo:"in",ef:{dano:1}},
        {n:"Olho Aberto",f:1,alvo:"eu",ef:{ward:1}},
        {n:"Segunda Chance",f:4,alvo:"al",ef:{revive:1}}]},

vera:{n:"Vera",ep:"a Âncora",pos:"sup",cls:"Suporte",ref:"Rakan / Leona",
  vida:12,poder:3,arm:3,alc:1,
  habs:[{n:"Golpe de Corrente",f:1,alvo:"in",ef:{dano:1}},
        {n:"Fisgar",f:3,alvo:"in",ef:{dano:1,puxar:3,alcExtra:2}},
        {n:"Ancorar",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},

ondi:{n:"Ondi",ep:"o Maré",pos:"sup",cls:"Suporte",ref:"Nami",
  vida:10,poder:2,arm:2,alc:3,
  habs:[{n:"Onda",f:1,alvo:"al",ef:{escudo:3}},
        {n:"Correnteza",f:2,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Maré Alta",f:4,alvo:"al",ef:{escudo:6,revive:1}}]},

grald:{n:"Grald",ep:"o Escudo",pos:"sup",cls:"Suporte",ref:"Taric",
  vida:13,poder:2,arm:4,alc:1,
  habs:[{n:"Martelo",f:1,alvo:"in",ef:{dano:1}},
        {n:"Bênção",f:1,alvo:"al",ef:{escudo:5}},
        {n:"Cerco de Cristal",f:5,alvo:"eu",ef:{escudo:6,prendeVizinhos:1}}]},
```
