# Protocolo de atualização do JAGERLARAMAIS

Regra permanente para Vilker, Vinicius, Matheus e qualquer IA que trabalhe no projeto.

## Regra central

Nenhuma contribuição entra por substituição silenciosa. Toda atualização deve ser integrada nas fontes, revisada em branch própria e registrada antes de chegar à `main`.

## Antes de começar

1. Atualize a cópia local a partir da `main`.
2. Leia `docs/ESTADO.md`, `docs/patch-notes.md` e o registro da última versão em `docs/versions/`.
3. Compare a contribuição com a `main` atual. Se os mesmos trechos mudaram dos dois lados, pare e faça merge consciente.
4. Confirme a origem, o autor, a data e a versão no formato `vNN`.

## Fonte e arquivo gerado

- `jogo/index.html` é apenas a estrutura da tela.
- `jogo/estilo.css` contém o visual.
- `jogo/motor.js` contém estado, geometria e regras.
- `jogo/interface.js` contém renderização e interação.
- `jogo/cartas.js` contém o Deck de Comando.
- `jogo/jogo.js` contém draft, abertura e inicialização.
- `data/catalogo.js` é a fonte única de conteúdo.
- `teste/JOGAR.html` é um pacote autocontido gerado por `node teste/empacota.js`.

Nunca editar ou publicar um arquivo autocontido de 3 MB como se fosse a fonte do jogo. Ele serve para teste e avaliação. A mudança definitiva deve ser aplicada nos arquivos-fonte e o pacote deve ser regenerado depois.

## Fluxo obrigatório

1. Criar uma branch para a contribuição.
2. Integrar as mudanças por assunto, preservando a arquitetura atual.
3. Atualizar `docs/ESTADO.md` quando o retrato do jogo mudar.
4. Inserir uma entrada nova no topo de `docs/patch-notes.md` quando houver mudança de regra ou número.
5. Criar `docs/versions/vNN/` com:
   - `README.md`: origem, escopo, status e decisões abertas;
   - `CHANGELOG.md`: tudo o que entrou, inclusive mudanças não citadas no resumo recebido;
   - `FILES.md`: arquivos adicionados, alterados e preservados.
6. Rodar as validações disponíveis.
7. Revisar `git diff` e `git status`.
8. Abrir Pull Request. Não fazer commit direto na `main` para uma nova contribuição.

## Validação mínima

```bash
node --check jogo/motor.js
node --check jogo/interface.js
node --check jogo/cartas.js
node --check jogo/jogo.js
node --check data/catalogo.js
node --test sim/*.test.js
node sim/simetria.js
node sim/bateria.js 200
node teste/empacota.js /tmp/JOGAR.html
git diff --check
```

Além disso, jogar ao menos uma rodada no celular antes de aprovar alterações de interface, gesto, mapa ou ritmo.

## Preservação

- Não apagar originais recebidos nem história do Git.
- Não alterar `visual-lab/` durante uma integração mecânica.
- Não reescrever entradas antigas de `docs/patch-notes.md`.
- Não substituir decisões anteriores sem registrar a nova decisão e o motivo.
- Não publicar, fazer push, merge ou apagar arquivos sem autorização explícita do responsável pela atualização.

## Conflitos e lacunas

Quando a contribuição trouxer mudanças ausentes do guia, números sem justificativa ou comportamento contraditório com a documentação, preservar o material numa branch, registrar a divergência no `README.md` da versão e deixar o PR em revisão. Não escolher silenciosamente qual regra vale.
