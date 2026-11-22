import { practiceFor } from './growth.js';

export const areas = ['Health and energy', 'Work and learning', 'Relationships and community', 'Money and stability', 'Meaning and personal growth'];
export const rounds = [
  ['Your current situation',
    'What made you open Next Chapter today?', 'What feels most steady in your life right now?', 'Which part of a normal week feels hardest?',
    'Where do you have energy you’d like to use more often?', 'How are your relationships affecting your week?', 'How does work or learning feel lately?',
    'What practical pressures are taking up room?', 'What do you wish there were more time for?', 'What has already helped, even briefly?', 'If one thing changed, what would you notice first?'],
  ['The pattern',
    'When did this last happen? Describe one moment.', 'What happened right before it?', 'What did you actually see or hear?',
    'What did you assume it meant?', 'When does the pattern ease up?', 'What have you been doing to manage it?',
    'What does that approach protect?', 'What does that approach cost you?', 'What still needs explaining?', 'What question would you ask next?'],
  ['What is at stake',
    'What are you worried might happen if something changes?', 'What fact supports that concern?', 'What evidence points another way?',
    'Whose expectations are involved?', 'What would you want to protect?', 'How might someone who knows you well describe this?',
    'Where, if anywhere, are you holding back?', 'When has caution served you well?', 'What would make a small step feel safer?', 'What would feel premature to decide?'],
  ['Possibility and support',
    'What could become possible if this shifted?', 'What option have you not given yourself permission to consider?', 'What might help even if the situation stays the same?',
    'Which strength could you put to work?', 'What skill would help you test an idea?', 'Who could offer useful feedback?',
    'What boundary would make room for this?', 'What could you try without making a large commitment?', 'What could you stop doing or set aside?', 'What would you want to learn from an experiment?'],
  ['Readiness and direction',
    'What feels clear now?', 'Which part is still uncertain?', 'What outcome would be worth your time over 90 days?',
    'What would count as evidence of progress?', 'Which other priority might compete with this?', 'How much time is realistic in a difficult week?',
    'What could you practice repeatedly?', 'What support would you ask for?', 'When would you change course?', 'What is the next question you still want to answer?'],
  ['Test your understanding',
    'What would show that your current explanation is incomplete?', 'Can you name a time when the opposite was true?', 'Where are you making an assumption about someone else?',
    'What could you ask them directly?', 'What have you seen someone else do that might translate?', 'Which part could you test this week?',
    'What could you measure without much effort?', 'What response would surprise you?', 'What would you do with that result?', 'Which question has become more important?'],
  ['Make it sustainable',
    'What pace could you maintain for three months?', 'What would you do on a low-energy day?', 'What early signal would tell you to pause?',
    'Whose support would you ask for, and how?', 'What could you schedule now?', 'What could you let go of without regret?',
    'What skill would you like to use in a real situation?', 'How will you check whether that helped?', 'What do you want to remember when motivation dips?', 'What are you ready to choose?']
];
export const ideaQuestions = [
  'What are you considering, in your own words?',
  'Which part of your life would this change?',
  'What would you like to be different?',
  'What would you like to keep as it is?',
  'What would a worthwhile outcome look like in the next 90 days?'
];
export const deeperIdeaQuestions = [
  'What is a recent example that illustrates why this matters?',
  'What part feels uncertain, and what evidence would make it clearer?',
  'Which assumption are you making about yourself or the situation?',
  'When have you seen a different result? What was different then?',
  'What might you be protecting by keeping things as they are?',
  'Which part of this decision can you control or influence?',
  'What strength, skill, or kind of support could make this easier?',
  'What low-risk test would tell you whether this direction fits?',
  'What evidence would tell you to continue, adjust, or stop?',
  'What feels like the smallest useful commitment you can make this week?'
];

export function taskList(plan, targets, roadmap = {}, confirmed = {}) {
  const primary = targets[0] || {};
  const focuses = [{ ...primary, goal: plan.goal, action: roadmap?.practice || plan.action || primary.action,
    skill: roadmap?.skill || primary.skill || confirmed?.skill,
    proof: roadmap?.evidence || plan.tracker || primary.proof }, ...targets.slice(1)];
  return focuses.flatMap(({ goal, action, skill, proof }, index) => {
    const practice = practiceFor(skill || '');
    const attempt = action || (index === 0 ? confirmed?.tryNext : '') || practice?.practice ||
      'Choose and try one small step toward “' + goal + '.”';
    const evidence = proof || 'Record what you tried and one observable result.';
    const stretch = (index === 0 ? roadmap?.experience : '') ||
      (skill ? 'Use ' + skill + ' in a real situation tied to “' + goal + '.” Ask for specific feedback.'
        : 'Try what you practiced in a real situation tied to “' + goal + '.” Ask for specific feedback.');
    const secondary = index === 0 && roadmap?.secondSkill;
    return [
      ['Start and record a baseline', [1, 7], attempt, attempt, 'Before or during your first try, record a starting point. ' + evidence],
      ['Build a repeatable practice', [8, 30], 'Repeat your chosen activity and adjust one thing after each attempt. ' + attempt,
        attempt, evidence],
      ['Try it in a real situation', [31, 60], stretch,
        secondary ? stretch + ' Look for a chance to use ' + secondary + ' as well.' : stretch,
        evidence],
      ['Review and choose what to keep', [61, 90],
        'Compare your latest evidence with your baseline. Decide what to continue or adjust for “' + goal + '.”',
        plan.prompt || 'Review what changed and choose what to try next.', evidence]
    ].map(([title, days, detail, firstAction, evidence], phase) => ({
      id: `${index}-${phase}`, title, days, timing: `Days ${days.join('–')}`, detail, firstAction, goal, skill, evidence
    }));
  });
}
