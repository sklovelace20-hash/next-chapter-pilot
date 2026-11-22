import { viewRoutes } from './routes.js';
import { profileFields } from './growth.js';
import { planQuestions, personalityEvidence } from './deeper.js';
import { seal, unseal } from './vault-crypto.js';

export const vaultKey = 'next-chapter-encrypted-vault-v1';
export const cadenceOptions = [[3, 'Every 3 days'], [7, 'Weekly'], [14, 'Every 2 weeks'], [30, 'Monthly']];
const viewIds = ['dashboard', 'roadmap', 'vault', 'discover', 'output', 'library', 'accomplishments'];
const day = 86400000;
const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(value);

export function nextCheckIn(state) {
  const interval = state.roadmap?.cadence || 7;
  return new Date(new Date(state.reviews.at(-1)?.date || state.started).getTime() + interval * day);
}

export function workspace({ get, show, read, save, node, button, notify, dashboard, discover, beginVisit, output, library, accomplishments }) {
  let passphrase = '';
  let notes = [];
  let vaultOperation = 0;
  let lastActivity;
  let sharingPrivate = false;

  function lock() {
    vaultOperation += 1;
    clearTimeout(lastActivity);
    passphrase = '';
    notes = [];
    if (sharingPrivate) clearShare();
    get('vault').replaceChildren();
  }

  function activity() {
    clearTimeout(lastActivity);
    lastActivity = setTimeout(() => {
      lock();
      if (!get('vault').hidden) renderVault();
    }, 5 * 60 * 1000);
  }

  function go(view, { section, path } = {}) {
    if (view !== 'vault') lock();
    if (view === 'dashboard') return dashboard();
    if (view === 'discover') discover(section);
    if (view === 'output') output(section);
    if (view === 'library') library();
    if (view === 'accomplishments') accomplishments();
    if (view === 'roadmap') renderRoadmap();
    if (view === 'vault') renderVault();
    show(view, undefined, path);
    get(view).querySelector('h1')?.focus();
  }

  for (const tab of get('workspace-nav').querySelectorAll('button')) {
    tab.onclick = () => {
      if (tab.dataset.view === 'dashboard' && !tab.hasAttribute('aria-current')) beginVisit();
      go(tab.dataset.view);
    };
  }

  function page(container, title, description) {
    const heading = node('h1', title);
    heading.tabIndex = -1;
    const intro = node('div', '', 'section-intro');
    intro.append(heading, node('p', description));
    container.replaceChildren(intro);
  }

  function field(form, name, labelText, value, options) {
    const label = node('label', labelText);
    const input = document.createElement(options ? 'select' : 'textarea');
    if (options) {
      for (const [key, label] of options) input.add(new Option(label, key));
    }
    input.name = name;
    input.value = value || '';
    label.append(input);
    form.append(label);
    return input;
  }

  function card(title, body) {
    const element = node('article', '');
    element.append(node('h2', title), node('p', body, 'entry'));
    return element;
  }

  function renderRoadmap() {
    const { plan, projectTracker: tracker, roadmap: road } = read();
    const guide = node('section', '', 'route-guide');
    const heading = node('h1', 'Your roadmap');
    heading.tabIndex = -1;
    const banner = node('div', '', 'roadmap-banner');
    const map = node('img', '', 'roadmap-map');
    map.alt = '';
    map.src = '/roadmap-route.svg';
    const planHub = node('a', 'Open Plan Hub', 'topic-page-link');
    planHub.href = viewRoutes.output;
    planHub.onclick = (event) => {
      if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      go('output');
    };
    banner.append(heading, planHub, map);
    guide.append(banner);
    if (!plan) {
      guide.append(node('p', 'Choose a goal in Plan Hub to see your next move and track milestones.'));
      get('roadmap').replaceChildren(guide);
      return;
    }

    const steps = tracker?.steps || [];
    const active = steps.findIndex(step => !step.done);
    const current = steps[active];
    const complete = steps.length > 0 && !current;
    const next = node('section', '', 'route-next');
    next.append(node('h2', complete ? 'Plan complete' : 'Your next move'),
      node('p', complete ? 'You’ve completed every milestone in this plan.' : current?.today || current?.action || plan.action));
    const progressCard = node('section', '', 'route-progress');
    progressCard.append(node('h2', 'Milestone progress'));
    if (steps.length) {
      const count = steps.filter(step => step.done).length;
      const progress = node('progress');
      progress.max = steps.length;
      progress.value = count;
      progress.setAttribute('aria-label', 'Milestone progress');
      progressCard.append(node('p', `${count} of ${steps.length} milestones complete`), progress);
    } else {
      progressCard.append(node('p', 'Build your timeline in Plan Hub to track milestones here.'));
    }
    const snapshot = node('div', '', 'route-snapshot');
    snapshot.append(next, progressCard);
    guide.append(snapshot);

    const focus = [tracker?.focus || road?.skill, tracker?.second].filter(Boolean).join(' · ');
    const goal = node('details', '', 'page-details route-goal');
    goal.append(node('summary', '90-day goal and focus'), node('p', plan.goal, 'entry'));
    if (focus) goal.append(node('p', focus));
    if (road?.practice && road.practice !== current?.today && road.practice !== plan.action) {
      goal.append(node('p', 'Current practice · ' + road.practice));
    }
    guide.append(goal);

    if (steps.length) {
      const path = node('ol', '', 'route-path');
      steps.forEach((step, index) => {
        const item = node('li');
        const status = step.done ? 'Complete' : index === active ? 'Up next' : 'Ahead';
        if (index === active) item.setAttribute('aria-current', 'step');
        const details = node('details', '', 'page-details route-milestone');
        const summary = node('summary');
        summary.append(node('strong', step.title),
          node('small', `Days ${step.days.join('–')} · ${status}`));
        details.append(summary, node('p', step.action, 'entry'));
        if (step.today && step.today !== step.action) details.append(node('p', 'First action · ' + step.today, 'entry'));
        if (step.notes) details.append(node('p', 'Notes · ' + step.notes, 'entry'));
        item.append(details);
        path.append(item);
      });
      guide.append(node('h2', 'Milestones'), path);
    }
    get('roadmap').replaceChildren(guide);
  }

  function planSettings() {
    const state = read();
    const road = state.roadmap || {};
    const container = node('section', '', 'hub-panel');
    if (state.growth?.confirmed) {
      const confirmed = node('details', '', 'settings-panel');
      confirmed.append(node('summary', 'What you confirmed in Discover'));
      for (const [key, label] of profileFields) {
        const value = state.growth.confirmed[key];
        if (value) confirmed.append(node('p', label), node('blockquote', value, 'entry'));
      }
      confirmed.append(node('p', 'Does this still fit? Update your wording in Discover.'),
        button('Review my words', () => { discover('insights'); show('discover'); get('discover').querySelector('h1').focus(); }, 'quiet'));
      container.append(confirmed);
    }
    const lens = node('details', '', 'settings-panel');
    lens.append(node('summary', 'Use your personality and strengths in this plan'));
    const selected = personalityEvidence(state.discovery);
    const strengths = [...(state.discovery?.strengths || []), state.discovery?.otherStrength].filter(Boolean);
    if (strengths.length) lens.append(node('p', 'Strengths you named'), node('blockquote', strengths.join(', ')));
    if (state.discovery?.strengthExample) lens.append(node('p', 'The example you gave'), node('blockquote', state.discovery.strengthExample, 'entry'));
    for (const [question, answer] of selected) lens.append(node('p', question), node('blockquote', answer));
    if (!selected.length && !strengths.length) lens.append(node('p', 'Answer a few Personality questions in Discover to bring your responses here.'));
    lens.append(node('p', 'Which of these preferences fits this situation? When have you worked differently and had a better result?'));
    container.append(lens);
    const details = node('details', '', 'settings-panel');
    details.append(node('summary', 'Assess, plan and set check-ins'));
    const form = node('form', '');
    const ratings = [['', 'Choose a rating'], [1, '1 · Beginning'], [2, '2 · Learning'], [3, '3 · Practicing'], [4, '4 · Independent'], [5, '5 · Consistent']];
    field(form, 'skill', 'What skill would make the biggest difference?', road.skill);
    field(form, 'gap', 'Where do you get stuck, and what evidence points to that gap?', road.gap);
    field(form, 'baseline', 'Where are you today?', road.baseline, ratings);
    field(form, 'target', 'Where do you want to be by day 90?', road.target, ratings);
    field(form, 'practice', 'What can you practice in a low-stakes setting?', road.practice);
    field(form, 'experience', 'Where could you apply it and get feedback?', road.experience);
    field(form, 'evidence', 'What would tell you that the gap is closing?', road.evidence);
    const guided = node('div', '', 'guided-plan');
    guided.append(node('h3', 'Explore what’s behind the plan'), node('p', 'Open the questions that fit. You can come back to the others.'));
    for (const [key, question, follow] of planQuestions) {
      const group = node('details', '', 'follow-up');
      group.append(node('summary', question));
      field(group, key, 'Your answer', road[key]);
      field(group, `${key}Follow`, follow, road[`${key}Follow`]);
      guided.append(group);
    }
    form.append(guided);
    field(form, 'cadence', 'Check-in interval', road.cadence || '7', [[0, 'Custom interval'], ...cadenceOptions]);
    const custom = field(form, 'custom', 'Custom interval in days', road.cadence || '7', null);
    custom.replaceWith(Object.assign(document.createElement('input'), { type: 'number', name: 'custom', value: road.cadence || '7', min: '1', max: '365', required: true }));
    const customInput = form.elements.namedItem('custom');
    const cadence = form.elements.namedItem('cadence');
    if (road.cadence && !cadence.value) cadence.value = '0';
    const updateCustom = () => {
      customInput.disabled = cadence.value !== '0';
      customInput.closest('label').hidden = customInput.disabled;
    };
    cadence.onchange = updateCustom;
    updateCustom();
    form.append(node('p', 'Start weekly. Try every 3 days during an intensive practice period, or every 2 weeks when feedback takes longer.'), node('button', 'Save plan settings'));
    form.onsubmit = (event) => {
      event.preventDefault();
      const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
      values.cadence = Number(values.cadence || 7) || Number(values.custom);
      delete values.custom;
      if (save({ ...read(), roadmap: values })) {
        notify('Plan settings saved.');
      }
    };
    details.append(form);
    container.append(details);
    return container;
  }

  function renderVault() {
    const container = get('vault');
    page(container, 'Privacy vault', 'Encrypted notes saved in this browser.');
    let record;
    try {
      record = JSON.parse(localStorage.getItem(vaultKey));
    } catch {
      container.append(card('Vault unavailable', 'This browser could not read the encrypted vault.'));
      return;
    }
    if (!passphrase) {
      const form = node('form', '', 'settings-panel vault-unlock');
      const label = node('label', record ? 'Vault passphrase' : 'Create a vault passphrase');
      const input = Object.assign(document.createElement('input'), {
        type: 'password', required: true, minLength: record ? 1 : 12,
        autocomplete: record ? 'current-password' : 'new-password'
      });
      label.append(input);
      const submit = node('button', record ? 'Unlock vault' : 'Create vault');
      const status = node('p', '', 'inline-status');
      status.setAttribute('role', 'status');
      form.append(label, submit, status);
      if (!record) form.append(node('p', 'Use at least 12 characters. A forgotten passphrase can’t be recovered.'));
      form.onsubmit = async (event) => {
        event.preventDefault();
        submit.disabled = true;
        const operation = ++vaultOperation;
        const candidate = input.value;
        try {
          const opened = record ? await unseal(record, candidate) : [];
          const created = record ? null : await seal(opened, candidate);
          if (operation !== vaultOperation) return;
          if (created && localStorage.getItem(vaultKey)) {
            renderVault();
            notify('The vault was created in another tab. Unlock it to continue.');
            return;
          }
          if (created) localStorage.setItem(vaultKey, JSON.stringify(created));
          notes = opened;
          passphrase = candidate;
          activity();
          renderVault();
          get('vault').querySelector('h1').focus();
        } catch {
          status.textContent = 'Could not open the vault. Check your passphrase and browser storage.';
        } finally {
          submit.disabled = false;
        }
      };
      container.append(form);
      return;
    }
    const actions = node('div', '', 'vault-actions');
    const form = node('form', '', 'settings-panel vault-note-form');
    form.id = 'vault-note-form';
    form.hidden = true;
    const kind = field(form, 'kind', 'Entry type', 'Reflection', [['Reflection', 'Reflection'], ['Observation', 'Observation'], ['Question', 'Question'], ['Experience', 'Experience']]);
    const entry = field(form, 'entry', 'What are you noticing or trying to understand?', '');
    entry.required = true;
    const add = button('Add a note', () => {
      form.hidden = !form.hidden;
      add.setAttribute('aria-expanded', String(!form.hidden));
      activity();
      if (!form.hidden) entry.focus();
    });
    add.setAttribute('aria-expanded', 'false');
    add.setAttribute('aria-controls', form.id);
    actions.append(add, button('Lock vault', () => {
      lock();
      renderVault();
      get('vault').querySelector('h1').focus();
    }, 'quiet'));
    const submit = node('button', 'Save private entry');
    form.append(submit);
    form.onsubmit = async (event) => {
      event.preventDefault();
      const content = entry.value.trim();
      if (!content) return entry.focus();
      submit.disabled = true;
      const operation = ++vaultOperation;
      const next = [{ kind: kind.value, content, date: new Date().toISOString() }, ...notes];
      try {
        const encrypted = await seal(next, passphrase, record);
        if (operation !== vaultOperation) return;
        if (localStorage.getItem(vaultKey) !== JSON.stringify(record)) {
          lock();
          renderVault();
          notify('The vault changed in another tab. Unlock it to continue.');
          return;
        }
        localStorage.setItem(vaultKey, JSON.stringify(encrypted));
        notes = next;
        activity();
        renderVault();
        get('vault').querySelector('#vault-saved-title').focus();
        notify('Private entry saved.');
      } catch {
        notify('The vault could not save this entry.');
        submit.disabled = false;
      }
    };
    const saved = node('section', '', 'vault-notes');
    const savedTitle = node('h2', 'Saved notes');
    savedTitle.id = 'vault-saved-title';
    savedTitle.tabIndex = -1;
    saved.append(savedTitle);
    if (!notes.length) saved.append(node('p', 'Your notes will appear here after you save them.'));
    for (const note of notes) {
      const item = node('details', '', 'page-details vault-note');
      const summary = node('summary', `${note.kind} · ${formatDate(new Date(note.date))}`);
      item.append(summary);
      item.ontoggle = () => {
        if (!passphrase || !item.isConnected) return;
        activity();
        if (item.open) {
          item.append(node('p', note.content, 'entry'), button('Share this entry', () => openShare(note), 'quiet'));
        } else {
          item.replaceChildren(summary);
        }
      };
      saved.append(item);
    }
    container.append(actions, form, saved);
  }

  function openShare(privateNote) {
    sharingPrivate = Boolean(privateNote);
    if (sharingPrivate) activity();
    const { plan, roadmap = {}, reviews } = read();
    const latest = reviews.at(-1);
    const selections = [
      ['90-day goal', plan.goal], ['Next action', plan.action], ['Skill to build', roadmap.skill],
      ['Gap I’m investigating', roadmap.gap], ['Self-assessment', roadmap.baseline && `${roadmap.baseline}/5${roadmap.target ? ` → ${roadmap.target}/5` : ''}`],
      ['Practice plan', roadmap.practice], ['Experience to gain', roadmap.experience],
      ['Latest outcome', latest?.outcome], ['Latest evidence', latest?.evidence],
      ['Latest reflection', latest?.notes], ['Next check-in date', formatDate(nextCheckIn(read()))],
      ['Private vault entry', privateNote?.content]
    ].filter(([, value]) => value);
    const items = get('share-items');
    while (items.children.length > 1) items.lastElementChild.remove();
    const update = () => {
      const chosen = [...items.querySelectorAll('input:checked')].map((input) => selections[Number(input.value)]);
      const message = chosen.map(([label, value]) => `${label}\n${value}`).join('\n\n');
      get('share-preview').value = message ? `Next Chapter update for my ${get('audience').value.toLowerCase()}\n\n${message}` : '';
      get('copy-share').disabled = get('download-share').disabled = !message;
      get('share-feedback').textContent = '';
    };
    for (const [index, [label]] of selections.entries()) {
      const wrapper = node('label', '');
      const input = Object.assign(document.createElement('input'), { type: 'checkbox', value: String(index) });
      input.onchange = update;
      wrapper.append(input, document.createTextNode(` ${label}`));
      items.append(wrapper);
    }
    get('audience').selectedIndex = 0;
    get('audience').onchange = update;
    update();
    get('share').showModal();
  }

  function clearShare() {
    sharingPrivate = false;
    if (get('share').open) get('share').close();
    get('share-preview').value = '';
    get('audience').onchange = null;
    while (get('share-items').children.length > 1) get('share-items').lastElementChild.remove();
  }

  get('close-share').onclick = clearShare;
  get('share').addEventListener('close', () => {
    if (!get('share').open) clearShare();
  });
  get('copy-share').onclick = async () => {
    try {
      await navigator.clipboard.writeText(get('share-preview').value);
      get('share-feedback').textContent = 'Copied. Paste it into a message to your recipient.';
    } catch {
      get('share-preview').select();
      get('share-feedback').textContent = 'Copy the selected preview, or download it.';
    }
  };
  get('download-share').onclick = () => {
    const url = URL.createObjectURL(new Blob([get('share-preview').value], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'next-chapter-update.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  get('vault').addEventListener('input', () => { if (passphrase) activity(); });
  window.addEventListener('storage', (event) => {
    if (event.key === vaultKey || event.key === null) {
      lock();
      if (!get('vault').hidden) renderVault();
    }
  });
  window.addEventListener('pagehide', lock);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !get('vault').hidden) renderVault();
  });
  return { openShare, lock, viewIds, go, planSettings };
}
