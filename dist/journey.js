import { valueCards } from './value-cards.js';
import { traits } from './discovery-content.js';
import { personalityResults } from './personality-results.js';
import { areas, rounds, ideaQuestions, deeperIdeaQuestions, taskList } from './journey-content.js';
import { timelineFor } from './project-tracker.js';

const quiz = traits.flatMap((trait, axis) => trait.questions.map((parts, index) => [`${axis}-${index}`, ...parts]));

export function journey({ host, read, save, node, button, notify, open, home, finish, assessment, tailorPractice, refreshPersonality }) {
  const data = () => read().journey || {};
  const change = (patch) => {
    if (save({ ...read(), journey: { ...data(), ...patch } })) render();
  };
  function field(parent, labelText, value = '', required = false, options) {
    const label = node('label', labelText);
    const input = document.createElement(options ? 'select' : 'textarea');
    if (options) {
      input.add(new Option('Choose an answer', ''));
      for (const answer of options) input.add(new Option(answer, answer));
    }
    input.value = value;
    input.required = required;
    label.append(input);
    parent.append(label);
    return input;
  }
  function form(parent, label, submit) {
    const element = document.createElement('form');
    const action = node('button', label);
    element.onsubmit = (event) => { event.preventDefault(); submit(); };
    parent.append(element);
    return { element, action };
  }
  function picks(parent, options, selected, min, max, next) {
    const { element, action } = form(parent, 'Continue', () => {
      const chosen = inputs.filter((input) => input.checked).map((input) => input.value);
      if (chosen.length >= min && chosen.length <= max) next(chosen);
    });
    const grid = node('div', '', 'choice-grid');
    const counter = node('p', '', 'selection-count');
    counter.setAttribute('aria-live', 'polite');
    const update = () => {
      const count = inputs.filter((input) => input.checked).length;
      counter.textContent = `${count} selected`;
      action.disabled = count < min || count > max;
      for (const input of inputs) input.disabled = !input.checked && count >= max;
    };
    const inputs = options.map((option) => {
      const label = node('label', '');
      const input = Object.assign(document.createElement('input'), { type: 'checkbox', value: option, checked: selected.includes(option) });
      input.onchange = update;
      label.append(input, node('span', option));
      grid.append(label);
      return input;
    });
    element.append(counter, grid, action);
    update();
  }
  function launch(path) {
    if (path === 'clear') return change({ path, stage: 'targets', selected: [], targets: [] });
    change({ path, stage: path === 'ideas' ? 'questions' : 'quiz', question: 0, round: 0, reviews: [], followQuestions: [], valueRounds: [], valueReturn: null, selected: [], entries: [], targets: [], final: null });
  }
  function personality(card, state) {
    const [key, question, left, right] = quiz[state.question];
    card.append(node('p', `Question ${state.question + 1} of ${quiz.length}`), node('h2', question));
    for (const [value, label] of [['1', left], ['-1', right], ['0', 'It depends']]) {
      card.append(button(label, () => {
        const traits = { ...read().discovery?.traits, [key]: value };
        const next = state.question + 1;
        const saved = read();
        if (save({ ...saved, discovery: { ...saved.discovery, traits },
          journey: { ...data(), question: next, stage: next === quiz.length ? 'feedback' : 'quiz' } })) render();
      }, 'quiet answer'));
    }
    if (state.question) card.append(button('Previous question', () => change({ question: state.question - 1 }), 'quiet'));
  }
  function feedback(card) {
    card.append(node('h2', 'Your Personality results'), personalityResults(read().discovery?.traits || {}, node, refreshPersonality));
    const { element, action } = form(card, 'Confirm and choose a direction', () => change({ personalityNote: clarification.value.trim(), stage: 'areas' }));
    const clarification = field(element, 'What would you confirm, correct, or add?', data().personalityNote);
    element.append(action);
  }
  function areaPicker(card, state) {
    card.append(node('h2', 'Which parts of life are on your mind?'), node('p', 'Choose any that feel relevant, or continue without choosing.'));
    picks(card, areas, state.interests || [], 0, areas.length, (interests) => change({ interests, stage: 'values' }));
  }
  function valuesRound(card, state) {
    const history = state.valueRounds || [];
    if (history.length === 3) {
      card.append(node('h2', 'What do your five values mean to you?'));
      const { element, action } = form(card, 'Lock in my top five', () => {
        const meanings = Object.fromEntries(fields.map(([value, input]) => [value, input.value.trim()]));
        const saved = read();
        if (save({ ...saved, planValues: { selected: history[2], meanings }, discovery: { ...saved.discovery, valueRounds: history, valueMeaning: meanings },
          journey: { ...state, stage: state.valueReturn || 'questions' } })) render();
      });
      const fields = history[2].map((value) => [value, field(element, `${value} · What does living this value look like?`, read().discovery?.valueMeaning?.[value])]);
      element.append(action);
      card.append(button('Revisit the last round', () => change({ valueRounds: history.slice(0, 2) }), 'quiet'));
      return;
    }
    card.classList.add('values-topic');
    card.append(node('h2', history.length ? 'Choose five to remove' : 'Choose your top 15'),
      node('p', history.length ? 'Uncheck a selected card to make room for a different choice.' : 'Choose the values you most want your decisions to reflect.'));
    card.append(valueCards({ history, node, onSubmit: (next) => change({ valueRounds: [...history, next] }) }));
    if (history.length) card.append(button('Previous round', () => change({ valueRounds: history.slice(0, -1) }), 'quiet'));
  }
  function questionnaire(card, state) {
    const round = state.round || 0;
    const ideas = state.path === 'ideas';
    const follow = state.followQuestions?.length === 10 ? state.followQuestions : null;
    const prompts = ideas ? (round ? follow || deeperIdeaQuestions : ideaQuestions) : follow || rounds[round].slice(1);
    card.append(node('h2', ideas ? (round ? 'Dig deeper into your idea' : 'What do you think you want?') : rounds[round][0]));
    if (ideas) card.append(node('p', round ? 'Questions 6–15 · Reasons, assumptions, and a first experiment' : 'Questions 1–5 · What you want to explore'));
    if (ideas && round && state.reviews?.[0]?.summary) {
      const context = node('details', '', 'follow-up');
      context.append(node('summary', 'Your accepted starting summary'), node('blockquote', state.reviews[0].summary, 'entry'));
      card.append(context);
    }
    if (!ideas) card.append(node('p', round < 5 ? `Round ${round + 1} of 5` : `Optional round ${round - 4} of 2`));
    card.append(node('p', 'Answer what feels useful. You can leave individual questions blank.'));
    const { element, action } = form(card, 'Review this round', () => {
      const entries = fields.map(([question, input]) => [question, input.value.trim()]).filter(([, value]) => value);
      if (!entries.length) return notify('Add at least one answer before reviewing.');
      change({ stage: 'review', entries });
    });
    const fields = prompts.map((question) => [question, field(element, question, Object.fromEntries(state.entries || [])[question])]);
    if (!ideas) for (const [question, options] of [
      ['What would help most right now?', ['Clarity', 'Support', 'A skill to practice', 'A small experiment', 'Time or space', 'Still unsure']],
      ['True or false: I can name what I want to change in one sentence.', ['True', 'False', 'Not sure']]
    ]) fields.push([question, field(element, question, Object.fromEntries(state.entries || [])[question], false, options)]);
    let current = 0;
    const navigation = node('div', '', 'actions');
    const previous = button('Previous question', () => display(current - 1), 'quiet');
    const more = button('Dig deeper', () => display(current + 1), 'quiet');
    previous.type = more.type = 'button';
    navigation.append(previous, more);
    function display(index, focus = true) {
      current = index;
      fields.forEach(([, input], position) => { input.closest('label').hidden = position !== current; });
      previous.hidden = current === 0;
      more.hidden = current === fields.length - 1;
      if (focus) fields[current][1].focus();
    }
    display(0, false);
    element.append(navigation, action);
  }

  function localSummary(state, final) {
    const selected = final ? state.reviews.map((review) => review.summary).filter(Boolean) : state.entries.map(([question, answer]) => `${question}\n${answer}`);
    return final ? [
      'What stands out across your answers?', 'Where, if anywhere, do you notice yourself holding back?',
      'What do you feel you understand well?', 'Which question still needs another example or a closer look?', '',
      ...selected.map((summary, index) => `Round ${index + 1}\n${summary}`)
    ].join('\n') : selected.join('\n\n');
  }
  function review(card, state, final) {
    const heading = final ? 'What stands out across your answers' : 'Review what you shared';
    card.append(node('h2', heading), node('p', 'Does this fit? Accept the summary as written or edit it in your own words.'));
    const initial = localSummary(state, final);
    let summary = initial;
    let follow = [];
    const openingIdeas = !final && state.path === 'ideas' && state.round === 0;
    const preview = node('blockquote', summary, 'entry');
    const label = node('p', 'Answer recap');
    const status = node('p', '');
    status.setAttribute('role', 'status');
    const editor = field(card, 'Edit the summary', summary);
    editor.closest('label').hidden = true;
    const clarification = field(card, 'What would you clarify, or what question should come next?', state.clarification);
    const check = field(card, 'True or false: this captures what I meant.', '', false, ['True', 'False', 'Not sure']);
    const accept = (edited) => {
      if (check.value === 'False' && !edited) {
        editor.closest('label').hidden = false;
        editor.focus();
        return notify('Edit the summary to reflect what you meant.');
      }
      const accepted = (edited ? editor.value : summary).trim();
      if (!accepted) return notify('Write a summary before continuing.');
      const next = { summary: accepted, clarification: clarification.value.trim(), check: check.value };
      if (final) return change({ final: next, stage: 'afterSynthesis' });
      const reviews = [...(state.reviews || []), { ...next, entries: state.entries }];
      const complete = state.path === 'ideas' ? state.round >= 1 : state.round === 4 || state.round === 6;
      change({ reviews, round: state.round + 1, entries: [], followQuestions: follow,
        stage: complete || state.round === 5 ? 'finalReview' : 'questions' });
    };
    editor.closest('label').before(label, preview);
    const controls = node('div', '', 'actions');
    const acceptButton = button('Accept as written', () => accept(false));
    const saveEditButton = button('Save edited summary', () => accept(true));
    saveEditButton.hidden = true;
    const editButton = button('Edit before accepting', () => {
      editor.closest('label').hidden = false;
      saveEditButton.hidden = false;
      editor.focus();
    }, 'quiet');
    controls.append(acceptButton, editButton, saveEditButton);
    const skip = button('Skip AI draft', () => {
      summary = initial;
      follow = [];
      preview.textContent = editor.value = initial;
      label.textContent = 'Answer recap';
      editor.closest('label').hidden = saveEditButton.hidden = skip.hidden = true;
      ai.focus();
    }, 'quiet');
    skip.hidden = true;
    controls.append(skip);
    const ai = button(openingIdeas ? 'Generate a summary and tailor the next 10 questions' : 'Generate AI summary', async () => {
      ai.disabled = true;
      acceptButton.disabled = true;
      saveEditButton.disabled = true;
      status.textContent = 'Reading your answers…';
      try {
        const context = final
          ? { reviews: state.reviews.map(({ summary, clarification }) => ({ summary, clarification })), values: state.valueRounds?.[2], interests: state.interests, personalityNote: state.personalityNote }
          : { entries: state.entries, prior: state.reviews?.slice(-2).map(({ summary, clarification }) => ({ summary, clarification })), interests: state.interests };
        const assessmentSummary = read().assessment?.summary;
        if (assessmentSummary) context.acceptedAssessment = assessmentSummary;
        const response = await fetch('/api/reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: final ? 'journey-final' : 'journey-round', input: JSON.stringify(context) }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        summary = [result.overview, ...result.insights].join('\n\n');
        follow = result.questions.length === 10 ? result.questions : [];
        label.textContent = 'AI draft';
        skip.hidden = false;
        preview.textContent = summary;
        editor.value = summary;
        status.textContent = 'AI draft ready to review.';
      } catch (error) {
        status.textContent = error instanceof SyntaxError ? 'AI is unavailable. You can review the recap instead.' : error.message;
      } finally {
        ai.disabled = false;
        acceptButton.disabled = false;
        saveEditButton.disabled = false;
      }
    }, 'quiet');
    card.append(node('p', 'If you choose AI, the answers and accepted summaries used here, including an accepted assessment summary, are sent to OpenAI. Privacy Vault entries are excluded.'), ai, status, controls);
    if (!final) card.append(button('Back to my answers', () => change({ stage: 'questions' }), 'quiet'));
  }

  function focus(card, state) {
    card.append(node('h2', 'Where would you like to start?'), node('p', 'Choose one or two areas to build your 90-day plan around.'));
    if (state.final?.summary) {
      const detail = node('details', '', 'follow-up');
      detail.append(node('summary', 'Your accepted summary'), node('blockquote', state.final.summary, 'entry'));
      card.append(detail);
    }
    picks(card, [...areas].sort((a, b) => Number(state.interests?.includes(b) || false) - Number(state.interests?.includes(a) || false)), [], 1, 2, (selected) => {
      if (state.path === 'ideas' && read().planValues?.selected?.length !== 5) {
        return change({ selected, stage: 'values', valueReturn: 'targets' });
      }
      change({ selected, stage: 'targets' });
    });
  }
  function targets(card, state) {
    card.append(node('h2', 'Enter your 90-day targets'), node('p', 'What would you notice, measure, or be able to do by day 90?'));
    const { element, action } = form(card, 'Review my 90-day plan', () => {
      const targets = fields.map(({ area, goal, action, proof, why, skill }) => ({
        area, goal: goal.value.trim(), action: action.value.trim(), proof: proof.value.trim(), why: why.value.trim(), skill: skill.value.trim()
      })).filter((target) => target.goal);
      if (!targets.length || (state.selected?.length && targets.length !== state.selected.length)) return notify('Enter a goal for each area you chose.');
      const existing = read();
      if (save({ ...existing, journey: { ...state, targets, stage: 'targets' } })) finish(targets);
    });
    const fields = (state.selected?.length ? state.selected : ['First goal', 'Second goal · optional']).map((area, index) => {
      const previous = state.targets?.[index];
      element.append(node('h3', area));
      const target = { area,
        goal: field(element, 'What do you want to achieve?', previous?.goal, index === 0 || Boolean(state.selected?.length)),
        why: field(element, 'Why does it matter now? What would you want to protect?', previous?.why),
        proof: field(element, 'What would count as evidence of progress?', previous?.proof),
        skill: field(element, 'What skill would help you move forward?', previous?.skill),
        action: field(element, 'What is one action you could try this week?', previous?.action)
      };
      if (read().assessment?.summary) {
        const status = node('p', '', 'inline-status');
        status.setAttribute('role', 'status');
        const suggest = button('Suggest an action from my assessment', async () => {
          const goal = target.goal.value.trim();
          if (!goal) { target.goal.focus(); return; }
          suggest.disabled = true;
          status.textContent = 'Drafting a suggestion…';
          try {
            const result = await tailorPractice({ goal, why: target.why.value.trim(), proof: target.proof.value.trim() });
            if (!target.action.value.trim()) target.action.value = result.profile.tryNext;
            if (!target.skill.value.trim()) target.skill.value = result.profile.skill;
            status.textContent = [result.overview, result.profile.tryNext, result.profile.skill].filter(Boolean).join(' · ');
          } catch (error) {
            status.textContent = error.message;
          } finally {
            suggest.disabled = false;
          }
        }, 'quiet');
        suggest.type = 'button';
        element.append(node('p', 'This sends your accepted assessment summary and this target to OpenAI.'), suggest, status);
      }
      return target;
    });
    element.append(action);
  }

  function render() {
    const state = data();
    const intro = node('div', '', 'section-intro');
    const title = node('h1', 'Find your starting point');
    title.tabIndex = -1;
    intro.append(title, node('p', 'Start with as much clarity as you have today.'));
    const card = node('article', '', 'journey-card discover-card');
    const legacyIdeaStage = state.path === 'ideas' && (['quiz', 'feedback', 'areas'].includes(state.stage) ||
      (state.stage === 'finalReview' && state.reviews?.length === 1));
    const stage = legacyIdeaStage ? 'questions' : state.stage;
    if (!stage || stage === 'choose') {
      for (const [path, label, description] of [
        ['clear', 'I have clear goals', 'Enter one or two targets and turn them into a plan.'],
        ['ideas', 'I have some ideas', 'Answer five questions about what you want, then ten to dig deeper.'],
        ['unsure', 'I don’t know where to start', 'Start with the full 25-question Personality questionnaire, then explore your situation.']
      ]) {
        card.append(node('h2', label), node('p', description), button(label, () => launch(path), 'quiet'));
      }
      card.append(assessment());
    }
    if (stage === 'quiz') personality(card, state);
    if (stage === 'feedback') feedback(card);
    if (stage === 'areas') areaPicker(card, state);
    if (stage === 'values') valuesRound(card, state);
    if (stage === 'questions') questionnaire(card, state);
    if (stage === 'review') review(card, state, false);
    if (stage === 'afterSynthesis') {
      card.append(node('h2', 'Ready to choose a focus?'));
      if (state.path === 'unsure' && state.round < 7) {
        const remaining = 7 - state.round;
        card.append(node('p', `${remaining} optional ${remaining === 1 ? 'round remains' : 'rounds remain'} if you want to go deeper.`),
          button('Go deeper', () => change({ stage: 'questions' }), 'quiet'));
      }
      if (state.final?.summary) card.append(node('blockquote', state.final.summary, 'entry'));
      card.append(button('Choose where to start', () => change({ stage: 'focus' })));
    }
    if (stage === 'finalReview') review(card, state, true);
    if (stage === 'focus') focus(card, state);
    if (stage === 'targets') targets(card, state);
    host.replaceChildren(intro, card, button('Return to my dashboard', home, 'quiet'));
    if (stage && stage !== 'choose') host.append(button('Choose a different starting path', () => {
      if (window.confirm('Change paths? Your current guided path will restart when you choose another option.')) change({ stage: 'choose' });
    }, 'quiet'));
    open();
    const heading = card.querySelector('h2') || title;
    heading.tabIndex = -1;
    heading.focus();
  }
  return { render };
}

export function planActivities({ read, node, save }) {
  const state = read();
  const card = node('article', '');
  card.append(node('h2', '90-day activities'));
  let goal;
  const timeline = timelineFor(state);
  const milestones = new Map(timeline?.source === 'plan' ? timeline.steps.map(step => [step.id, step]) : []);
  for (const task of taskList(state.plan, state.planTargets || [], state.roadmap, state.growth?.confirmed)) {
    const milestone = milestones.get(task.id);
    if (task.goal !== goal) {
      goal = task.goal;
      card.append(node('h3', goal));
    }
    const label = node('label', '');
    const checkbox = Object.assign(document.createElement('input'), { type: 'checkbox', checked: Boolean(state.completedActivities?.[task.id]) });
    checkbox.onchange = () => {
      const current = read();
      if (!save({ ...current, completedActivities: { ...current.completedActivities, [task.id]: checkbox.checked } })) checkbox.checked = !checkbox.checked;
    };
    label.append(checkbox, document.createTextNode(` ${task.timing} · ${milestone?.title || task.title}`));
    const activity = milestone?.action || task.detail;
    card.append(label, node('p', activity, 'activity-steps'));
    if (milestone?.today && milestone.today !== activity) card.append(node('p', 'First action · ' + milestone.today));
    card.append(node('p', 'Evidence to look for · ' + (milestone?.evidence || task.evidence)));
    const journal = node('details', '', 'follow-up');
    journal.append(node('summary', 'Record what you learned'));
    const form = node('form', '');
    const wrapper = node('label', 'What happened, and what will you try next?');
    const note = node('textarea', '');
    note.value = state.activityNotes?.[task.id] || '';
    wrapper.append(note);
    form.append(wrapper, node('button', 'Save activity note'));
    form.onsubmit = (event) => {
      event.preventDefault();
      const current = read();
      save({ ...current, activityNotes: { ...current.activityNotes, [task.id]: note.value.trim() } });
    };
    journal.append(form);
    card.append(journal);
  }
  return card;
}
