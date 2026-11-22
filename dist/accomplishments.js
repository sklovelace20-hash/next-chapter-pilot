const yearOf = (date) => date.slice(0, 4);

export function accomplishmentsByYear(entries = []) {
  const groups = new Map();
  for (const entry of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    const year = yearOf(entry.date);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(entry);
  }
  return groups;
}

function localDate(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
}
function dateLabel(date) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' })
    .format(new Date(date + 'T12:00:00'));
}

export function accomplishments({ host, read, save, node, button, notify }) {
  let editing;
  let activeYear = yearOf(localDate(new Date()));
  function listing({ all = false } = {}) {
    const groups = accomplishmentsByYear(read().accomplishments);
    const list = node('div', '');
    const groupList = all ? [...groups] : [[activeYear, groups.get(activeYear) || []]];
    if (!groupList.length || !groupList.some(([, entries]) => entries.length)) {
      list.append(node('p', 'Your first win can be small. What made you smile this year?'));
      return list;
    }
    for (const [year, entries] of groupList) {
      const section = node('section', '', 'accomplishment-year');
      section.append(node('h3', year));
      const items = node('ul', '', 'accomplishment-list');
      for (const item of entries) {
        const entry = node('li', '');
        entry.append(node('strong', item.title), node('p', dateLabel(item.date), 'library-credit'));
        if (item.note && all) entry.append(node('p', item.note, 'entry'));
        if (item.note && !all) {
          const detail = node('details', '', 'follow-up');
          detail.append(node('summary', 'Why it mattered'), node('p', item.note, 'entry'));
          entry.append(detail);
        }
        if (!all) {
          const edit = button('Edit', () => {
            editing = item.id;
            render();
            host.querySelector('form input[name="title"]').focus();
          }, 'quiet');
          edit.setAttribute('aria-label', `Edit ${item.title}`);
          entry.append(edit);
        }
        items.append(entry);
      }
      section.append(items);
      list.append(section);
    }
    return list;
  }
  function render() {
    const state = read();
    const entries = state.accomplishments || [];
    const entry = entries.find((item) => item.id === editing);
    const intro = node('div', '', 'section-intro topic-intro topic-goals');
    const title = node('h1', 'Things I’m proud of');
    title.tabIndex = -1;
    intro.append(title, node('p', 'Save a win, a kind word, or a moment you want to remember.'));
    const card = node('article', '', 'accomplishment-card');
    card.append(node('h2', entry ? 'Edit Smile File entry' : 'What’s going in your smile file?'));
    const form = node('form', '');
    const field = (label, input) => {
      const wrapper = node('label', label);
      wrapper.append(input);
      form.append(wrapper);
      return input;
    };
    const name = field('What do you want to remember?', Object.assign(document.createElement('input'), {
      name: 'title', required: true, maxLength: 160, value: entry?.title || ''
    }));
    const date = field('When did it happen?', Object.assign(document.createElement('input'), {
      type: 'date', required: true, max: localDate(new Date()), min: '1900-01-01', value: entry?.date || localDate(new Date())
    }));
    const note = field('Why does it matter to you? Optional', Object.assign(document.createElement('textarea'), { value: entry?.note || '', maxLength: 1800 }));
    const actions = node('div', '', 'actions');
    actions.append(node('button', entry ? 'Save changes' : 'Save to my smile file'));
    if (entry) {
      const cancel = button('Cancel', () => { editing = undefined; render(); }, 'quiet');
      cancel.type = 'button';
      actions.append(cancel);
    }
    form.append(actions);
    form.onsubmit = (event) => {
      event.preventDefault();
      const title = name.value.trim();
      if (!title) { name.focus(); return; }
      const current = read();
      const saved = { id: entry?.id || crypto.randomUUID(), title, date: date.value, note: note.value.trim() };
      const next = [...(current.accomplishments || []).filter((item) => item.id !== saved.id), saved];
      if (save({ ...current, accomplishments: next })) {
        editing = undefined;
        activeYear = yearOf(saved.date);
        render();
        host.querySelector('h2').focus();
        notify('That one counts. It’s in your smile file!');
      }
    };
    card.querySelector('h2').tabIndex = -1;
    card.append(form);
    const review = node('article', '', 'accomplishment-card');
    review.append(node('h2', 'Your year in review'));
    const label = node('label', 'Year');
    const select = document.createElement('select');
    const years = new Set([yearOf(localDate(new Date())), activeYear, ...entries.map(({ date }) => yearOf(date))]);
    for (const year of [...years].sort().reverse()) select.add(new Option(year, year));
    select.value = activeYear;
    select.onchange = () => {
      activeYear = select.value;
      render();
      host.querySelector('select').focus();
    };
    label.append(select);
    review.append(label, listing(), node('p', 'In the Plan hub, you can choose which wins to include in your AI summary and follow-up questions.'));
    host.replaceChildren(intro, card, review);
  }
  return { render, listing };
}
