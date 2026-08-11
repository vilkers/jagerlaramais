# Changelog — v15

## Mudanças declaradas no pacote

- Retomada passa a entregar efetivamente 1 ou 2 dados de ação extras ao time atrás.
- Habilidade básica causa 1 de dano no Poço; Ultimate ofensiva causa 2.
- Feitiço compartilhado por time:
  - Lampejo salta até 2 casas e remove `preso`;
  - Retorno volta à base, cura até 3 e é interrompido por inimigo adjacente;
  - recarga de 3 rodadas.
- Ritmo da IA alterado para 1200 ms, com botão para pular as pausas.
- Narração da IA movida para o canto inferior direito.
- Sondagem interna da IA deixa de piscar fichas e disparar avisos falsos.
- Animação de golpe adicionada para herói, torre, Nexus e Poço.
- `tremer` passa a rodar depois do redesenho do SVG e volta a aparecer.

## Mudanças cumulativas encontradas na v15

Estas mudanças estavam no arquivo recebido, mas não apareciam no resumo de v14 para v15:

- Modo de partida contra IA, inclusive draft automático.
- Três acampamentos no mapa: Azul, Carmim e neutro, com ouro e respawn de 3 rodadas.
- Plano de Caça substitui o teleporte automático do Caçador:
  - rota cumprida dá +2 de Força na próxima habilidade ofensiva;
  - Farm só dá +1 de ouro se um acampamento tiver sido coletado.
- Herói só pressiona uma rota depois de passar da própria Torre Exterior.
- Dragão: vida 3 → 8.
- Barão: vida 5 → 14.
- Botão direto para gastar Prioridade no painel.
- Doação do Suporte cria um dado adicional destinado ao aliado.
- Escudo não é mais zerado no encerramento da rodada.
- IA escolhe alvos, movimenta heróis, usa Lampejo/Retorno defensivamente e joga o draft.
- Vida do épico ganhou ajuste de legibilidade no mapa.

## Mudança estrutural desta integração

- `jogo/index.html`: pacote autocontido de 3.345.991 bytes → estrutura de 2.334 bytes.
- `jogo/estilo.css`: recebe o CSS da v15.
- `jogo/jogo.js`: recebe o motor e a interface da v15.
- `data/catalogo.js`: preservado, pois era idêntico ao bloco embutido.
- Documentação de estado, regras, fluxo e versão atualizada.

## Validação executada

- Correspondência funcional entre o pacote reconstruído e a v15 recebida; as únicas diferenças são o carimbo automático do commit e a remoção de espaço em branco no fim de uma linha.
- `node --check` em `jogo/jogo.js` e `data/catalogo.js`.
- `node sim/simetria.js`: tabuleiro simétrico e espinhas contínuas.
- Smoke test de 200 partidas concluído sem erro de execução.
- `node teste/empacota.js`: 70 imagens embutidas e nenhuma referência externa.

O smoke test serve para detectar quebra, não para aprovar balanceamento.
