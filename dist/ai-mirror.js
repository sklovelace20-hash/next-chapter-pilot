import { answerSelection } from './answer-selection.js';
export function aiMirror({ sources, assessmentSummary, node, button, accept, edit }) {
  const card = node('article', '', 'discover-card');
  card.append(node('h2', 'AI reflection'));
  if (!sources.length && !assessmentSummary) {
    card.append(node('p', 'Add a few answers to see what the AI understood.'));
    return card;
  }
  const chooser = node('details', '', 'follow-up');
  chooser.append(node('summary', 'Choose what to reflect on'),
    node('p', assessmentSummary
      ? 'This sends your selected answers and accepted report summary to OpenAI. Privacy Vault entries are excluded.'
      : 'Only the answers you select are sent to OpenAI. Privacy Vault entries are excluded.'));
  const picks = answerSelection(sources, node);
  chooser.append(picks.wrapper);
  const status = node('p', '');
  status.setAttribute('role', 'status');
  const result = node('div', '', 'reflection-result');
  let lastReflection;
  const generate = button('Generate reflection', async () => {
    const selected = picks.selected();
    if (!selected.length && !assessmentSummary) { status.textContent = 'Select at least one answer.'; return; }
    const input = JSON.stringify({ entries: selected, acceptedAssessment: assessmentSummary });
    generate.disabled = true;
    status.textContent = 'Reading your selected answers…';
    result.replaceChildren();
    try {
      if (lastReflection?.input !== input) {
        const response = await fetch('/api/reflection', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });
        const draft = await response.json();
        if (!response.ok) throw new Error(draft.error);
        lastReflection = { input, draft };
      }
      const { draft } = lastReflection;
      status.textContent = '';
      const heading = node('h3', 'What I heard');
      heading.tabIndex = -1;
      result.append(heading, node('p', draft.overview, 'reflection-overview'));
      if (draft.profile.tryNext.trim()) {
        const next = node('div', '', 'reflection-next');
        next.append(node('h3', 'One step to try'), node('p', draft.profile.tryNext));
        result.append(next);
      }
      for (const [title, entries] of [['What stands out', draft.insights], ['To think about', draft.questions]]) {
        if (!entries.length) continue;
        const list = node('ul', '');
        for (const entry of entries) list.append(node('li', entry));
        result.append(node('h3', title), list);
      }
      const profile = node('details', '', 'follow-up');
      profile.append(node('summary', 'See the proposed profile wording'));
      for (const [key, value] of Object.entries(draft.profile)) if (value.trim()) profile.append(node('p', key), node('blockquote', value, 'entry'));
      const actions = node('div', '', 'actions');
      actions.append(button('Accept as written', () => accept(draft)), button('Edit before accepting', () => edit(draft), 'quiet'), button('Skip suggestion', () => { result.replaceChildren(); chooser.open = true; generate.focus(); }, 'quiet'));
      result.append(profile, node('p', 'Does this fit? Accept it as written or change the wording before it becomes part of your profile.'), actions);
      if (window.matchMedia('(max-width: 600px)').matches) {
        chooser.open = false;
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
      } else {
        heading.focus();
      }
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'The AI overview is unavailable right now.' : error.message;
    } finally {
      generate.disabled = false;
    }
  });
  chooser.append(generate);
  card.append(chooser, status, result);
  fetch('/api/reflection').then((response) => response.json()).then(({ available }) => {
    if (!available && !status.textContent) status.textContent = 'AI overview is awaiting setup. You can still review and edit your profile below.';
  }).catch(() => {});
  return card;
}
