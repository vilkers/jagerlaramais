const buttons = [...document.querySelectorAll("[data-filter]")];
const slots = [...document.querySelectorAll(".hero-slot")];

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    buttons.forEach((item) => item.classList.toggle("on", item === button));
    slots.forEach((slot) => {
      slot.hidden = filter !== "TODOS" && !slot.dataset.role.includes(filter);
    });
  });
});
