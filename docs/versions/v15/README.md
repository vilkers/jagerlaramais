# JAGERLARAMAIS v15

**Data da integração:** 2026-08-11

**Origem:** Vinicius (`vinibunitao`)

**Pacote recebido:** `JAGERLARAMAIS-GITHUB-v15.zip`

**Status:** integrado nas fontes, aguardando revisão e playtest

## O que aconteceu

O pacote v15 foi publicado primeiro como um único `jogo/index.html` autocontido no commit `0441a906d946d8185bfdb2369f7a30f03e29b1e8`. O arquivo publicado corresponde exatamente ao arquivo recebido:

```text
SHA-256 f6e02dbf2a506b8303a87a250467bcabe2ab55efda25f6d2d3e0cae85278edcf
```

Esse formato permitia jogar imediatamente, mas deixava `jogo/jogo.js`, `jogo/estilo.css` e a documentação desatualizados. Esta integração separa novamente a v15 nas fontes corretas, sem alterar o comportamento do pacote recebido.

## Decisão de integração

- O comportamento da v15 foi preservado integralmente.
- `data/catalogo.js` permaneceu intacto; o catálogo embutido era idêntico à fonte atual.
- `jogo/index.html` voltou a ser apenas estrutura e referências.
- CSS e JavaScript da v15 foram devolvidos a `jogo/estilo.css` e `jogo/jogo.js`.
- O arquivo autocontido original continua preservado no histórico do Git.
- Mudanças não descritas no resumo do pacote foram registradas em `CHANGELOG.md`; isso não equivale a aprovação de balanceamento.

## Pontos que exigem decisão do trio

1. Dragão passou de 3 para 8 de vida e Barão de 5 para 14 sem justificativa no guia recebido.
2. Escudos deixaram de zerar automaticamente no fim da rodada.
3. Entraram três acampamentos de ouro, mas o guia web ainda descrevia quatro acampamentos com buffs diferentes.
4. Plano de Caça, pressão de rota, doação de dado e IA vieram como mudanças cumulativas, sem histórico de versões intermediárias.
5. A v15 ainda não recebeu playtest humano nem medição de balanceamento em amostra adequada.

Ver `CHANGELOG.md` para o inventário completo e `FILES.md` para o escopo de arquivos.
