import { everydayTools } from './everyday-tools.js';
import { valueCards } from './value-cards.js';
import { aiMirror } from './ai-mirror.js';
import { discoveryTopics } from './routes.js';
import { mirrorSources, nextDraft, practiceFor, profileFields } from './growth.js';
import { traits, strengths, reflections, careerQuestions,
  priorities, morningSets, profile, careerIdeas } from './discovery-content.js';

export function discovery({ get, node, button, read, save, notify, applyPractice, openPage }) {
  let current = 'profile';
  let promptIndex = 0;
  const data = () => read().discovery || {};
  const write = (patch) => save({ ...read(), discovery: { ...data(), ...patch } });

  function field(form, labelText, value, singleLine = false) {
    const label = node('label', labelText);
    const input = document.createElement(singleLine ? 'input' : 'textarea');
    input.value = value || '';
    label.append(input);
    form.append(label);
    return input;
  }

  function submit(form, text, handler) {
    const control = node('button', text);
    control.type = 'submit';
    form.append(control);
    form.onsubmit = (event) => {
      event.preventDefault();
      handler();
    };
    return control;
  }

  function panel(title, description) {
    const card = node('article', '', 'discover-card');
    card.append(node('h2', title));
    if (description) card.append(node('p', description));
    return card;
  }

  function choices(form, options, selected, change) {
    const group = node('div', '', 'choice-grid');
    const inputs = options.map((value) => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value;
      input.checked = selected.includes(value);
      input.onchange = () => change(selection());
      const label = node('label', '');
      label.append(input, node('span', value));
      group.append(label);
      return input;
    });
    const selection = () => inputs.filter((input) => input.checked).map((input) => input.value);
    form.append(group);
    return selection;
  }

  function open(name, index) {
    current = name;
    if (index === undefined && (name === 'reflection' || name === 'career')) {
      const questions = name === 'reflection' ? reflections : careerQuestions;
      const saved = data()[name] || {};
      const next = questions.findIndex(([id]) => !saved[id]);
      index = next < 0 ? (name === 'career' ? questions.length : 0) : next;
    }
    promptIndex = index ?? 0;
    render();
    get('discover').querySelector('.discover-card h2')?.focus();
  }

  function personality(body) {
    const answers = data().traits || {};
    const all = traits.flatMap((trait, axis) => trait.questions.map((question, index) => ({ key: `${axis}-${index}`, question })));
    const position = all.findIndex(({ key }) => !answers[key]);
    if (position >= 0) {
      const { key, question: [question, left, right] } = all[position];
      const card = panel(question, `Personality · Question ${position + 1} of ${all.length}`);
      const about = node('details', '', 'follow-up discover-extra');
      about.append(node('summary', 'About this exercise'), node('p', 'Choose what feels natural in most situations. The questions explore preferences inspired by Myers-Briggs.'));
      const choices = node('div', '', 'preference-choices');
      for (const [answer, label, mark] of [[1, left, '◒'], [-1, right, '◓'], [0, 'It depends', '≈']]) {
        const choice = button('', () => {
          if (write({ traits: { ...answers, [key]: String(answer) } })) open('profile');
        }, 'hub-link preference-choice');
        const icon = node('span', mark, 'preference-icon');
        icon.setAttribute('aria-hidden', 'true');
        choice.append(icon, node('span', label, 'hub-label'));
        choices.append(choice);
      }
      card.append(choices);
      if (position > 0) card.append(button('Previous question', () => {
        const next = { ...answers };
        delete next[all[position - 1].key];
        if (write({ traits: next })) open('profile');
      }, 'quiet'));
      card.append(about);
      body.append(card);
      return;
    }
    const card = panel('Your natural preferences', 'Think of these as starting points to compare with your own experience.');
    for (const axis of profile(answers)) {
      if (axis.count) card.append(node('p', `${axis.poles.join(' / ')} · ${axis.label}`));
    }
    card.append(button('Retake personality questions', () => { if (write({ traits: {} })) open('profile'); }, 'quiet'));
    const strengthCard = panel('What comes naturally to you?', 'Choose the strengths you use, then give one example so you can see them in action.');
    const form = document.createElement('form');
    const selected = choices(form, strengths, data().strengths || [], () => {});
    const other = field(form, 'Another strength', data().otherStrength, true);
    const example = field(form, 'When did one of these strengths make a difference?', data().strengthExample);
    submit(form, 'Save strengths and continue', () => {
      if (write({ strengths: selected(), otherStrength: other.value.trim(), strengthExample: example.value.trim() })) openPage('/discover?topic=values');
    });
    strengthCard.append(form);
    body.append(card, strengthCard);
  }

  function valueExercise(body) {
    const history = data().valueRounds || [];
    if (history.length === 3) {
      const card = panel('Your five values', 'Define each in your own words and name a behavior that would make it visible.');
      const form = document.createElement('form');
      const previous = data().valueMeaning || {};
      const fields = history[2].map((value) => [value, field(form, `${value} · What does this look like when you live it?`, previous[value])]);
      const tradeoff = field(form, 'When two of your values compete, which would you protect and why?', data().tradeoff);
      submit(form, 'Lock in my top five', () => {
        const state = read();
        const valueMeaning = Object.fromEntries(fields.map(([value, input]) => [value, input.value.trim()]));
        const planValues = { selected: history[2], meanings: valueMeaning };
        if (save({ ...state, planValues, discovery: { ...data(), valueMeaning, tradeoff: tradeoff.value.trim() } })) {
          openPage('/discover?topic=reflection');
          notify('Your five values were added to your plan output.');
        }
      });
      card.append(form, button('Revisit the last round', () => {
        if (write({ valueRounds: history.slice(0, 2) })) open('values');
      }, 'quiet'));
      body.append(card);
      return;
    }
    const round = history.length;
    const card = panel(round ? 'Choose five to remove' : 'Choose your top 15',
      round ? 'Uncheck a selected card to make room for a different choice.' : 'Choose the values you would protect when life gets busy.');
    card.classList.add('values-topic');
    card.append(valueCards({ history, node, onSubmit: (next) => {
      if (write({ valueRounds: [...history, next] })) open('values');
    } }));
    if (round) card.append(button('Previous round', () => {
      if (write({ valueRounds: history.slice(0, -1) })) open('values');
    }, 'quiet'));
    body.append(card);
  }

  function prompts(body, name, questions) {
    const [key, question, followUp] = questions[promptIndex];
    const existing = data()[name] || {};
    const saved = existing[key] || {};
    const card = panel(question, `Question ${promptIndex + 1} of ${questions.length}`);
    const form = document.createElement('form');
    const answer = field(form, 'Your reflection', saved.answer);
    const detail = node('details', '', 'follow-up');
    const label = node('summary', 'Go deeper');
    detail.append(label);
    const follow = field(detail, followUp, saved.follow);
    const thirdQuestion = {
      stuck: 'What feels at stake if you do take the next step? What would make it feel safer to try?',
      block: 'What did you learn to expect? What would you need to see to reconsider it?',
      communication: 'Which part did you observe, and which part could you check by asking?',
      emotion: 'If that feeling were asking for something, what might it be? What is another possibility?',
      alignment: 'What would make that different action hard? What support would make it more realistic?',
      desire: 'What part of that change is available in your current role? What still needs exploring?'
    }[key] || 'What makes that significant to you, and what would you like to understand better?';
    const clarify = field(detail, thirdQuestion, saved.clarify);
    detail.open = Boolean(saved.follow || saved.clarify);
    detail.classList.add('discover-extra');
    const next = () => {
      if (promptIndex + 1 < questions.length) open(name, promptIndex + 1);
      else if (name === 'career') open('career', questions.length);
      else openPage('/discover?topic=insights');
    };
    const saveAnswer = submit(form, 'Save and continue', () => {
      if (write({ [name]: { ...existing, [key]: { answer: answer.value.trim(), follow: follow.value.trim(), clarify: clarify.value.trim() } } })) next();
    });
    const actions = node('div', '', 'discover-actions');
    actions.append(saveAnswer);
    const skip = button('Skip for now', next, 'quiet');
    skip.type = 'button';
    actions.append(skip);
    if (promptIndex) {
      const back = button('Previous question', () => open(name, promptIndex - 1), 'quiet');
      back.type = 'button';
      actions.append(back);
    }
    form.append(actions, detail);
    card.append(form);
    body.append(card);
  }

  function morning(body) {
    const today = new Date();
    const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const saved = data().mornings?.[date] || {};
    const card = panel('A few minutes for yourself', 'Three optional prompts, followed by three things you’re grateful for.');
    const enabled = Boolean(data().morningEnabled);
    const toggle = button(enabled ? 'Pause morning prompts' : 'Turn on morning prompts', () => {
      if (write({ morningEnabled: !enabled })) open('morning');
    }, enabled ? 'quiet' : undefined);
    if (enabled) {
      const form = document.createElement('form');
      const questions = morningSets[Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) % morningSets.length];
      const extras = node('details', '', 'follow-up discover-extra');
      extras.append(node('summary', 'More prompts and gratitude'));
      const answers = questions.map((question, index) => field(index ? extras : form, question, saved.answers?.[index]));
      const gratitude = [1, 2, 3].map((index) => field(extras, `I’m grateful for · ${index}`, saved.gratitude?.[index - 1], true));
      submit(form, 'Save today’s reflection', () => {
        const values = (inputs) => inputs.map((input) => input.value.trim());
        const record = { date, questions, answers: values(answers), gratitude: values(gratitude) };
        if (write({ mornings: { ...data().mornings, [date]: record } })) notify('Morning reflection saved.');
      });
      form.append(extras);
      card.append(form);
    }
    card.append(toggle);
    const past = Object.values(data().mornings || {}).reverse();
    if (past.length) {
      const detail = node('details', '', 'follow-up');
      detail.append(node('summary', 'Past morning reflections'));
      for (const morning of past) {
        const entry = node('section', '');
        entry.append(node('h3', morning.date));
        morning.answers.forEach((answer, index) => {
          if (answer) entry.append(node('p', `${morning.questions[index]} ${answer}`, 'entry'));
        });
        if (morning.gratitude.some(Boolean)) entry.append(node('p', `Grateful for: ${morning.gratitude.filter(Boolean).join(' · ')}`));
        detail.append(entry);
      }
      card.append(detail);
    }
    body.append(card);
  }

  function career(body) {
    if (promptIndex < careerQuestions.length) return prompts(body, 'career', careerQuestions);
    const card = panel('What matters most in your next role?', 'Choose what matters, then name the factor you would protect in a trade-off.');
    const form = document.createElement('form');
    const chosen = choices(form, priorities, data().careerPriorities || [], () => {});
    const extra = field(form, 'Add another priority', data().careerOther, true);
    const first = field(form, 'What comes first for you, and why?', data().careerFirst);
    submit(form, 'See career possibilities', () => {
      if (write({ careerPriorities: chosen(), careerOther: extra.value.trim(), careerFirst: first.value.trim() })) openPage('/discover?topic=insights');
    });
    card.append(form);
    body.append(card);
  }

  function insights(body) {
    const state = read();
    const info = data();
    const growth = state.growth || {};
    const draft = nextDraft(state);
    const mirror = panel('Make it yours', 'Review your answers and confirm what fits in your own words.');
    const sources = mirrorSources(state);
    const sourceDetails = [];
    for (const [title, entries] of sources) {
      const detail = node('details', '', 'follow-up');
      detail.append(node('summary', title));
      for (const [question, answer] of entries) detail.append(node('p', question), node('blockquote', answer, 'entry'));
      sourceDetails.push(detail);
    }
    const form = document.createElement('form');
    const directionLabel = node('label', 'What are you here to explore?');
    const direction = document.createElement('select');
    for (const [value, title] of [['', 'Choose your direction'], ['personal', 'Personal growth'], ['understand', 'Understand myself'], ['career', 'Career opportunities']]) {
      direction.add(new Option(title, value));
    }
    direction.value = draft.direction || '';
    directionLabel.append(direction);
    form.append(directionLabel);
    const profileEditor = node('details', '', 'follow-up discover-extra');
    profileEditor.open = !window.matchMedia('(max-width: 600px)').matches;
    profileEditor.append(node('summary', 'Edit profile details'));
    const fields = profileFields.map(([key, title]) => [key, field(profileEditor, title, draft[key])]);
    const clarification = field(profileEditor, 'What would you correct, add, or put differently?', draft.clarification);
    let pending;
    const reviewDraft = node('details', '', 'follow-up');
    reviewDraft.hidden = true;
    reviewDraft.append(node('summary', 'Edit the AI overview, insights and questions'));
    const overview = field(reviewDraft, 'Overview', '');
    const insights = field(reviewDraft, 'Insights · one per line', '');
    const questions = field(reviewDraft, 'Questions · one per line', '');
    profileEditor.append(reviewDraft);
    function confirm(confirmed) {
      if (!Object.values(confirmed).some(Boolean)) return notify('Add something you want to keep.');
      const current = read();
      const currentGrowth = current.growth || {};
      if (JSON.stringify(currentGrowth.confirmed) === JSON.stringify(confirmed)) return notify('Your confirmed profile is up to date.');
      const version = { date: new Date().toISOString(), profile: confirmed };
      if (save({ ...current, growth: { ...currentGrowth, confirmed,
        versions: [...(currentGrowth.versions || []), version] } })) {
        openPage('/discover?topic=insights');
        notify('Your words will guide future insights.');
      }
    }
    submit(form, 'Confirm in my own words', () => {
      const lines = (input) => input.value.split('\n').map((line) => line.trim()).filter(Boolean);
      const acceptedReflection = pending ? { overview: overview.value.trim(), insights: lines(insights), questions: lines(questions) } : draft.acceptedReflection;
      confirm({ direction: direction.value, ...Object.fromEntries(fields.map(([key, input]) => [key, input.value.trim()])),
        clarification: clarification.value.trim(), ...(acceptedReflection ? { acceptedReflection } : {}) });
    });
    form.append(profileEditor);
    mirror.append(form, ...sourceDetails);
    if (draft.acceptedReflection) {
      const saved = node('details', '', 'follow-up');
      saved.append(node('summary', 'Accepted AI reflection'), node('p', draft.acceptedReflection.overview));
      for (const line of [...draft.acceptedReflection.insights, ...draft.acceptedReflection.questions]) saved.append(node('p', line));
      mirror.append(saved);
    }
    const profileDraft = (ai) => Object.fromEntries(Object.entries(ai.profile).filter(([key, value]) =>
      profileFields.some(([field]) => field === key) && value.trim()));
    body.append(aiMirror({ sources, assessmentSummary: state.assessment?.summary, node, button,
      accept(ai) {
        confirm({ ...draft, ...profileDraft(ai), acceptedReflection: { overview: ai.overview, insights: ai.insights, questions: ai.questions } });
      },
      edit(ai) {
        pending = ai;
        profileEditor.open = true;
        reviewDraft.hidden = false;
        reviewDraft.open = true;
        overview.value = ai.overview;
        insights.value = ai.insights.join('\n');
        questions.value = ai.questions.join('\n');
        const proposed = profileDraft(ai);
        for (const [key, input] of fields) if (proposed[key]) input.value = proposed[key];
        overview.focus();
      }
    }));
    if (growth.versions?.length > 1) {
      const history = node('details', '', 'follow-up');
      history.append(node('summary', 'Earlier versions in your words'));
      for (const version of growth.versions.slice(0, -1).reverse()) {
        history.append(node('h3', new Date(version.date).toLocaleString()));
        for (const [key, label] of profileFields) {
          if (version.profile[key]) history.append(node('p', label), node('blockquote', version.profile[key], 'entry'));
        }
        if (version.profile.clarification) history.append(node('p', 'Your clarification'), node('blockquote', version.profile.clarification, 'entry'));
      }
      mirror.append(history);
    }
    body.append(mirror);
    if (!growth.confirmed) return;
    const confirmed = growth.confirmed;

    const ideas = panel('Questions and ideas to try', 'Your confirmed words guide these suggestions. Choose what fits your situation.');
    if (confirmed.tryNext) ideas.append(node('p', 'You want to try'), node('blockquote', confirmed.tryNext, 'entry'));
    if (confirmed.strength) ideas.append(node('p', `How could you use one of these strengths in a small way? ${confirmed.strength}`));
    if (confirmed.priority || confirmed.values) ideas.append(node('p', `What would a small experiment look like that honors this? ${confirmed.priority || confirmed.values}`));
    if (confirmed.belief) ideas.append(node('p', 'Belief you confirmed'), node('blockquote', confirmed.belief, 'entry'), node('p', 'Where does this belief help you? Where might a real example give you a different perspective?'));
    if (confirmed.goal) ideas.append(node('p', 'Goal you confirmed'), node('blockquote', confirmed.goal, 'entry'), node('p', 'What evidence this week would help you decide whether your next step serves that goal?'));
    if (confirmed.tryNext && confirmed.strength) ideas.append(node('p', 'Try a 15-minute version of the activity you named. Choose one of your stated strengths, use it deliberately, and write down what you observed.'));
    ideas.append(node('p', 'What would help you learn more: trying once, asking for feedback, reading something free, or setting aside time to think?'));
    if (state.plan && confirmed.tryNext) ideas.append(button('Use my idea in the roadmap', () => applyPractice('Practice I chose', confirmed.tryNext), 'quiet'));
    body.append(ideas);

    const skill = practiceFor(confirmed.skill);
    if (skill) {
      const card = panel(skill.name, skill.practice);
      card.append(node('p', skill.evidence));
      const assessment = document.createElement('form');
      const rate = (title) => {
        const label = node('label', title);
        const select = document.createElement('select');
        for (const [value, text] of [['', 'Choose a rating'], ['1', '1 · Beginning'], ['2', '2 · Learning'], ['3', '3 · Practicing'], ['4', '4 · Independent'], ['5', '5 · Consistent']]) select.add(new Option(text, value));
        label.append(select);
        assessment.append(label);
        return select;
      };
      const before = rate(skill.baseline);
      const after = rate('After practice, how would you rate yourself?');
      const evidence = field(assessment, 'What actually happened?', '');
      submit(assessment, 'Save self-assessment', () => {
        if (!before.value && !after.value && !evidence.value.trim()) return notify('Add a rating or an observation.');
        const current = read();
        const old = current.growth || {};
        const entry = { skill: confirmed.skill, before: before.value, after: after.value, evidence: evidence.value.trim(), date: new Date().toISOString() };
        if (save({ ...current, growth: { ...old, assessments: [...(old.assessments || []), entry] } })) {
          openPage('/discover?topic=insights');
          notify('Self-assessment saved.');
        }
      });
      card.append(assessment);
      if (state.plan) card.append(button('Try this in my roadmap', () => applyPractice(confirmed.skill, skill.practice), 'quiet'));
      if (skill.resources.length) {
        const learn = node('details', '', 'follow-up');
        learn.append(node('summary', 'Free learning to try'));
        for (const [title, url] of skill.resources) {
          const link = node('a', title);
          link.href = url;
          const item = node('p', '');
          item.append(link);
          learn.append(item);
        }
        card.append(learn);
      }
      const previous = (growth.assessments || []).filter((entry) => entry.skill === confirmed.skill).reverse();
      if (previous.length) {
        const history = node('details', '', 'follow-up');
        history.append(node('summary', 'Past self-assessments'));
        for (const entry of previous) {
          history.append(node('h3', new Date(entry.date).toLocaleDateString()));
          if (entry.before) history.append(node('p', `Before: ${entry.before}/5`));
          if (entry.after) history.append(node('p', `After: ${entry.after}/5`));
          if (entry.evidence) history.append(node('blockquote', entry.evidence, 'entry'));
        }
        history.append(node('p', 'Does this still describe your experience? Add another assessment to record what has changed.'));
        card.append(history);
      }
      body.append(card);
    }

    if (confirmed.direction === 'career') body.append(careerResources());
  }

  function careerResources() {
    const state = read();
    const info = data();
    const confirmed = state.growth?.confirmed || {};
    const resources = everydayTools({ guide: 'work', node, button });
    resources.querySelector('summary').textContent = 'Resources and Insights';
    const career = Object.fromEntries(Object.entries(info.career || {}).map(([key, entry]) => [key, [entry.answer, entry.follow, entry.clarify].filter(Boolean).join(' ')]));
      const roles = careerIdeas(career, [confirmed.strength, confirmed.tryNext, confirmed.skill].filter(Boolean));
      const card = panel('Career paths to test', 'Compare each experiment with the work you enjoy and the conditions you want.');
      if (info.careerFirst) card.append(node('p', 'What you said comes first'), node('blockquote', info.careerFirst, 'entry'));
      if (career.dislikes) card.append(node('p', 'What you said drains you'), node('blockquote', career.dislikes, 'entry'));
      for (const role of roles) {
        card.append(node('h3', role.title), node('p', `Your wording included ${[...new Set(role.clues)].join(', ')}. What connection do you see, if any?`), node('p', role.practice));
        if (role.potentialFriction) card.append(node('p', 'What could you ask someone in this role about the tasks you prefer to avoid?'));
        if (state.plan) card.append(button('Add this career experiment', () => applyPractice(role.title, role.practice, 'experience'), 'quiet'));
      }
      if (!roles.length) card.append(node('p', 'Which activity would you like to do more often? Add it under Career or “What I want to try.”'));
    resources.querySelector('summary').after(card);
    return resources;
  }

  function render() {
    const collection = get('discover');
    const header = node('div', '', `section-intro topic-intro topic-${current}`);
    const heading = node('h1', 'Discover what drives you');
    heading.tabIndex = -1;
    header.append(heading, node('p', 'Choose one area to explore at your own pace.', 'discover-intro-copy'));
    const menu = node('nav', '', 'discover-menu');
    menu.setAttribute('aria-label', 'Discovery topics');
    for (const [key, title] of discoveryTopics) {
      const control = button(title, () => openPage(`/discover?topic=${key}`), 'quiet');
      control.setAttribute('aria-pressed', String(key === current));
      menu.append(control);
    }
    const body = node('div', '', 'discover-body');
    collection.replaceChildren(header, menu, body);
    if (current === 'profile') personality(body);
    if (current === 'values') valueExercise(body);
    if (current === 'reflection') prompts(body, 'reflection', reflections);
    if (current === 'morning') morning(body);
    if (current === 'career') {
      career(body);
      body.append(careerResources());
    }
    if (current === 'insights') insights(body);
    for (const title of body.querySelectorAll('h2')) title.tabIndex = -1;
  }

  return { render, open };
}
