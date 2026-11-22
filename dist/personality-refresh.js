import { requestInsight } from './assessment.js';
import { personalityEvidence } from './deeper.js';
import { profile } from './discovery-content.js';
import { nextDraft } from './growth.js';
import { timelineFor, withTimeline } from './project-tracker.js';

export function personalityRefresh({ read, save, node, button }) {
  const box = node('section', '', 'personality-refresh');
  const status = node('p', '', 'inline-status');
  status.setAttribute('role', 'status');
  const preview = node('div', '');
  const refresh = button('Refresh from Personality results', async () => {
    let expected = read();
    const answers = personalityEvidence(expected.discovery);
    if (!answers.length) { status.textContent = 'Answer at least one Personality question first.'; return; }
    const prior = nextDraft(expected).acceptedReflection || expected.planHub?.personality?.accepted;
    const tracker = expected.plan ? timelineFor(expected) : null;
    const active = tracker?.steps?.findIndex(step => !step.done) ?? -1;
    const milestone = tracker?.steps[active];
    const currentMove = milestone?.today || milestone?.action || '';
    const acceptedReport = expected.assessment?.summary;
    const context = {
      answers,
      rubric: profile(expected.discovery?.traits || {}).map(({ poles, band, left, right, neutral, count }) =>
        ({ sides: poles, band, left, right, neutral, count })),
      priorSummary: prior?.overview,
      correction: expected.journey?.personalityNote || expected.growth?.confirmed?.clarification,
      acceptedAssessment: acceptedReport,
      roadmap: milestone ? { goal: milestone.goal || expected.plan?.goal, milestone: milestone.title,
        currentMove, skill: milestone.skill || tracker.focus, evidence: milestone.evidence || expected.plan?.tracker } : undefined
    };
    refresh.disabled = true;
    preview.replaceChildren();
    status.textContent = 'Preparing a draft from your saved answers…';
    try {
      const draft = await requestInsight({ mode: 'personality-refresh', input: JSON.stringify(context) });
      if (draft.questions.length !== 5) throw new Error('The draft did not include five questions. Try generating it again.');
      const reflection = { overview: draft.overview, insights: draft.insights, questions: draft.questions };
      const current = () => {
        if (read() === expected) return true;
        status.textContent = 'Your saved details changed. Generate a fresh draft before applying it.';
        return false;
      };
      status.textContent = 'Review the draft, then choose what to apply.';
      preview.append(node('h3', 'AI summary preview'));
      if (prior?.overview) {
        const old = node('details', '', 'follow-up');
        old.append(node('summary', 'Current accepted summary'), node('p', prior.overview, 'entry'));
        preview.append(old);
      }
      preview.append(node('p', reflection.overview, 'entry'));
      for (const [title, values] of [['Insights', reflection.insights], ['Follow-up questions', reflection.questions]]) {
        if (!values.length) continue;
        const list = node('ul', '');
        list.append(...values.map(value => node('li', value)));
        preview.append(node('h4', title), list);
      }
      const useSummary = button('Use this AI summary', () => {
        if (!current()) return;
        const growth = { ...expected.growth, personalityReflection: reflection };
        if (growth.confirmed) growth.confirmed = { ...growth.confirmed, acceptedReflection: reflection };
        const planHub = { ...expected.planHub, personality: { ...expected.planHub?.personality, accepted: reflection } };
        if (!save({ ...expected, growth, planHub })) return;
        expected = read();
        useSummary.disabled = true;
        status.textContent = 'AI summary updated in Discover and Plan Hub.';
      });
      preview.append(useSummary);
      const proposed = draft.profile.tryNext.trim();
      if (milestone && proposed && proposed !== currentMove) {
        preview.append(node('h3', 'Roadmap next move preview'),
          node('p', 'Current · ' + currentMove), node('p', 'Suggested · ' + proposed));
        const useMove = button('Use this Roadmap next move', () => {
          if (!current()) return;
          const latest = timelineFor(expected);
          const steps = latest.steps.map((step, index) => index === active ? { ...step, today: proposed } : step);
          if (!save(withTimeline(expected, { ...latest, steps }))) return;
          expected = read();
          useMove.disabled = true;
          status.textContent = 'Roadmap next move updated.';
        });
        preview.append(useMove);
      } else if (milestone) {
        preview.append(node('p', 'The draft supports keeping your current Roadmap next move.'));
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      refresh.disabled = false;
    }
  });
  box.append(node('p', 'Generate a fresh draft from your saved Personality answers, relevant accepted summaries, and your current Roadmap milestone when available. Generating sends those details to OpenAI.'),
    refresh, status, preview);
  return box;
}
