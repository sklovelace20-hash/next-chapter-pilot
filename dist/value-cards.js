import { values } from './discovery-content.js';

export const meanings = {
  Achievement: ['Making meaningful progress toward a goal.', 'Finish a project you committed to.'],
  Adventure: ['Seeking new experiences and a little uncertainty.', 'Explore a place you have never visited.'],
  Authenticity: ['Acting in ways that reflect who you are.', 'Share your real opinion respectfully.'],
  Autonomy: ['Having ownership over your decisions.', 'Choose how to approach your own project.'],
  Belonging: ['Feeling included and accepted as you are.', 'Make time for a group where you feel welcome.'],
  Compassion: ['Responding to distress with care.', 'Ask what would help a friend having a difficult day.'],
  Courage: ['Acting on what matters even when it feels hard.', 'Start a conversation you have been avoiding.'],
  Creativity: ['Making or approaching something in a new way.', 'Try a different format for a familiar project.'],
  Curiosity: ['Wanting to understand more before deciding.', 'Ask how someone arrived at a different conclusion.'],
  Fairness: ['Giving people an equitable chance or hearing.', 'Make selection criteria clear to everyone applying.'],
  Faith: ['Living from a spiritual trust or conviction.', 'Set aside time for prayer or spiritual reflection.'],
  Family: ['Caring for and investing in family relationships.', 'Protect a regular meal or call with family.'],
  Freedom: ['Having room to choose how you live.', 'Keep an afternoon open for what matters to you.'],
  Friendship: ['Building reciprocal, caring relationships.', 'Check in on a friend without needing a reason.'],
  Generosity: ['Offering time, attention, or resources willingly.', 'Help a neighbor with a task they cannot do alone.'],
  Growth: ['Developing through effort, feedback, and experience.', 'Ask for feedback and try one thing differently.'],
  Health: ['Caring for your physical and mental well-being.', 'Make time for sleep or an appointment you need.'],
  Honesty: ['Being truthful about what happened or what you know.', 'Say when you are uncertain instead of guessing.'],
  Humility: ['Staying open to the limits of your own knowledge.', 'Invite someone to point out what you missed.'],
  Integrity: ['Keeping your actions aligned with your principles.', 'Keep a promise even when nobody is checking.'],
  Joy: ['Making room for delight and enjoyment.', 'Spend time on an activity simply because you love it.'],
  Justice: ['Acting to address unfair treatment or barriers.', 'Speak up when a rule excludes people unfairly.'],
  Learning: ['Building knowledge or ability through practice.', 'Spend time learning a technique you can use.'],
  Loyalty: ['Showing up consistently for a person or commitment.', 'Follow through when someone is counting on you.'],
  Peace: ['Making room for calm or reducing unnecessary conflict.', 'Pause before replying in a heated conversation.'],
  Responsibility: ['Owning your commitments and their consequences.', 'Acknowledge a mistake and take a step to repair it.'],
  Security: ['Protecting what you need to feel safe.', 'Build an emergency fund for unexpected expenses.'],
  Service: ['Using your time or skills to benefit others.', 'Volunteer your skills for a community project.'],
  Stability: ['Creating reliable routines or conditions.', 'Set a sustainable schedule you can count on.'],
  Wisdom: ['Applying experience and judgment with perspective.', 'Consider the long-term effects before acting.']
};

export function valuesRound(history) {
  const removing = history.length > 0;
  return { removing, limit: removing ? 5 : 15, options: history.at(-1) || values };
}

export function nextValues(history, selected) {
  const { removing, limit, options } = valuesRound(history);
  const unique = new Set(selected);
  if (history.length >= 3 || unique.size !== limit || [...unique].some((value) => !options.includes(value))) return null;
  return options.filter((value) => unique.has(value) !== removing);
}

export function valueCards({ history, node, onSubmit }) {
  const { removing, limit, options } = valuesRound(history);
  const form = node('form', '');
  const counter = node('p', '', 'selection-count');
  counter.setAttribute('aria-live', 'polite');
  const grid = node('div', '', 'value-grid');
  const instruction = node('p', 'Flip a card to read it. Use the checkbox below it to make your selection.', 'value-instruction value-desktop-label');
  const mobileInstruction = node('p', 'Tap a value to select it. Open Details for an example.', 'value-instruction value-mobile-label');
  const reveal = node('p', '', 'value-screen-reader');
  reveal.setAttribute('role', 'status');
  const submit = node('button', removing ? 'Remove 5' : 'Keep 15');
  const actions = node('div', '', 'value-actions');
  actions.append(counter, submit);
  const selected = () => inputs.filter((input) => input.checked).map((input) => input.value);
  function update() {
    const count = selected().length;
    counter.textContent = `${count} of ${limit} selected${removing ? ' to remove' : ' to keep'}`;
    submit.disabled = count !== limit;
    for (const input of inputs) input.disabled = count === limit && !input.checked;
  }
  const inputs = options.map((value) => {
    const [definition, example] = meanings[value];
    const card = node('div', '', 'value-card');
    const turningArea = node('div', '', 'value-turning-area');
    const faces = node('div', '', 'value-faces');
    const front = node('div', '', 'value-face value-front');
    const ornament = node('span', '✦', 'value-ornament');
    ornament.setAttribute('aria-hidden', 'true');
    front.append(ornament, node('strong', value, 'value-name'), node('span', 'Flip to read', 'value-flip-hint'));
    const back = node('div', '', 'value-face value-back');
    back.append(node('strong', value, 'value-back-name'), node('p', definition),
      node('p', `Example: ${example}`, 'value-example'));
    back.setAttribute('aria-hidden', 'true');
    faces.append(front, back);

    const flip = node('button', '', 'value-flip');
    flip.append(node('span', 'Details', 'value-mobile-label'));
    flip.type = 'button';
    flip.setAttribute('aria-label', `Show definition and example for ${value}`);
    flip.setAttribute('aria-expanded', 'false');
    flip.onclick = () => {
      const showingBack = flip.getAttribute('aria-expanded') === 'true';
      flip.setAttribute('aria-expanded', String(!showingBack));
      flip.setAttribute('aria-label', showingBack ? `Show definition and example for ${value}` : `Hide definition and example for ${value}`);
      front.setAttribute('aria-hidden', String(!showingBack));
      back.setAttribute('aria-hidden', String(showingBack));
      card.classList.toggle('is-flipped', !showingBack);
      reveal.textContent = showingBack ? '' : `${value}. ${definition} Example: ${example}`;
    };
    turningArea.append(flip, faces);

    const label = node('label', '', 'value-select');
    const input = Object.assign(document.createElement('input'), { type: 'checkbox', value });
    input.setAttribute('aria-label', `${removing ? 'Remove' : 'Keep'} ${value}`);
    input.onchange = update;
    label.append(input, node('span', removing ? 'Remove this value' : 'Keep this value', 'value-desktop-label'),
      node('span', value, 'value-mobile-label'));
    card.append(label, turningArea);
    grid.append(card);
    return input;
  });
  form.onsubmit = (event) => {
    event.preventDefault();
    const next = nextValues(history, selected());
    if (next) onSubmit(next);
  };
  form.append(instruction, mobileInstruction, reveal, grid, actions);
  update();
  return form;
}
