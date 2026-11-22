import { careerQuestions, reflections } from './discovery-content.js';
import { personalityEvidence, planQuestions, priorityQuestion } from './deeper.js';

export const profileFields = [
  ['priority', 'Top priority'], ['values', 'Values'], ['belief', 'Beliefs'],
  ['goal', 'Goal'], ['strength', 'Biggest strengths'], ['tryNext', 'What I want to try'],
  ['skill', 'Skill I want to build']
];

const catalog = [
  {
    pattern: /\b(communicat\w*|listen\w*|feedback|conversations?|present\w*|speaking|conflict)\b/i,
    name: 'Communication',
    baseline: 'How often do you check what the other person understood?',
    practice: 'In one conversation, ask an open question, paraphrase the reply, and ask whether you got it right.',
    evidence: 'What did they confirm or correct? What will you repeat next time?',
    resources: [
      ['5 ways to listen better · Julian Treasure', 'https://www.ted.com/talks/julian_treasure_5_ways_to_listen_better'],
      ['10 ways to have a better conversation · Celeste Headlee', 'https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation']
    ]
  },
  {
    pattern: /\b(writ\w*|edit\w*|storytell\w*|clarity)\b/i,
    name: 'Writing clearly',
    baseline: 'How consistently can a reader identify your main point on the first pass?',
    practice: 'Rewrite a real message with the main point first. Ask a reader to tell you what they would do next.',
    evidence: 'Which words helped the reader act? Where did they need clarification?',
    resources: [['Writing for understanding · Digital.gov', 'https://digital.gov/guides/plain-language']]
  },
  {
    pattern: /\b(analy\w*|data|spreadsheet\w*|statistics)\b/i,
    name: 'Data analysis',
    baseline: 'How independently can you turn a question into a calculation and explain what it shows?',
    practice: 'Use a small public dataset to answer one question. Write one sentence on your result and one on a limitation.',
    evidence: 'Could someone reproduce your calculation and explain the limitation back to you?',
    resources: [['Statistics and probability · Khan Academy', 'https://www.khanacademy.org/math/statistics-probability']]
  },
  {
    pattern: /\b(plann\w*|organi[sz]\w*|prioriti\w*|time management|follow through)\b/i,
    name: 'Planning and prioritizing',
    baseline: 'How often can you name the next action and what can wait?',
    practice: 'Choose one outcome for the next seven days. Give it a 20-minute appointment and name one task you will defer.',
    evidence: 'What did you do, what slipped, and what would make the plan easier next time?',
    resources: [['How to gain control of your free time · Laura Vanderkam', 'https://www.ted.com/talks/laura_vanderkam_how_to_gain_control_of_your_free_time']]
  }
];

export function practiceFor(skill) {
  const selected = skill.trim();
  if (!selected) return null;
  return catalog.find(({ pattern }) => pattern.test(selected)) || {
    name: selected,
    baseline: 'How independently can you do this in a real situation today?',
    practice: `Choose one small task that uses “${selected}.” Try it twice: once as you usually do it, then again after asking for one specific piece of feedback.`,
    evidence: 'What changed between attempts? What would make the next attempt easier?',
    resources: []
  };
}

export function mirrorSources(state) {
  const d = state.discovery || {};
  const r = state.roadmap || {};
  const prompts = Object.fromEntries([...reflections, ...careerQuestions].map(([id, question]) => [id, question]));
  const source = (label, value) => typeof value === 'string' && value.trim() ? [[label, value]] : [];
  const record = (title, object) => Object.entries(object || {}).flatMap(([key, value]) => source(`${title} · ${key}`, value));
  const responses = ['reflection', 'career'].flatMap((section) => Object.entries(d[section] || {}).flatMap(([key, entry]) =>
    source(prompts[key] || key, entry.answer).concat(source('Follow-up answer', entry.follow), source('Further clarification', entry.clarify))));
  return [
    ['My insights', (state.personalInsights || []).map((value, i) => ['Insight ' + (i + 1), value])],
    ['Plan and priorities', [
      ...record('Setup answer', state.answers), ...record('Plan', state.plan),
      ...Object.entries(state.deeper?.weeks || {}).flatMap(([week, value]) => source(`${priorityQuestion} · ${week}`, value)),
      ...planQuestions.flatMap(([key, question, follow]) => [...source(question, r[key]), ...source(follow, r[`${key}Follow`])]),
      ...['skill', 'gap', 'practice', 'experience', 'evidence', 'baseline', 'target'].flatMap((key) => source(`Roadmap · ${key}`, r[key]))
    ]],
    ['Personality, strengths and values', [
      ...personalityEvidence(d), ...source('Strengths you selected', [...(d.strengths || []), d.otherStrength].filter(Boolean).join(', ')),
      ...source('Strength in action', d.strengthExample), ...source('Five values', d.valueRounds?.[2]?.join(', ')),
      ...record('Value in action', d.valueMeaning), ...source('Value trade-off', d.tradeoff)
    ]],
    ['Reflections and career answers', [
      ...responses, ...source('Career priorities', [...(d.careerPriorities || []), d.careerOther].filter(Boolean).join(', ')),
      ...source('What comes first in a role', d.careerFirst), ...source('Earlier interpretation', d.insightClarification),
      ...source('Earlier experiment', d.insightPractice)
    ]],
    ['Check-ins and morning notes', [
      ...(state.growth?.assessments || []).flatMap((item) => [
        ...source(`${item.skill} · Rating before practice`, item.before),
        ...source(`${item.skill} · Rating after practice`, item.after),
        ...source(`${item.skill} · What happened`, item.evidence)
      ]),
      ...(state.reviews || []).flatMap((item) => record('Plan check-in', item)),
      ...Object.values(state.deeper?.entries || {}).flatMap((entry) => [...source(entry.question, entry.answer), ...source(entry.followQuestion, entry.follow)]),
      ...Object.values(d.mornings || {}).flatMap((entry) => [
        ...(entry.answers || []).flatMap((answer, index) => source(entry.questions[index], answer)),
        ...(entry.gratitude || []).flatMap((answer) => source('Grateful for', answer))
      ])
    ]]
  ].filter(([, entries]) => entries.length);
}

export function nextDraft(state) {
  if (state.growth?.confirmed) return { ...state.growth.confirmed };
  const d = state.discovery || {};
  return {
    direction: '',
    priority: Object.values(state.deeper?.weeks || {}).at(-1) || '',
    values: d.valueRounds?.[2]?.join(', ') || state.answers?.value || '',
    belief: d.reflection?.morals?.follow || d.reflection?.morals?.answer || '',
    goal: state.plan?.goal || '',
    strength: [...(d.strengths || []), d.otherStrength].filter(Boolean).join(', '),
    tryNext: d.insightPractice || state.roadmap?.practice || '',
    skill: state.roadmap?.skill || '',
    clarification: d.insightClarification || ''
  };
}
