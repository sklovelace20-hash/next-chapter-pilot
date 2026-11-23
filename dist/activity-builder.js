import { requestInsight } from './assessment.js';
import { timelineFor, withTimeline } from './project-tracker.js';

export function activityBuilder({ mode, read, save, node, button, notify }) {
  const root = node('section', '', 'activity-builder');
  const skillMode = mode === 'skills';
  const state = read();
  const form = node('form', '');
  function field(parent, label, value, maxLength, multiline = true) {
    const wrapper = node('label', label);
    const input = node(multiline ? 'textarea' : 'input', '');
    input.value = value || '';
    input.maxLength = maxLength;
    if (multiline) input.rows = 2;
    wrapper.append(input);
    parent.append(wrapper);
    return input;
  }
  root.append(node('h2', skillMode ? 'Build a skill activity' : 'Make an activity actionable'));
  const idea = field(form, skillMode ? 'What do you want to get better at?' : 'What activity would you like to try?', '', 2400);
  idea.placeholder = skillMode ? 'I want to give clearer updates in team meetings.' :
    'I want to spend five minutes after dinner preparing for tomorrow.';
  idea.required = true;
  const details = node('details', '', 'follow-up');
  details.append(node('summary', 'Add context or constraints'));
  const constraints = field(details, 'Time, setting, available help, or anything that might get in the way', '', 1600);
  const contextLabel = node('label', '');
  const includeContext = node('input', '');
  includeContext.type = 'checkbox';
  contextLabel.append(includeContext, node('span', ' Also use my plan and accepted report summary'));
  details.append(contextLabel);
  const remembered = (state.activityReflections || []).at(-1);
  if (!skillMode && remembered) {
    const useLast = button('Use my latest activity reflection', () => {
      idea.value = [remembered.title, remembered.note].filter(Boolean).join('\n').slice(0, idea.maxLength);
      idea.focus();
    }, 'quiet');
    useLast.type = 'button';
    details.append(useLast);
  }
  const generate = node('button', 'Draft activity with AI');
  const status = node('p', '', 'inline-status');
  status.setAttribute('role', 'status');
  const preview = node('div', '');
  const library = node('div', '');
  const renderSaved = () => {
    const saved = (read().savedActivities || []).filter(activity => activity.mode === mode);
    library.replaceChildren();
    if (!saved.length) return;
    library.append(node('h3', 'Saved activities'));
    for (const activity of saved) {
      const row = node('details', '', 'follow-up');
      row.append(node('summary', activity.title), node('p', activity.firstAction),
        node('p', 'What to look for · ' + activity.evidence));
      const steps = node('ol', '');
      steps.append(...activity.steps.map(step => node('li', step)));
      row.append(steps);
      library.append(row);
    }
  };
  let requestContext;
  let clarifications = [];

  async function draft(extra = [], answerContext) {
    const detail = idea.value.trim();
    if (!detail) { idea.focus(); return; }
    const latest = read();
    const context = {
      purpose: skillMode ? 'practice a skill gap' : 'clarify an activity',
      idea: detail,
      constraints: constraints.value.trim(),
      background: includeContext.checked ? {
        goal: latest.plan?.goal,
        skill: latest.roadmap?.skill || latest.growth?.confirmed?.skill,
        gap: latest.roadmap?.gap,
        acceptedAssessment: latest.assessment?.summary
      } : undefined
    };
    const key = JSON.stringify(context);
    if (answerContext && answerContext !== key) {
      status.textContent = 'Your activity input changed. Draft the activity again to use your latest input.';
      return;
    }
    if (key !== requestContext || !extra.length) clarifications = [];
    requestContext = key;
    clarifications.push(...extra);
    generate.disabled = true;
    preview.replaceChildren();
    status.textContent = 'Preparing your activity…';
    try {
      const result = await requestInsight({ mode: 'activity-builder', input: JSON.stringify({ ...context, clarifications }) });
      if (result.questions.length) {
        preview.append(node('h3', 'A little more detail'));
        const followUp = node('form', '');
        const fields = result.questions.map(question => [question, field(followUp, question, '', 800)]);
        for (const [, input] of fields) input.required = true;
        followUp.append(node('button', 'Continue with these answers'));
        followUp.onsubmit = event => {
          event.preventDefault();
          const answers = fields.map(([question, input]) => [question, input.value.trim()]);
          if (answers.some(([, answer]) => !answer)) {
            fields.find(([, input]) => !input.value.trim())[1].focus();
            return;
          }
          draft(answers, key);
        };
        preview.append(followUp);
        status.textContent = 'Answer the questions to make the activity fit your situation.';
        fields[0][1].focus();
        return;
      }

      const editor = node('div', '', 'activity-draft');
      editor.append(node('h3', 'Review your activity'));
      const title = field(editor, 'Activity title', result.title, 160, false);
      const skill = field(editor, 'Skill to practice', result.skill, 160, false);
      const first = field(editor, 'First action and when to do it', result.firstAction, 700);
      const steps = field(editor, 'Practice steps · one per line', result.steps.join('\n'), 2400);
      const evidence = field(editor, 'How you’ll know you made progress', result.evidence, 700);
      const values = () => {
        const activity = { mode, title: title.value.trim(), skill: skill.value.trim(),
          firstAction: first.value.trim(), steps: steps.value.split('\n').map(step => step.trim()).filter(Boolean),
          evidence: evidence.value.trim() };
        if (!activity.title || !activity.firstAction || !activity.steps.length || !activity.evidence) {
          status.textContent = 'Add a title, first action, practice steps, and a progress measure.';
          return null;
        }
        return activity;
      };
      const store = button('Save activity', () => {
        const activity = values();
        if (!activity) return;
        const current = read();
        if (save({ ...current, savedActivities: [activity, ...(current.savedActivities || [])] })) {
          store.disabled = true;
          renderSaved();
          status.textContent = 'Activity saved.';
        }
      });
      const actions = node('div', '', 'actions');
      actions.append(store);
      const tracker = latest.plan && timelineFor(latest);
      const active = tracker?.steps.findIndex(step => !step.done) ?? -1;
      if (active >= 0) {
        const apply = button('Use in my next Roadmap milestone', () => {
          const activity = values();
          if (!activity) return;
          const current = read();
          if (current.plan !== latest.plan || current.projectTracker !== latest.projectTracker ||
              current.completedActivities !== latest.completedActivities || current.roadmap !== latest.roadmap ||
              current.planTargets !== latest.planTargets || current.growth !== latest.growth ||
              current.assessment !== latest.assessment) {
            status.textContent = 'Your Roadmap changed. Generate a fresh draft before applying an activity.';
            return;
          }
          const timeline = timelineFor(current);
          const updated = timeline.steps.map((step, index) => index === active ? { ...step, title: activity.title,
            action: activity.steps.map((step, index) => (index + 1) + '. ' + step).join('\n'),
            today: activity.firstAction, evidence: activity.evidence,
            skill: activity.skill || step.skill } : step);
          if (save(withTimeline(current, { ...timeline, steps: updated }))) {
            apply.disabled = true;
            notify('Activity added to your next Roadmap milestone.');
            status.textContent = 'Your Roadmap next move and progress measure are updated.';
          }
        }, 'quiet');
        actions.append(apply);
      }
      editor.append(actions);
      preview.append(editor);
      status.textContent = 'Edit anything before saving or using this activity.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      generate.disabled = false;
    }
  }

  form.append(generate, details);
  form.onsubmit = event => { event.preventDefault(); draft(); };
  root.append(node('p', 'Drafting sends what you enter to OpenAI. You can choose to include your plan and accepted report summary under context.'),
    form, status, preview, library);
  renderSaved();
  return root;
}
