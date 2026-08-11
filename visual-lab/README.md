# JAGERLARAMAIS — Visual Lab

Laboratório do cânone visual futuro: universo, personagens, territórios, itens, monstros, cartas e linguagem de interface. Nada aqui altera a regra do jogo automaticamente.

O estado criativo e o pipeline de aprovação estão em `JAGERLARAMAIS-CREATIVE-HANDOFF.md`.

## Estrutura

- `app/`: fonte do guide visual.
- `public/images/`: imagens servidas pelo app-fonte.
- `index.html`, `assets/` e `images/`: versão estática publicada.
- `.openai/hosting.json`: configuração de hospedagem do laboratório.

A duplicação entre `public/images/` e `images/` é temporária e intencional: hoje existem duas saídas. Não apagar uma delas sem unificar o build.

## Comandos

```bash
npm run dev
npm run build
npm test
```

Requer Node.js 22.13 ou superior. O build publicado é validado pelos scripts em `scripts/` deste diretório.

## Integração com o jogo

Um personagem só sai daqui para `../data/catalogo.js` depois de aprovado visual e mecanicamente. A migração deve preservar um ID estável e entregar retrato leve, carta, posição, classe, atributos e três habilidades compatíveis com o vocabulário do motor.
