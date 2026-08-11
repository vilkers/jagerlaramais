/* A versão publicada no GitHub Pages é documento estático: a hidratação do React
   é removida por scripts/publicar-estatico.mjs. Este arquivo devolve, em JS puro,
   a única interação da página — o filtro de rota do elenco.
   Se app/page.tsx ganhar interação nova, ela precisa ser refeita aqui. */

const botoes = [...document.querySelectorAll("[data-filter]")];
const slots = [...document.querySelectorAll(".hero-slot")];

botoes.forEach((botao) => {
  botao.addEventListener("click", () => {
    const filtro = botao.dataset.filter;
    botoes.forEach((item) => item.classList.toggle("on", item === botao));
    slots.forEach((slot) => {
      slot.hidden = filtro !== "TODOS" && slot.dataset.role !== filtro;
    });
  });
});
