/* Metadados editoriais do projeto.
   Números de regra continuam no motor; este arquivo só identifica o retrato que
   será publicado por `npm run atualizar`. */
const PROJETO = Object.freeze({
  versao: "v15.2",
  status: "organização e UX pós-playtest",
  atualizadoEm: "2026-08-11",
  modo: "hotseat local para 2 jogadores",
  iaAtiva: false,
  conteudo: "Heróis, itens, nomes e mapa atuais são conteúdo mecânico de teste. O cânone visual será integrado a partir de visual-lab quando estiver aprovado."
});

if(typeof module!=="undefined") module.exports=PROJETO;
