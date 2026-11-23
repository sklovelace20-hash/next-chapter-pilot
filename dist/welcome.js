const questions = [
  {
    title: 'What brought you here today?',
    options: [
      'I’m curious about myself', 'I’m in the middle of a change',
      'Something feels stuck', 'I want to build a skill', 'I’m just looking around', 'Something else'
    ],
    reply: 'You picked a starting point. Look at you, already starting.'
  },
  {
    title: 'What age range are you in?',
    options: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65+', 'Prefer not to say'],
    reply: 'Right on.'
  },
  {
    title: 'How do you describe your gender?',
    options: ['Woman', 'Man', 'Nonbinary', 'I describe it another way', 'Prefer not to say'],
    reply: 'Got it.'
  },
  {
    title: 'What does work look like for you these days?',
    options: ['Employed', 'Self-employed', 'Looking for work', 'Studying', 'Caregiving', 'Retired', 'Something else', 'Prefer not to say'],
    multiple: true,
    reply: 'Cool. Let’s get into it.'
  }
];

const startingPoints = [
  ['Explore your personality', 'Start with a few questions about how you think, make decisions, and recharge.', '/personality'],
  ['Find what matters in the middle of change', 'Sort through your values and choose one you want to make room for.', '/values/exercise'],
  ['Start with one reflection', 'Give yourself a minute to put words to what’s been feeling stuck.', '/discover?topic=reflection'],
  ['Find a skill to practice', 'Pick something you want to get better at and try a small way to practice it.', '/skills'],
  ['See what’s here', 'Browse the activities and pick whatever catches your eye.', '/?explore=1']
];

export function welcomeFlow({ get, node, button, read, save, show, openPage }) {
  let step = 0;
  let answers = [];
  let notes = [];
  const host = get('welcome');
  const explore = () => show('home', 'explore-title', '/?explore=1');
  const reset = () => {
    step = 0;
    answers = [];
    notes = [];
  };

  function recommendation(index, reply = '', canBack = false) {
    const [title, description, path] = startingPoints[index] || startingPoints[4];
    const heading = node('h1', title);
    heading.id = 'welcome-title';
    heading.tabIndex = -1;
    const actions = node('div', '', 'actions');
    actions.append(button('Let’s start here', () => openPage(path)),
      button('Look around', explore, 'quiet'));
    if (canBack) actions.append(button('Back', () => { step -= 1; render(); }, 'quiet'));
    host.replaceChildren(node('p', reply, 'welcome-reply'), heading, node('p', description), actions);
    show('welcome', heading.id);
  }

  function render() {
    if (!questions[step] || (!answers.length && read().welcome)) return recommendation(read().welcome?.startingPoint);
    const { title, options, multiple } = questions[step];
    const previous = answers[step - 1];
    const reply = previous?.length ? (
      step === 1 && previous[0] === 2 ? 'We can start there.' : questions[step - 1].reply
    ) : '';
    const progress = node('progress');
    progress.max = questions.length;
    progress.value = step + 1;
    progress.setAttribute('aria-label', 'Welcome questions');
    const heading = node('h1', title);
    heading.id = 'welcome-title';
    heading.tabIndex = -1;
    const form = node('form');
    const fieldset = node('fieldset');
    fieldset.setAttribute('aria-labelledby', heading.id);
    const choices = node('div', '', 'choice-grid welcome-choices');
    const extra = node('label', step === 0 ? 'Talk to me, Goose. What brought you here? (Optional)' : 'In your own words (Optional)');
    const detail = node('input');
    detail.type = 'text';
    detail.value = notes[step] || '';
    detail.maxLength = 300;
    extra.append(detail);
    const controls = options.map((option, index) => {
      const label = node('label');
      const input = node('input');
      input.type = multiple ? 'checkbox' : 'radio';
      input.name = 'welcome-choice';
      input.checked = Boolean(answers[step]?.includes(index));
      label.append(input, document.createTextNode(option));
      choices.append(label);
      return input;
    });
    const customIndex = step === 0 ? 5 : step === 2 ? 3 : -1;
    function updateChoices() {
      extra.hidden = !controls[customIndex]?.checked;
      next.disabled = !controls.some((input) => input.checked);
    }
    const next = node('button', step === questions.length - 1 ? 'Find my starting point' : 'Continue');
    next.type = 'submit';
    choices.onchange = (event) => {
      if (multiple && event.target.checked) {
        const last = controls.at(-1);
        if (event.target === last) controls.slice(0, -1).forEach((input) => { input.checked = false; });
        else last.checked = false;
      }
      updateChoices();
    };
    updateChoices();
    function advance(selected) {
      answers[step] = selected;
      notes[step] = !extra.hidden && selected.length ? detail.value : '';
      step += 1;
      if (step < questions.length) return render();
      const selection = answers[0]?.[0];
      const startingPoint = selection < startingPoints.length ? selection : 4;
      save({ ...read(), welcome: { startingPoint } });
      recommendation(startingPoint, selected.length ? questions.at(-1).reply : '', true);
    }
    form.onsubmit = (event) => {
      event.preventDefault();
      advance(controls.flatMap((input, index) => input.checked ? [index] : []));
    };
    const actions = node('div', '', 'actions');
    actions.append(button('Back', () => {
      if (!step) return show('home', 'home-title');
      step -= 1;
      render();
    }, 'quiet'), next, button('Skip', () => advance([]), 'quiet'));
    for (const action of actions.querySelectorAll('.quiet')) action.type = 'button';
    fieldset.append(choices, extra);
    form.append(fieldset, actions);
    host.replaceChildren(node('p', reply, 'welcome-reply'),
      node('p', `Question ${step + 1} of ${questions.length}`, 'welcome-progress'),
      progress, heading, form);
    if (multiple) heading.after(node('p', 'Choose any that fit.'));
    show('welcome', heading.id);
  }

  function home() {
    const returning = Boolean(read().welcome);
    const exploring = window.location.search === '?explore=1';
    get('home-title').textContent = returning ? 'Hey, welcome back.' : 'Hey there.';
    get('welcome-intro').textContent = returning
      ? 'Pick up where you left off or follow whatever’s got your attention today.'
      : 'Start with whatever makes you curious. One thing is plenty.';
    get('welcome-start').textContent = returning ? 'My starting point' : 'Help me get started';
    get('home-explore').hidden = !exploring;
    get('welcome-explore').hidden = exploring;
    get('welcome-start').onclick = () => {
      reset();
      return returning ? recommendation(read().welcome.startingPoint) : render();
    };
    get('welcome-explore').onclick = explore;
    get('welcome-discover').onclick = () => openPage('/discover');
  }
  return { home, render, reset };
}
