import { reflections, careerQuestions } from './discovery-content.js';

export function savedAnswers(state) {
  const questions = Object.fromEntries([...reflections, ...careerQuestions].map(([id, label]) => [id, label]));
  const rows = [...(state.answerHistory || [])];
  for (const section of Object.values(state.planHub || {})) rows.push(...Object.entries(section.responses || {}));
  for (const section of ['reflection', 'career']) {
    for (const [id, item] of Object.entries(state.discovery?.[section] || {})) {
      for (const value of [item.answer, item.follow, item.clarify]) rows.push([questions[id] || id, value]);
    }
  }
  for (const item of Object.values(state.deeper?.entries || {})) rows.push([item.question,item.answer],[item.followQuestion,item.follow]);
  const filled = rows.filter(([q,a]) => q && typeof a === 'string' && a.trim());
  return [...new Map(filled.map(pair => [JSON.stringify(pair), pair])).values()];
}

export function archiveAnswers(state, next, additions) {
  return { ...next, answerHistory: [...new Map([...savedAnswers(state), ...additions].filter(([,v]) => v?.trim()).map(pair => [JSON.stringify(pair),pair])).values()] };
}
