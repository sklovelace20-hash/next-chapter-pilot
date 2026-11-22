import { bucketBingo } from './bucket-bingo.js';
import { clearReports, assessmentPanel, requestInsight } from './assessment.js';
import { pageAt, viewRoutes } from './routes.js';
import { library } from './library.js';
import { accomplishments } from './accomplishments.js';
import { planHub } from './plan-hub.js';
import { journey, planActivities } from './journey.js';
import { draftPlan, modes } from './planner.js';
import { workspace, nextCheckIn, vaultKey } from './roadmap.js';
import { deeperJourney, personalityEvidence } from './deeper.js';
import { practiceFor, profileFields } from './growth.js';
import { funPage } from './fun.js';
import { welcomeFlow } from './welcome.js';
import { discovery } from './discovery.js';

const get = (id) => document.getElementById(id);
const key = 'next-chapter-pilot-v1';
const blank = () => ({ answers: {}, plan: null, started: null, reviews: [] });
let state = blank();
let step = 0;
let editingJourneyPlan = false;
let noticeTimer;

function notify(message) {
  clearTimeout(noticeTimer);
  get('notice').textContent = message;
  noticeTimer = setTimeout(() => { get('notice').textContent = ''; }, 5500);
}

try {
  const saved = localStorage.getItem(key);
  if (saved) state = JSON.parse(saved);
} catch {
  notify('Saved data could not be read in this browser.');
}

function save(next) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
    return true;
  } catch {
    notify('This browser could not save your changes. Check that browser storage is enabled.');
    return false;
  }
}

function show(id, focus, path = viewRoutes[id] || '/') {
  if (id === 'fun') refreshBucket();
  if (window.location.pathname + window.location.search !== path) window.history.pushState(null, '', path);
  for (const page of ['home', 'welcome', 'setup', 'editor', 'journey', 'fun', ...tools.viewIds]) get(page).hidden = page !== id;
  get('workspace-nav').hidden = id !== 'fun' && !tools.viewIds.includes(id);
  for (const tab of get('workspace-nav').querySelectorAll('button')) {
    tab.hidden = !state.plan && !['dashboard', 'discover', 'output', 'roadmap', 'library', 'accomplishments', 'fun'].includes(tab.dataset.view);
    if (tab.dataset.view === 'dashboard') tab.textContent = state.plan ? 'Today' : 'Home';
  }
  for (const tab of get('workspace-nav').querySelectorAll('button')) {
    if (tab.dataset.view === id) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
  if (id !== 'welcome') welcome.reset();
  if (id === 'home') {
    welcome.home();
    const checkIn = get('home-check-in');
    checkIn.hidden = path !== '/?explore=1';
    checkIn.replaceChildren(...(checkIn.hidden ? [] : [deeper.today()]));
  }
  const title = get(id).querySelector('h1')?.textContent.trim();
  document.title = title && id !== 'home' ? `${title} · Next Chapter` : 'Next Chapter';
  if (focus) get(focus).focus();
}

const questions = [
  ['What season are you in?', [['season', 'What’s changing, and what deserves your attention now?']]],
  ['What do you want to live by?', [['value', 'Name a value you want to live by.'], ['example', 'When did you last act on it?'], ['friction', 'Where does your week make it hard?']]],
  ['What would progress look like in 90 days?', [['result', 'What could you point to and say, “That changed”?']]],
  ['What can you realistically give it?', [['time', 'How much time can you give this each week?'], ['protect', 'What are you protecting?'], ['firstAction', 'What small action, experiment, or time for reflection would you choose this week?']]],
  ['How would you like to be challenged?', [['mode', 'Choose your feedback style.']]]
];

const setupFollowUps = [
  ['whyPriority', 'Why does that deserve your attention now? What would change if you gave it room?'],
  ['valueConflict', 'What is the cost of living by that value when something else competes with it?'],
  ['changeMeaning', 'Why would that result matter? What would you be able to do or feel that you can’t today?'],
  ['space', 'What could wait, and what boundary would give you room to work on this?'],
  ['supportStyle', 'When you feel stuck, what kind of question or support actually helps?']
];

function setup() {
  const [question, fields] = questions[step];
  get('step').textContent = `QUESTION ${step + 1} OF ${questions.length}`;
  get('progress').value = step + 1;
  get('progress').setAttribute('aria-label', 'Setup progress');
  get('question').textContent = question;
  get('fields').replaceChildren();
  for (const [name, title] of fields) {
    const label = document.createElement('label');
    label.textContent = title;
    const input = document.createElement(name === 'mode' ? 'select' : 'textarea');
    if (name === 'mode') {
      input.add(new Option('Choose a style', ''));
      for (const mode of modes) input.add(new Option(mode, mode));
    }
    input.name = name;
    input.required = true;
    input.value = state.answers[name] || '';
    label.append(input);
    get('fields').append(label);
  }
  const [followKey, followQuestion] = setupFollowUps[step];
  const detail = node('details', '', 'follow-up');
  const label = node('label', followQuestion);
  const reply = node('textarea', '');
  reply.name = followKey;
  reply.value = state.answers[followKey] || '';
  detail.open = Boolean(reply.value);
  label.append(reply);
  detail.append(node('summary', 'Go deeper'), label);
  get('fields').append(detail);
  get('next').textContent = step === questions.length - 1 ? 'Draft my plan' : 'Continue';
  show('setup', 'question');
}

function edit(plan, fromJourney = false) {
  editingJourneyPlan = fromJourney;
  for (const [key, value] of Object.entries(plan)) get('plan').elements.namedItem(key).value = value;
  const context = get('plan-context');
  const basis = profileFields.flatMap(([key, label]) => {
    const value = state.growth?.confirmed?.[key];
    return value ? [[`In your words · ${label}`, value]] : [];
  });
  if (editingJourneyPlan) {
    const guided = state.journey || {};
    if (guided.final?.summary) basis.push(['Your accepted discovery summary', guided.final.summary]);
    for (const target of guided.targets || []) {
      basis.push([target.area, target.goal]);
      if (target.why) basis.push(['Why it matters', target.why]);
      if (target.proof) basis.push(['Evidence of progress', target.proof]);
    }
  }
  if (state.assessment?.summary) basis.push(['Accepted assessment summary', state.assessment.summary]);
  const latest = Object.values(state.deeper?.weeks || {}).at(-1);
  if (latest) basis.push(['Your last recorded priority', latest]);
  for (const [key, question] of setupFollowUps) if (state.answers[key]) basis.push([question, state.answers[key]]);
  const evidence = personalityEvidence(state.discovery);
  if (state.discovery?.strengthExample) basis.push(['Strength in action', state.discovery.strengthExample]);
  basis.push(...evidence);
  context.hidden = !basis.length;
  context.replaceChildren(node('summary', 'Review your answers as you plan'));
  for (const [question, answer] of basis) context.append(node('p', question), node('blockquote', answer, 'entry'));
  if (basis.length) context.append(node('p', 'Which of these still fits? What would you change in the plan to reflect it?'));
  show('editor', 'editor-title');
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(label, handler, className) {
  const element = node('button', label, className);
  element.addEventListener('click', handler);
  return element;
}

const deeper = deeperJourney({ read: () => state, save, node, button, notify });

function applyPractice(title, practice, section = 'practice', replaceSkill = false) {
  const roadmap = state.roadmap || {};
  if (roadmap[section] && roadmap[section] !== practice &&
      !window.confirm('Replace the current roadmap activity with this one?')) return;
  const skill = replaceSkill ? title : roadmap.skill || (section === 'practice' ? title : '');
  if (save({ ...state, roadmap: { ...roadmap, skill, [section]: practice } })) {
    tools.go('roadmap');
    notify('Added to your roadmap.');
  }
}

const discover = discovery({ get, node, button, read: () => state, save, notify, applyPractice });
const showAssessment = () => assessmentPanel({ read: () => state, save, node, button, notify });
const startingPoint = journey({
  host: get('journey'), read: () => state, save, node, button, notify,
  open: () => show('journey'), home: dashboard, planSettings: () => tools.planSettings(), assessment: showAssessment,
  tailorPractice: (target) => requestInsight({ mode: 'plan-tailoring',
    input: JSON.stringify({ target, acceptedAssessment: state.assessment?.summary }) }),
  finish(targets) {
    const first = targets[0];
    edit({
      goal: first.goal,
      action: first.action || practiceFor(first.skill)?.practice || `Choose a small step toward ${first.goal}.`,
      tracker: first.proof || 'Record what you tried and one observable sign of change.',
      prompt: 'What did you try, what did it teach you, and what will you adjust?'
    }, true);
  }
});

const resourceLibrary = library({ host: get('library'), node, button });
const achievements = accomplishments({ host: get('accomplishments'), read: () => state, save, node, button, notify });
function openPage(path) {
  const { view, section, path: canonical } = pageAt(path);
  if (view === 'fun') return show('fun', 'fun-title', canonical);
  if (view === 'welcome') return welcome.render();
  if (canonical === '/?explore=1') return show('home', 'explore-title', canonical);
  if (view === 'journey') return startingPoint.render();
  if ((view === 'vault') && !state.plan) return dashboard();
  tools.go(view, { section, path: canonical });
}

const output = planHub({ host: get('output'), read: () => state, save, node, button, notify,
  activities: () => planActivities({ read: () => state, node, save }),
  accomplishments: () => achievements.listing({ all: true }),
  openPage, openAccomplishments: () => tools.go('accomplishments'), openLibrary: () => tools.go('library'),
  planSettings: () => tools.planSettings(), assessment: showAssessment, addPractice: (title, practice) => applyPractice(title, practice, 'practice', true) });
const tools = workspace({ get, show, read: () => state, save, node, button, notify, dashboard, discover: (section) => section ? discover.open(section) : discover.render(), beginVisit: deeper.reset, output: output.render, library: resourceLibrary.render, accomplishments: achievements.render });

function dashboard() {
  if (!state.plan) return show('home', 'home-title');
  const { plan, started, answers, reviews } = state;
  const end = new Date(started);
  end.setDate(end.getDate() + 90);
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  const hero = node('div', '', 'hero');
  const heading = node('h1', 'Your next chapter');
  heading.id = 'dashboard-title';
  heading.tabIndex = -1;
  const actions = node('div', '', 'actions');
  actions.append(button('Log check-in', () => {
    get('review-form').reset();
    get('reflection').textContent = state.plan.prompt;
    get('evidence-prompt').textContent = state.roadmap?.evidence
      ? `Look for this evidence: ${state.roadmap.evidence}`
      : 'Consider a result, a piece of feedback, or something you can now do.';
    get('skill-check').hidden = !state.roadmap?.skill;
    get('review').showModal();
  }), button('Edit plan', () => edit(state.plan), 'quiet'), button('Explore a starting point', startingPoint.render, 'quiet'), button('Share an update', () => tools.openShare(), 'quiet'));
  hero.append(node('p', answers.mode, 'eyebrow'), heading,
    node('p', `Focus: ${answers.value} · 90-day target: ${date.format(end)}`),
    node('p', `Next check-in: ${date.format(nextCheckIn(state))}`, 'next-check'), actions);
  const cards = node('div', '', 'cards');
  for (const [title, content] of [['90-day goal', plan.goal], ['Weekly action', plan.action], ['What to track', plan.tracker]]) {
    const card = node('article', '');
    card.append(node('h2', title), node('p', content));
    cards.append(card);
  }
  const history = node('article', '');
  history.append(node('h2', 'Check-in history'));
  if (!reviews.length) history.append(node('p', 'Your first check-in will appear here.'));
  for (const review of [...reviews].reverse()) {
    const entry = node('section', '');
    entry.append(node('h3', `${date.format(new Date(review.date))} · ${review.outcome}`),
      node('p', review.action), node('p', review.notes, 'entry'));
    if (review.evidence) entry.append(node('p', `Evidence: ${review.evidence}`, 'entry'));
    if (review.rating) entry.append(node('p', `Skill self-assessment: ${review.rating}/5`));
    if (review.adjustment) entry.append(node('p', `Next adjustment: ${review.adjustment}`, 'entry'));
    history.append(entry);
  }
  get('dashboard').replaceChildren(hero, cards, planActivities({ read: () => state, node, save }), deeper.today(), history);
  show('dashboard', 'dashboard-title');
}

const formValues = (form) => Object.fromEntries(
  [...new FormData(form)].map(([name, value]) => [name, value.trim()])
);
const validate = (form, values, optional = []) => {
  for (const [name, value] of Object.entries(values)) {
    if (!value && !optional.includes(name)) {
      const field = form.elements.namedItem(name);
      field.focus();
      notify('Please add an answer before continuing.');
      return false;
    }
  }
  return true;
};

const welcome = welcomeFlow({ get, node, button, read: () => state, save, show, openPage });
funPage({ get, node });
const refreshBucket = bucketBingo({ get, node, read: () => state, save });
get('fun-nav').onclick = () => openPage('/fun');
get('home-fun').onclick = () => openPage('/fun');
const feedback = get('feedback');
const feedbackMessage = get('feedback-message');
let feedbackPage = '/';

get('open-feedback').onclick = () => {
  feedbackPage = pageAt(window.location.pathname + window.location.search).path;
  feedback.showModal();
};
get('close-feedback').onclick = () => feedback.close();
feedbackMessage.oninput = () => feedbackMessage.setCustomValidity('');
get('feedback-form').onsubmit = (event) => {
  event.preventDefault();
  const message = feedbackMessage.value.trim();
  if (!message) {
    feedbackMessage.setCustomValidity('Tell us a little about what happened.');
    feedbackMessage.reportValidity();
    return;
  }
  const subject = encodeURIComponent('Next Chapter Pilot feedback');
  const body = encodeURIComponent(`Page: ${feedbackPage}\r\n\r\n${message}`);
  window.location.href = `mailto:sklovelace20@gmail.com?subject=${subject}&body=${body}`;
};

get('home-values').onclick = () => openPage('/values/exercise');
get('home-library').onclick = () => tools.go('library');
get('home-accomplishments').onclick = () => tools.go('accomplishments');
get('discover-start').onclick = () => openPage('/personality');
get('start').addEventListener('click', startingPoint.render);
get('back').addEventListener('click', () => {
  if (step === 0) return show('home', 'home-title');
  step -= 1;
  setup();
});
get('questions').addEventListener('submit', (event) => {
  event.preventDefault();
  const values = formValues(event.currentTarget);
  if (!validate(event.currentTarget, values, setupFollowUps.map(([key]) => key))) return;
  if (!save({ ...state, answers: { ...state.answers, ...values } })) return;
  if (step === questions.length - 1) return edit(draftPlan(state.answers));
  step += 1;
  setup();
});
get('cancel-edit').addEventListener('click', () => editingJourneyPlan ? startingPoint.render() : state.plan ? dashboard() : setup());
get('plan').addEventListener('submit', (event) => {
  event.preventDefault();
  const plan = formValues(event.currentTarget);
  if (!validate(event.currentTarget, plan)) return;
  const targets = editingJourneyPlan ? state.journey.targets : state.planTargets;
  const planTargets = targets?.map((target, index) => index ? target : { ...target, goal: plan.goal, action: plan.action, proof: plan.tracker });
  const roadmap = editingJourneyPlan ? { ...state.roadmap, skill: planTargets?.[0]?.skill || '', evidence: plan.tracker, practice: plan.action } : state.roadmap;
  const progress = editingJourneyPlan ? { completedActivities: {}, activityNotes: {}, projectTracker: null } : {};
  if (save({ ...state, ...progress, plan, planTargets, roadmap, started: editingJourneyPlan ? new Date().toISOString() : state.started || new Date().toISOString() })) {
    if (editingJourneyPlan) tools.go('output');
    else dashboard();
    notify('Plan saved.');
  }
});
get('close-review').onclick = () => get('review').close();
get('review-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const values = formValues(event.currentTarget);
  if (!validate(event.currentTarget, values, ['adjustment', 'evidence', 'rating'])) return;
  if (values.apply && !values.adjustment) {
    event.currentTarget.elements.namedItem('adjustment').focus();
    notify('Enter the adjustment you want to use.');
    return;
  }
  const { notes, outcome, adjustment, evidence, rating } = values;
  const review = { date: new Date().toISOString(), action: state.plan.action, notes, outcome, adjustment, evidence, rating: state.roadmap?.skill ? rating : '' };
  const plan = values.apply ? { ...state.plan, action: adjustment } : state.plan;
  if (save({ ...state, plan, reviews: [...state.reviews, review] })) {
    get('review').close();
    dashboard();
    notify('Check-in saved.');
  }
});
get('settings').onclick = () => get('data').showModal();
get('export').onclick = () => {
  let encryptedVault;
  try {
    encryptedVault = JSON.parse(localStorage.getItem(vaultKey));
  } catch {
    notify('This browser could not export the encrypted vault.');
    return;
  }
  const file = new Blob([JSON.stringify({ ...state, encryptedVault }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'next-chapter.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const dataDialog = get('data');
const deletePrompt = get('delete-confirm');
const deleteButton = get('confirm-delete');
const deleteStatus = get('delete-status');
function resetDeletePrompt() {
  deletePrompt.hidden = true;
  get('delete').hidden = false;
  deleteStatus.textContent = '';
}
dataDialog.addEventListener('close', resetDeletePrompt);
get('delete').onclick = () => {
  deletePrompt.hidden = false;
  get('delete').hidden = true;
  get('cancel-delete').focus();
};
get('cancel-delete').onclick = () => {
  resetDeletePrompt();
  get('delete').focus();
};
deleteButton.onclick = async () => {
  deleteButton.disabled = true;
  deleteStatus.textContent = 'Deleting saved data…';
  tools.lock();
  const failed = [];
  for (const [storageKey, label] of [[key, 'dashboard entries'], [vaultKey, 'vault']]) {
    try { localStorage.removeItem(storageKey); }
    catch { failed.push(label); }
  }
  try { await clearReports(); }
  catch { failed.push('attached reports'); }
  deleteButton.disabled = false;
  if (failed.length) {
    if (!failed.includes('dashboard entries')) state = blank();
    deleteStatus.textContent = 'Couldn’t finish deleting ' + failed.join(' and ') + '. Close other pilot tabs and try again.';
    return;
  }
  location.replace('/?deleted=1');
};

const openCurrentPage = () => openPage(window.location.pathname + window.location.search);
window.addEventListener('popstate', openCurrentPage);
const justDeleted = location.search === '?deleted=1';
if (justDeleted) history.replaceState(null, '', '/');
openCurrentPage();
if (justDeleted) notify('Your data was deleted from this browser.');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
