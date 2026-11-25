const get = id => document.getElementById(id);
let catalog;
let discarded = new Set();

function show(screen) {
  get('landing').hidden = screen !== 'landing';
  get('game').hidden = screen !== 'game';
  window.scrollTo(0, 0);
  get(screen === 'game' ? 'reveal' : 'start').focus({ preventScroll: true });
}

function portrait(card) {
  const tile = document.createElement('span');
  tile.className = 'portrait';
  tile.style.setProperty('--hue', String((card.id * 47) % 360));
  tile.textContent = String(card.id).padStart(2, '0');
  if (card.image) {
    const image = document.createElement('img');
    image.src = './cartas/' + card.image;
    image.alt = '';
    image.addEventListener('error', () => image.remove());
    tile.append(image);
  }
  return tile;
}

function startGame() {
  discarded.clear();
  const character = catalog[Math.floor(Math.random() * catalog.length)];
  get('secret').replaceChildren(portrait(character));
  get('secret-name').textContent = character.name.toLocaleUpperCase('es');
  reveal(false);

  const order = [...catalog];
  for (let index = order.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [order[index], order[other]] = [order[other], order[index]];
  }
  const buttons = order.map(card => {
    const button = document.createElement('button');
    button.className = 'card';
    const label = document.createElement('span');
    label.className = 'name';
    label.textContent = card.name;
    button.append(portrait(card), label);
    button.setAttribute('aria-pressed', String(discarded.has(card.id)));
    button.addEventListener('click', () => {
      if (discarded.has(card.id)) discarded.delete(card.id);
      else discarded.add(card.id);
      button.setAttribute('aria-pressed', String(discarded.has(card.id)));
      updateCount();
    });
    return button;
  });
  get('board').replaceChildren(...buttons);
  updateCount();
}

function updateCount() {
  get('remaining').textContent = (catalog.length - discarded.size) + ' posibles';
}

function reveal(visible) {
  get('secret').classList.toggle('concealed', !visible);
  get('secret-name').hidden = !visible;
  get('reveal').textContent = visible ? 'Ocultar' : 'Mostrar';
  get('reveal').setAttribute('aria-pressed', String(visible));
}

get('start').addEventListener('click', async () => {
  const start = get('start');
  const message = get('message');
  start.disabled = true;
  message.hidden = true;
  try {
    if (!catalog) {
      const response = await fetch('./cartas/catalogo.json');
      if (!response.ok) throw Error('No se pudo cargar el catálogo');
      const cards = await response.json();
      if (cards.length !== 24) throw Error('Catálogo incompleto');
      catalog = cards;
    }
    startGame();
    show('game');
  } catch {
    message.textContent = 'No se pudieron cargar las cartas. Vuelve a pulsar Inicio.';
    message.hidden = false;
  } finally {
    start.disabled = false;
  }
});

get('leave').addEventListener('click', () => show('landing'));
get('reveal').addEventListener('click', () => reveal(get('reveal').getAttribute('aria-pressed') === 'false'));
const roundDialog = get('round-dialog');
get('next').addEventListener('click', () => {
  roundDialog.returnValue = '';
  roundDialog.showModal();
});
roundDialog.addEventListener('close', () => {
  if (roundDialog.returnValue === 'confirm') {
    startGame();
    show('game');
  }
});
