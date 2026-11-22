import { projectTracker } from './project-tracker.js';
import { everydayTools, learningCards } from './everyday-tools.js';
import { topicRoutes, viewRoutes, valuesExerciseRoute } from './routes.js';
import { answerSelection } from './answer-selection.js';
import { profile } from './discovery-content.js';
import { personalityEvidence } from './deeper.js';
import { mirrorSources, practiceFor } from './growth.js';
import { taskList } from './journey-content.js';
import { meanings } from './value-cards.js';

const activityPrompts = [
  'What did you try, and what drew you to it?',
  'How did you feel before, during, and afterward?',
  'What surprised you? Still here, or did you explode into a cloud of vapor?',
  'Was it worth your time? What made it feel that way?',
  'What would you repeat, change, or happily leave behind?'
];

function disclosure(node, text) {
  const box = node('details', '', 'follow-up activity-disclosure');
  box.append(node('summary', text));
  return box;
}

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
    activities: [...(state.activityReflections || []).flatMap((item) => [[item.title, item.note || item.title], ...Object.entries(item.answers).map(([q, a]) => [item.title + " · " + q, a])]), ...tasks.map((task) => [`${task.timing} · ${task.title}`, task.detail]),
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

export function planHub({ host, read, save, node, button, notify, activities, accomplishments, openPage, openAccomplishments, openLibrary, addPractice, assessment, planSettings }) {
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
  const tracker = () => projectTracker({read,save,node,button,notify,aiDraft});
  function renderHub() {
    const intro = node('div', '', 'section-intro topic-intro topic-plan');
    const heading = node('h1', 'Plan Hub');
    heading.tabIndex = -1;
    intro.append(heading, node('p', 'Shape your goal, choose your exercises, and capture what you learn.'));
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
    const tools = node('div', '', 'hub-tools');
    function toolCard(label, icon, content) {
      const box = node('details', '', 'hub-tool');
      const summary = node('summary', '');
      const mark = node('span', icon, 'hub-symbol');
      mark.setAttribute('aria-hidden', 'true');
      summary.append(mark, node('span', label));
      box.append(summary);
      box.ontoggle = () => {
        if (box.open && box.children.length === 1) box.append(content());
      };
      return box;
    }
    const tests = assessment();
    tests.classList.add('hub-tool');
    const testIcon = node('span', hubIcons.personality, 'hub-symbol');
    testIcon.setAttribute('aria-hidden', 'true');
    tests.querySelector('summary').prepend(testIcon);
    const insight = toolCard('Add an insight', hubIcons.reflection, () => {
      const form = node('form', '', 'insight-entry');
      const label = node('label', 'What did you notice or learn?');
      const note = node('textarea');
      note.required = true;
      label.append(note);
      const saved = node('ul');
      for (const value of [...(read().personalInsights || [])].reverse()) saved.append(node('li', value));
      form.append(label, node('button', 'Save insight'), saved,
        pageLink('Explore my insights', '/discover?topic=insights', 'topic-page-link'));
      form.onsubmit = event => {
        event.preventDefault();
        const value = note.value.trim(), state = read();
        if (!value) return note.focus();
        if (save({...state, personalInsights: [...(state.personalInsights || []), value]})) {
          saved.prepend(node('li', value));
          note.value = '';
          notify('Insight saved.');
        }
      };
      return form;
    });
    tools.append(insight, tests, toolCard('My 90-day plan', hubIcons.goals, tracker),
      toolCard('Assessments and check-ins', hubIcons.reflection, planSettings),
      pageLink('View my roadmap', viewRoutes.roadmap, 'topic-page-link'));
    host.replaceChildren(intro, nav, tools);
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
        ['questions', 'Questions', hubIcons.learning], ['reflections', 'Reflections', hubIcons.reflection],
        ['activities', 'Activities', hubIcons.activities], ['proud', 'Things I’m Proud Of', hubIcons.skills]
      ]) {
        const shortcut = button('', () => {
          const heading = host.querySelector(`#personality-${id}`);
          if (heading.parentElement.tagName === 'DETAILS') heading.parentElement.open = true;
          heading.focus({ preventScroll: true });
          heading.scrollIntoView({ block: 'start' });
        }, `hub-link personality-tile personality-${id}`);
        const symbol = node('span', icon, 'hub-symbol');
        symbol.setAttribute('aria-hidden', 'true');
        shortcut.append(symbol, node('span', label, 'hub-label'));
        shortcuts.append(shortcut);
      }
      const rows = node('div', '', 'personality-options');
      const library = node('details', '', 'follow-up');
      library.append(node('summary', 'Explore the library'), pageLink('Browse resources', viewRoutes.library, 'topic-page-link'));
      rows.append(assessment(), library);
      panel.append(shortcuts, rows);
    }
    if (key === 'reflection') {
      panel.append(node('p', 'Use your answers to decide what you can control, what you can influence, and what you may need to leave open.'),
        everydayTools({ guide: 'feeling', node, button }));
    }
    if (key === 'skills') panel.append(everydayTools({ guide: 'skills', node, button, addPractice: state.plan ? addPractice : undefined }));
    if (key === 'learning') panel.append(learningCards({ node, skills, practiceFor }));
    if (key === 'values') panel.append(pageLink(selected.length === 5 ? 'Revisit the values exercise' : 'Start the values exercise', valuesExerciseRoute, 'topic-page-link'));
    if (key === 'values' && selected.length === 5) {
      const badges = node('ul', '', 'value-badges');
      for (const value of selected) badges.append(node('li', value));
      panel.append(badges);
    }
    if (key === 'activities') {
      panel.append(node('p', 'An activity is something you try in real life to see what it’s like for you. Pick something you’re curious about, give it a go, then come back and jot down what happened. Five minutes counts.'));
      const examples = disclosure(node, 'Help me find an activity');
      examples.append(node('p', 'Start with what you want a little more of today.'),
        node('p', 'Connection: Ask someone you miss to take a ten-minute walk.'),
        node('p', 'Play: Put on one song and shoot baskets, dance, or sketch until it ends.'),
        node('p', 'Confidence: Ask one question you’d usually keep to yourself. Notice what happens.'),
        pageLink('Browse the resource library', viewRoutes.library, 'topic-page-link'));
      const write = disclosure(node, 'Reflect on an activity');
      const journal = node('form');
      const input = (parent, prompt, tag) => {
        const label = node('label', prompt);
        const control = node(tag);
        label.append(control);
        parent.append(label);
        return control;
      };
      const name = input(journal, 'Give your activity a name', 'input');
      name.required = true;
      const note = input(journal, 'Tell the story in your own words (optional)', 'textarea');
      const guided = disclosure(node, 'Dig deeper with five questions');
      const answers = activityPrompts.map(q => [q, input(guided, q, 'textarea')]);
      journal.append(guided, node('button', 'Save my reflection'));
      journal.onsubmit = event => {
        event.preventDefault();
        if (!name.value.trim()) { name.focus(); return; }
        const current = read();
        const reflection = {title: name.value.trim(), note: note.value.trim(), answers: Object.fromEntries(answers.map(([q, el]) => [q, el.value.trim()]).filter(([, a]) => a))};
        if (save({...current, activityReflections: [...(current.activityReflections || []), reflection]})) {
          render(key);
          host.querySelector('h1').focus();
          notify('Reflection saved.');
        }
      };
      write.append(node('p', 'Write a quick note or open the questions. When you request an AI overview, you choose which answers it can use.'), journal);
      panel.append(examples, write);
      if (state.plan) {
        const plan = disclosure(node, 'See activities from my plan');
        plan.append(activities());
        panel.append(plan);
      }
    }
    if (key === 'learning') {
      panel.append(pageLink('Dig deeper in the Library', viewRoutes.library, 'topic-page-link'));
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
    const wins = (state.accomplishments || []).map(({ date, title, note }) => [date + " · " + title, note || title]);
    if (entries.length || wins.length) panel.append(aiDraft({ title, entries, wins, node, button, accept(draft) {
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
    const questionsBox = disclosure(node, 'Explore five follow-up questions');
    if (key === 'personality') {
      questionTitle.removeAttribute('id');
      questionsBox.firstChild.id = 'personality-questions';
    }
    questionsBox.append(form);
    if (key !== 'activities' || saved.accepted || Object.keys(saved.responses || {}).length) panel.append(questionsBox);
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
      }), pageLink('Find activity ideas and guided reflections', topicRoutes.activities, 'topic-page-link'));
      const proud = node('h2', 'Things I’m Proud Of');
      proud.id = 'personality-proud';
      proud.tabIndex = -1;
      panel.append(proud, accomplishments(), button('Add to my Smile File', openAccomplishments, 'quiet'));
    }
    host.replaceChildren(back, panel);
  }
  return { render, tracker };
}

function aiDraft({ title, entries, wins, node, button, accept }) {
  const box = node('details', '', 'follow-up hub-ai');
  box.append(node('summary', 'Draft an AI overview'), node('p', 'If you generate an overview, only the answers you select will be sent to OpenAI. Privacy Vault entries are excluded.'));
  const sources = answerSelection([['Answers for this section', entries], ['From my smile file', wins]], node);
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
        if (label === 'Five follow-up questions') {
          const followUp = disclosure(node, 'See five follow-up questions');
          followUp.append(list);
          draftView.append(followUp);
        } else draftView.append(node('h3', label), list);
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
