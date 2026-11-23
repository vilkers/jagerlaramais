const dialog = document.querySelector('#image-dialog');
let trigger;
document.querySelectorAll('[data-zoom]').forEach(link => link.addEventListener('click', event => {
  if (!dialog?.showModal) return;
  event.preventDefault(); trigger = link;
  const image = dialog.querySelector('img'); image.src = link.href;
  image.alt = link.querySelector('img')?.alt || 'Arte do personagem';
  dialog.showModal();
}));
dialog?.querySelector('button').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog?.addEventListener('close', () => trigger?.focus());

function revealStage() {
  const id = location.hash.slice(1);
  const target = id && document.getElementById(id);
  if (target?.tagName === 'DETAILS') target.open = true;
}
window.addEventListener('hashchange', revealStage); revealStage();

const filter = document.querySelector('[data-roster-filter]');
filter?.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]'); if (!button) return;
  const value = button.dataset.filter;
  filter.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const cards = [...document.querySelectorAll('[data-hero-role]')];
  cards.forEach(card => { card.hidden = value !== 'TODOS' && !card.dataset.heroRole.includes(value); });
  const count = document.querySelector('[data-filter-count]');
  if (count) count.textContent = `${cards.filter(card => !card.hidden).length} ${cards.filter(card => !card.hidden).length === 1 ? "personagem" : "personagens"}`;
});
