export const inspiration = {
  'Everyday joys': [
    'Catch a sunset from a new spot', 'Put my feet in the ocean', 'Take a long walk with no agenda',
    'Take a back-roads drive', 'Pack a picnic breakfast', 'Call the friend who always makes me laugh',
    'Shoot baskets until I sink five', 'Try a new coffee shop', 'Make a playlist for the windows-down ride',
    'Walk the dog somewhere new', 'Dance through one whole song', 'Borrow a memoir from the library',
    'Buy a postcard and actually mail it', 'Watch the clouds from a blanket', 'Try a new pancake recipe',
    'Visit a neighborhood art show', 'Trade favorite songs with a friend', 'Plant something in a pot',
    'Catch a free outdoor concert', 'Play a sunset set of tennis', 'Find a swimming hole for a picnic',
    'Browse a used bookstore', 'Invite someone over for game night', 'Photograph three things that make me smile',
    'Sit on the porch until the stars come out'
  ],
  'Big adventures': [
    'Go to a college game', 'Hike out West', 'Take a girls’ trip', 'Travel to an unexpected place',
    'Take a road trip across three states', 'Try a guided RTV trail ride', 'See a show at Red Rocks',
    'Sleep on an overnight train', 'Visit a national park I’ve never seen', 'See the northern lights',
    'Learn to sail', 'Spend a weekend at a writing retreat', 'Take a solo trip',
    'Go whale watching', 'See a favorite artist in their hometown', 'Learn enough of a language to order dinner abroad',
    'Walk a stretch of a long-distance trail', 'Host a family reunion', 'Take a pottery course and make a dinner set',
    'Ride in a hot-air balloon', 'Plan a trip around a meteor shower', 'Take a cooking class in another country',
    'Share a story at a live storytelling night', 'Attend a Grand Slam tennis tournament', 'Spend a week by the ocean'
  ]
};

export function countLines(items) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return lines.filter(line => line.every(index => items[index]?.done)).length;
}

export function bucketBingo({ get, node, read, save }) {
  const grid = get('bucket-board');
  const field = get('bucket-name');
  const status = get('bucket-status');
  const entries = () => read().bucketList || [];
  let page = 0;
  const choices = new Map();
  function commit(items) { return save({...read(), bucketList: items}); }
  function add(title) {
    title = title.trim();
    if (!title) { field.focus(); return false; }
    const items = entries();
    if (items.some(item => item.title.toLowerCase() === title.toLowerCase())) {
      status.textContent = 'That one’s already on your board.';
      return false;
    }
    if (!commit([...items, {title, done:false}])) return false;
    page = Math.floor(items.length / 9);
    render();
    status.textContent = 'Added: ' + title;
    return true;
  }
  get('bucket-form').onsubmit = event => {
    event.preventDefault();
    if (add(field.value)) { field.value = ''; field.focus(); }
  };
  for (const [title, suggestions] of Object.entries(inspiration)) {
    const group = node('details', '', 'follow-up');
    group.append(node('summary', title + ' (25)'));
    const list = node('div', '', 'actions');
    for (const suggestion of suggestions) {
      const choice = node('button', suggestion, 'quiet');
      choice.onclick = () => add(suggestion);
      choices.set(suggestion, choice);
      list.append(choice);
    }
    group.append(list);
    get('bucket-inspo').append(group);
  }
  function render() {
    const items = entries();
    const pages = Math.max(1, Math.ceil(items.length / 9));
    page = Math.min(page, pages - 1);
    const slice = items.slice(page * 9, page * 9 + 9);
    const lines = countLines(slice);
    get('bucket-progress').textContent = 'Board ' + (page + 1) + ' of ' + pages + ' · ' + slice.filter(item => item.done).length + ' of 9 done' + (lines ? ' · Bingo! ' + lines + (lines === 1 ? ' line' : ' lines') : '');
    grid.replaceChildren();
    for (let i = 0; i < 9; i++) {
      const item = slice[i];
      const tile = node('button', item ? (item.done ? '✓ ' : '') + item.title : '+ Add an idea', 'quiet');
      if (item) tile.setAttribute('aria-pressed', String(item.done));
      tile.onclick = () => {
        if (!item) { field.focus(); return; }
        const next = entries().map((entry, index) => index === page * 9 + i ? {...entry, done: !entry.done} : entry);
        if (commit(next)) {
          render();
          grid.children[i].focus();
          status.textContent = countLines(next.slice(page*9,page*9+9)) > lines ? 'Bingo! Three in a row.' : (item.done ? 'Back on the list.' : 'You did it!');
        }
      };
      grid.append(tile);
    }
    for (const [title, choice] of choices) {
      choice.disabled = items.some(item => item.title.toLowerCase() === title.toLowerCase());
      choice.textContent = (choice.disabled ? '✓ ' : '') + title;
    }
    get('bucket-prev').hidden = page === 0;
    get('bucket-next').hidden = page === pages - 1;
  }
  get('bucket-prev').onclick = () => { page--; render(); };
  get('bucket-next').onclick = () => { page++; render(); };
  render();
  return render;
}
