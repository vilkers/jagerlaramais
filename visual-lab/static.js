const routes = [
  { n: "01", name: "TOPO", world: "FORTALEZA DE RUA", copy: "Brutalismo, esporte de contato e engenharia improvisada.", color: "#c8ff35" },
  { n: "02", name: "SELVA", world: "BIOMA MUTANTE", copy: "Criaturas, próteses orgânicas e tecnologia cultivada.", color: "#23d7a0" },
  { n: "03", name: "MEIO", world: "ARCANO POP", copy: "Magia como mídia: símbolos vivos, luz e espetáculo.", color: "#8c6cff" },
  { n: "04", name: "ATIRADOR", world: "KINÉTICA URBANA", copy: "Precisão, moda utilitária e energia em movimento.", color: "#ff5f48" },
  { n: "05", name: "SUPORTE", world: "RITUAL AFETIVO", copy: "Relíquias pessoais, memória e proteção coletiva.", color: "#ff91c8" },
];

const main = document.querySelector("main");
const buttons = [...document.querySelectorAll(".route-tabs button")];
const number = document.querySelector(".route-number");
const label = document.querySelector(".route-stage p:first-child");
const title = document.querySelector(".route-stage h2");
const copy = document.querySelector(".route-copy");

buttons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const route = routes[index];
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    main.style.setProperty("--active", route.color);
    number.textContent = route.n;
    label.textContent = `${route.name} / CULTURA VISUAL`;
    title.textContent = route.world;
    copy.textContent = route.copy;
  });
});
