import { everydayTools } from './everyday-tools.js';
import { topicRoutes, viewRoutes, valuesExerciseRoute } from './routes.js';
import { answerSelection } from './answer-selection.js';
import { profile } from './discovery-content.js';
import { personalityEvidence } from './deeper.js';
import { mirrorSources, practiceFor } from './growth.js';
import { taskList } from './journey-content.js';
import { meanings } from './value-cards.js';

const sections = [
  ['personality', 'Personality', '◈', ['When do these preferences show up most clearly?', 'When do you work differently?', 'What strength could you use more deliberately?', 'Who could give you a concrete example of how you show up?', 'What preference would you like to stretch?']],
  ['values', 'Values', '◆', ['When did you live one of these values recently?', 'Which value gets least attention right now?', 'Where do two values compete?', 'What is one decision you could make differently?', 'What would someone see you doing if you lived this value?']],
  ['goals', 'Goals', '◎', ['Why does this goal matter now?', 'Which part is within your control?', 'What would count as progress this week?', 'What are you willing to set aside?', 'When would you revise this goal?']],
  ['activities', 'Activities', '▤', ['Which activity can you start with the time you have?', 'What would make it easy to repeat?', 'What did you learn from the last attempt?', 'Which barrier can you change?', 'What would you try differently next time?']],
  ['skills', 'Skills', '✦', ['When have you used this skill successfully?', 'Which part needs deliberate practice?', 'What can you do independently today?', 'What feedback would help most?', 'How will you tell whether you improved?']],
  ['stretch', 'Stretch assignments', '⬡', ['What challenge feels useful and manageable?', 'What could make it too demanding?', 'Who could give feedback in a real situation?', 'What part of the outcome can you influence?', 'What would make the challenge worthwhile even if it goes differently than planned?']],
  ['learning', 'Education & key learnings', '▥', ['What question are you trying to answer?', 'What would make a resource worth your time?', 'How could you apply one idea this week?', 'What did you learn from doing rather than reading?', 'What will you stop or continue after testing it?']],
  ['reflection', 'Reflections & insights', '◐', ['What stands out across what you have shared?', 'What do you already understand well?', 'Where might you be holding back, if anywhere?', 'What can you control or influence this week?', 'What do you want to investigate before deciding?']]
];

const hubIcons = {
  personality: 'fingerprint', values: 'diamond', goals: 'flag', activities: 'checklist',
  skills: 'auto_awesome', stretch: 'rocket_launch', learning: 'menu_book', reflection: 'insights'
};

const validPairs = (pairs) => pairs.filter(([, value]) => typeof value === 'string' && value.trim());

export function hubEvidence(state, section) {
  const d = state.discovery || {};
  const r = state.roadmap || {};
  const confirmed = state.growth?.confirmed || {};
  const targets = state.planTargets || [];
  const selected = state.planValues?.selected || d.valueRounds?.[2] || [];
  const valueMeanings = state.planValues?.meanings || d.valueMeaning || {};
  const skills = [...new Set([r.skill, confirmed.skill, ...targets.map((target) => target.skill)].filter(Boolean))];
  const tasks = state.plan ? taskList(state.plan, targets) : [];
  const reviews = state.reviews || [];
  const common = [['Current priority', confirmed.priority], ['What I want to try', confirmed.tryNext]];
  const evidence = {
    personality: [
      ...personalityEvidence(d), ...profile(d.traits || {}).filter((axis) => axis.count).map((axis) => [axis.poles.join(' / '), axis.label]),
      ['Accepted assessment summary', state.assessment?.summary], ['My interpretation', state.journey?.personalityNote], ['Strengths I named', [...(d.strengths || []), d.otherStrength].filter(Boolean).join(', ')],
      ['Strength in action', d.strengthExample], ['Strengths I confirmed', confirmed.strength], ['Personality activity reflection', state.planHub?.personality?.personalityActivity]
    ],
    values: [...selected.map((value) => [value, valueMeanings[value] || meanings[value]?.[0]]), ['Value trade-off', d.tradeoff], ['Values in my words', confirmed.values]],
    goals: [['90-day goal', state.plan?.goal], ['Weekly action', state.plan?.action], ['Evidence to track', state.plan?.tracker], ['Goal in my own words', confirmed.goal],
      ...targets.flatMap((target) => [[target.area, target.goal], ['Why this matters', target.why], ['Evidence of progress', target.proof]])],
    activities: [...tasks.map((task) => [`${task.timing} · ${task.title}`, task.detail]),
      ...tasks.flatMap((task) => [[`${task.title} · What I learned`, state.activityNotes?.[task.id]], [`${task.title} · Status`, state.completedActivities?.[task.id] ? 'Completed' : '']])],
    skills: [...skills.map((skill) => ['Skill to develop', skill]), ['Practice', r.practice],
      ['Baseline self-rating', r.baseline], ['Target self-rating', r.target],
      ...(state.growth?.assessments || []).flatMap((entry) => [[`${entry.skill} · Evidence`, entry.evidence], ['Rating before', entry.before], ['Rating after', entry.after]])],
    stretch: [['Experience I want to gain', r.experience], ...tasks.filter((task) => task.title === 'Try it in a real situation').map((task) => [task.goal, task.detail])],
    learning: [...skills.map((skill) => ['Learning focus', skill]), ...Object.values(state.activityNotes || {}).map((note) => ['What I learned in practice', note]), ['Evidence I’m looking for', r.evidence]],
    reflection: [['Accepted discovery synthesis', state.journey?.final?.summary], ['My clarification', state.journey?.final?.clarification],
      ['Overview I accepted', confirmed.acceptedReflection?.overview], ...reviews.slice(-4).flatMap((review) => [['Recent check-in', review.notes], ['What I observed', review.evidence]]),
      ...mirrorSources(state).flatMap(([, entries]) => entries)]
  };
  return { entries: validPairs([...common, ...(evidence[section] || []), ...Object.entries(state.planHub?.[section]?.responses || {}), ['My values exercise', state.planHub?.[section]?.tradeoff]]), selected, skills };
}

export function planHub({ host, read, save, node, button, notify, activities, accomplishments, openPage, openAccomplishments, openLibrary, addPractice, assessment }) {
  function pageLink(label, path, className) {
    const link = node('a', label, className);
    link.href = path;
    link.onclick = (event) => {
      if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openPage(path);
    };
    return link;
  }
  function renderHub() {
    const intro = node('div', '', 'section-intro topic-intro topic-plan');
    const heading = node('h1', 'Your personal operating system');
    heading.tabIndex = -1;
    intro.append(heading, node('p', 'Choose an area to explore, practice, or reflect on.'));
    const nav = node('nav', '', 'hub-nav');
    nav.setAttribute('aria-label', 'Plan sections');
    const brain = node('div', '', 'hub-brain');
    brain.append(node('span', 'psychology', 'hub-symbol'));
    brain.setAttribute('aria-hidden', 'true');
    nav.append(brain);
    for (const [id, name] of sections) {
      const control = pageLink('', topicRoutes[id], `hub-link topic-${id}`);
      const icon = node('span', hubIcons[id], 'hub-symbol');
      icon.setAttribute('aria-hidden', 'true');
      control.append(icon, node('span', name, 'hub-label'));
      nav.append(control);
    }
    const achievements = node('article', '', 'hub-panel topic-accomplishments');
    achievements.append(node('h2', 'Accomplishments'), accomplishments(),
      pageLink('Open accomplishments', viewRoutes.accomplishments, 'topic-page-link'));
    host.replaceChildren(intro, nav, achievements);
  }

  function render(key) {
    if (!key) return renderHub();
    const state = read();
    const [, title, graphic, defaults] = sections.find(([id]) => id === key);
    const { entries, selected, skills } = hubEvidence(state, key);
    const saved = state.planHub?.[key] || {};
    const back = pageLink('Plan hub', viewRoutes.output, 'topic-page-link');
    const panel = node('article', '', `hub-panel hub-feature topic-${key}`);
    const sectionTitle = node('h1', title);
    sectionTitle.tabIndex = -1;
    const symbol = node('span', graphic, 'hub-icon');
    symbol.setAttribute('aria-hidden', 'true');
    sectionTitle.prepend(symbol);
    const banner = node('div', '', 'hub-topic-banner');
    const art = node('span', graphic, 'hub-topic-art');
    art.setAttribute('aria-hidden', 'true');
    banner.append(sectionTitle, art);
    if (key === 'personality') {
      const portrait = node('img', '', 'personality-portrait');
      portrait.src = '/personality-watercolor.webp';
      portrait.alt = 'Two overlapping faces painted in indigo and blush watercolor';
      portrait.width = 1275;
      portrait.height = 850;
      const heading = node('div', '', 'personality-heading');
      heading.append(sectionTitle, node('p', 'Notice how you think, relate, and show up in different situations.'));
      banner.replaceChildren(portrait, heading);
      banner.classList.add('personality-hero');
    }
    panel.append(banner);
    if (key === 'personality') {
      const shortcuts = node('nav', '', 'personality-shortcuts');
      shortcuts.setAttribute('aria-label', 'Personality sections');
      for (const [id, label, icon] of [
        ['questions', 'Questions', '◈'], ['reflections', 'Reflections', '◐'],
        ['activities', 'Activities', '▤'], ['proud', 'Things I’m Proud Of', '✦']
      ]) {
        const shortcut = button(label, () => {
          const heading = host.querySelector(`#personality-${id}`);
          heading.focus({ preventScroll: true });
          heading.scrollIntoView({ block: 'start' });
        }, `quiet personality-shortcut personality-${id}`);
        const symbol = node('span', icon);
        symbol.setAttribute('aria-hidden', 'true');
        shortcut.prepend(symbol);
        shortcuts.append(shortcut);
      }
      panel.append(shortcuts, assessment());
    }
    if (key === 'reflection') {
      panel.append(node('p', 'Use your answers to decide what you can control, what you can influence, and what you may need to leave open.'),
        everydayTools({ guide: 'feeling', node, button }));
    }
    if (key === 'skills') panel.append(everydayTools({ guide: 'skills', node, button, addPractice: state.plan ? addPractice : undefined }));
    if (key === 'learning') panel.append(everydayTools({ guide: 'classes', node, button }));
    if (key === 'values') panel.append(pageLink(selected.length === 5 ? 'Revisit the values exercise' : 'Start the values exercise', valuesExerciseRoute, 'topic-page-link'));
    if (key === 'values' && selected.length === 5) {
      const badges = node('ul', '', 'value-badges');
      for (const value of selected) badges.append(node('li', value));
      panel.append(badges);
    }
    if (key === 'activities' && state.plan) panel.append(activities());
    if (key === 'learning' || key === 'personality') {
      panel.append(button('Explore the library', openLibrary, 'quiet'));
    }
    if (key === 'learning') {
      const resources = [...new Map(skills.flatMap((skill) => practiceFor(skill)?.resources || []).map(([name, url]) => [url, name]))];
      if (resources.length) {
        panel.append(node('h3', 'Free learning'));
        for (const [url, name] of resources) {
          const link = node('a', name);
          link.href = url;
          const item = node('p', '');
          item.append(link);
          panel.append(item);
        }
      }
    }
    if (entries.length) {
      const source = node('details', '', 'follow-up');
      source.append(node('summary', 'What you’ve recorded'));
      for (const [label, value] of entries) source.append(node('p', label), node('blockquote', value, 'entry'));
      panel.append(source);
    } else panel.append(node('p', 'As you complete Discover or record plan activities, your answers will appear here.'));
    function persist(patch) {
      const current = read();
      return save({ ...current, planHub: { ...current.planHub, [key]: { ...current.planHub?.[key], ...patch } } });
    }

    if (key === 'values' && selected.length >= 2) {
      const exercise = node('details', '', 'follow-up');
      exercise.append(node('summary', 'Try a values trade-off'),
        node('p', `Imagine you have one free hour and can honor either ${selected[0]} or ${selected[1]}. Which would you choose today, and what would you do?`));
      const note = node('textarea', '');
      note.setAttribute('aria-label', 'Your values trade-off');
      note.value = saved.tradeoff || '';
      exercise.append(note, button('Save my choice', () => { if (persist({ tradeoff: note.value.trim() })) notify('Choice saved.'); }));
      panel.append(exercise);
    }

    function showAccepted() {
      const approved = saved.accepted;
      if (!approved) return;
      panel.append(node('h3', 'Your accepted overview'), node('p', approved.overview, 'entry'));
      if (approved.insights.length) {
        const list = node('ul', '');
        for (const item of approved.insights) list.append(node('li', item));
        panel.append(list);
      }
    }
    if (key === 'personality') {
      const reflections = node('h2', 'Reflections');
      reflections.id = 'personality-reflections';
      reflections.tabIndex = -1;
      panel.append(reflections, node('p', 'Where do these preferences feel true to you? Where do they depend on the situation?'),
        pageLink('Explore reflection questions', viewRoutes.discover + '?topic=reflection', 'topic-page-link'));
    }
    showAccepted();
    if (entries.length) panel.append(aiDraft({ title, entries, node, button, accept(draft) {
      if (persist({ accepted: draft })) { render(key); host.querySelector('h1').focus(); notify('Overview accepted.'); }
    } }));

    const prompts = saved.accepted?.questions?.length === 5 ? saved.accepted.questions : defaults;
    const form = node('form', '', 'hub-questions');
    const questionTitle = node(key === 'personality' ? 'h2' : 'h3', key === 'personality' ? 'Questions' : 'Five questions to explore');
    if (key === 'personality') {
      questionTitle.id = 'personality-questions';
      questionTitle.tabIndex = -1;
      form.append(questionTitle, pageLink('Choose your questionnaire', viewRoutes.journey, 'topic-page-link'));
    } else form.append(questionTitle);
    const responses = prompts.map((question) => {
      const label = node('label', question);
      const input = node('textarea', '');
      input.value = saved.responses?.[question] || '';
      label.append(input);
      form.append(label);
      return [question, input];
    });
    form.append(node('button', 'Save my answers'));
    form.onsubmit = (event) => {
      event.preventDefault();
      const previous = read().planHub?.[key]?.responses || {};
      const newAnswers = Object.fromEntries(responses.map(([question, input]) => [question, input.value.trim()]));
      if (persist({ responses: { ...previous, ...newAnswers } })) notify('Answers saved.');
    };
    panel.append(form);
    if (key === 'personality') {
      const activityTitle = node('h2', 'Activities');
      activityTitle.id = 'personality-activities';
      activityTitle.tabIndex = -1;
      panel.append(activityTitle, node('p', 'Pick one strength you use naturally. Try using it deliberately in a new situation, then write down what changed.'));
      const label = node('label', 'What did you try, and what did you notice?');
      const activity = node('textarea', '');
      activity.value = saved.personalityActivity || '';
      label.append(activity);
      panel.append(label, button('Save activity reflection', () => {
        if (persist({ personalityActivity: activity.value.trim() })) notify('Activity reflection saved.');
      }), pageLink('See all plan activities', topicRoutes.activities, 'topic-page-link'));
      const proud = node('h2', 'Things I’m Proud Of');
      proud.id = 'personality-proud';
      proud.tabIndex = -1;
      panel.append(proud, accomplishments(), button('Add an accomplishment', openAccomplishments, 'quiet'));
    }
    host.replaceChildren(back, panel);
  }
  return { render };
}

function aiDraft({ title, entries, node, button, accept }) {
  const box = node('details', '', 'follow-up hub-ai');
  box.append(node('summary', 'Draft an AI overview'), node('p', 'If you generate an overview, only the answers you select will be sent to OpenAI. Privacy Vault entries are excluded.'));
  const sources = answerSelection([['Answers for this section', entries]], node);
  const status = node('p', '');
  status.setAttribute('role', 'status');
  const draftView = node('div', '');
  const generate = button('Generate AI overview', async () => {
    const selected = sources.selected();
    if (!selected.length) { status.textContent = 'Select at least one answer.'; return; }
    const body = JSON.stringify({ mode: 'plan-output', input: JSON.stringify({ section: title, entries: selected }) });
    if (new TextEncoder().encode(body).length > 48000) {
      status.textContent = 'These answers exceed the limit for one overview. Uncheck a few and try again.';
      return;
    }
    generate.disabled = true;
    draftView.replaceChildren();
    status.textContent = 'Preparing a draft…';
    try {
      const response = await fetch('/api/reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body });
      const draft = await response.json();
      if (!response.ok) throw new Error(draft.error);
      if (draft.questions.length !== 5) throw new Error('The draft did not include five questions. Try generating it again.');
      status.textContent = 'Review what the AI understood before accepting.';
      draftView.append(node('h3', 'Overview draft'), node('p', draft.overview, 'entry'));
      for (const [label, items] of [['Key insights', draft.insights], ['Five follow-up questions', draft.questions]]) {
        const list = node('ul', '');
        for (const item of items) list.append(node('li', item));
        draftView.append(node('h3', label), list);
      }
      const controls = node('div', '', 'actions');
      const edit = node('form', '');
      edit.hidden = true;
      const field = (label, value) => {
        const wrapper = node('label', label);
        const input = node('textarea', '');
        input.value = value;
        wrapper.append(input);
        edit.append(wrapper);
        return input;
      };
      const overview = field('Overview', draft.overview);
      const insights = field('Key insights · one per line', draft.insights.join('\n'));
      const questions = field('Five questions · one per line', draft.questions.join('\n'));
      edit.append(node('button', 'Accept edited overview'));
      const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);
      edit.onsubmit = (event) => {
        event.preventDefault();
        const prompts = lines(questions.value);
        if (!overview.value.trim() || prompts.length !== 5) {
          status.textContent = 'Enter an overview and exactly five questions.';
          return;
        }
        accept({ overview: overview.value.trim(), insights: lines(insights.value), questions: prompts });
      };
      controls.append(button('Accept as written', () => accept({ overview: draft.overview, insights: draft.insights, questions: draft.questions })),
        button('Edit before accepting', () => { edit.hidden = false; overview.focus(); }, 'quiet'));
      draftView.append(controls, edit);
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'AI is unavailable right now.' : error.message;
    } finally {
      generate.disabled = false;
    }
  }, 'quiet');
  box.append(sources.wrapper, generate, status, draftView);
  return box;
}
