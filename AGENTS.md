# Instruções para agentes

Leia `CLAUDE.md` e `docs/ESTADO.md` antes de alterar o projeto.

## Fechamento obrigatório

Antes de declarar qualquer tarefa concluída:

```bash
npm run atualizar
git diff --check
git status --short
```

Inclua no commit os arquivos sincronizados e `teste/JOGAR.html`. Não edite
`data/retrato.js`, o pacote offline ou blocos `AUTO:*` manualmente.

O conteúdo atual do jogo é mecânico e provisório. `visual-lab/` é a origem do
cânone visual futuro e só entra no motor depois de aprovação explícita.
