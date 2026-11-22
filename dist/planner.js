export const modes = ['Supportive', 'Truth Mode', 'Red Team'];
const tidy = (value) => value.trim().replace(/[.!?]+$/, '');

export function draftPlan({ value, friction, result, time, protect, mode, firstAction }) {
  const action = tidy(firstAction || `Choose one small step toward “${tidy(result)}”`);
  const tracker = 'What I tried, what happened, and what I learned';
  const prompts = {
    Supportive: `When did your choices this week reflect “${tidy(value)}”? What helped, and what would make it easier next week?`,
    'Truth Mode': `What actually happened this week that shows you lived by “${tidy(value)}”? What evidence would change your answer?`,
    'Red Team': `How, if at all, might “${tidy(friction)}” affect your plan next week? What would help you adapt?`
  };
  return {
    goal: result.trim(),
    action: `${action}. Budget: ${tidy(time)}. Protect: ${tidy(protect)}.`,
    tracker,
    prompt: prompts[mode]
  };
}
