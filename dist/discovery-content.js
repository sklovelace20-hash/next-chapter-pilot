export const values = [
  'Achievement', 'Adventure', 'Authenticity', 'Autonomy', 'Belonging', 'Compassion',
  'Courage', 'Creativity', 'Curiosity', 'Fairness', 'Faith', 'Family', 'Freedom',
  'Friendship', 'Generosity', 'Growth', 'Health', 'Honesty', 'Humility', 'Integrity',
  'Joy', 'Justice', 'Learning', 'Loyalty', 'Peace', 'Responsibility', 'Security',
  'Service', 'Stability', 'Wisdom'
];
export const valueTargets = [15, 10, 5];
export const priorities = ['Time for life outside work', 'Pay', 'Stability', 'Flexibility', 'Autonomy',
  'Learning and growth', 'Meaning and impact', 'Supportive colleagues', 'Advancement', 'Location'];
export const strengths = ['Listening', 'Explaining', 'Organizing', 'Analyzing', 'Creating',
  'Building relationships', 'Solving problems', 'Leading', 'Learning quickly', 'Following through'];

export const traits = [
  { poles: ['Outward processing', 'Quiet processing'], questions: [
    ['After a demanding day, what usually helps you reset?', 'Talking or spending time with someone', 'Time alone with fewer inputs'],
    ['When an idea is half formed, what helps you develop it?', 'Talking it through', 'Thinking or writing first'],
    ['When joining a new group, what feels more natural?', 'Start a conversation and find my footing', 'Observe first and join when ready'],
    ['When good news arrives, what feels natural?', 'Tell someone right away', 'Take it in first'],
    ['Before a difficult conversation, what helps?', 'Rehearse out loud with someone', 'Make notes privately'],
    ['On a long group trip, what restores you?', 'Shared activity', 'A break on my own'],
    ['With a new project, where do you get energy?', 'Exchanging ideas with others', 'Working through an idea independently']
  ], practice: ['Invite a partner to think aloud, then write down your conclusion.', 'Write down one thought before a meeting and share it early.'] },
  { poles: ['Concrete details', 'Patterns and possibilities'], questions: [
    ['When learning something new, what hooks you first?', 'A worked example', 'The big idea behind it'],
    ['What do you notice first when a plan changes?', 'The details that have to change', 'The possibilities that open up'],
    ['When explaining an idea, where do you start?', 'A specific example', 'How the pieces fit together'],
    ['What earns your trust in a new idea?', 'Evidence it has worked', 'A plausible connection to what could work'],
    ['How do you remember an event?', 'Specific scenes and details', 'Its overall meaning'],
    ['What kind of instructions help most?', 'Clear examples and steps', 'The purpose and room to interpret']
  ], practice: ['After collecting facts, name two possible patterns that could explain them.', 'Turn one idea into a concrete example with a visible result.'] },
  { poles: ['Consistent criteria', 'People and values'], questions: [
    ['In a hard decision, what do you look at first?', 'Which choice best meets the criteria', 'Who will be affected and how'],
    ['When giving feedback, what do you plan first?', 'The point I need to make clearly', 'How the other person might receive it'],
    ['When a team disagrees, what helps you move forward?', 'Agreeing on a fair decision rule', 'Understanding what each person cares about'],
    ['What makes a trade-off easier?', 'Comparing outcomes against criteria', 'Talking through what matters to people'],
    ['What do you check after a tough choice?', 'Whether the reasoning holds up', 'How the people involved are doing'],
    ['What makes a disagreement feel resolved?', 'A clear decision and rationale', 'A sense that people were understood']
  ], practice: ['Before deciding, ask one affected person what you may be missing.', 'Write down a clear decision rule and check whether you applied it consistently.'] },
  { poles: ['Structure', 'Adaptability'], questions: [
    ['How do you prefer to start an open-ended project?', 'Set milestones and choose a direction', 'Explore a few options before committing'],
    ['When you have a free afternoon, what sounds better?', 'Make a plan for something I want to do', 'Leave room for what comes up'],
    ['When information is incomplete, what feels more natural?', 'Pick a provisional plan and move', 'Keep options open until more is clear'],
    ['How do you prefer to work near a deadline?', 'Finish early enough to review', 'Keep room to adapt until near the deadline'],
    ['When traveling, what feels good?', 'Booking the essentials ahead', 'Deciding some things along the way'],
    ['When priorities shift, what do you do first?', 'Rebuild the plan', 'Try the next useful move']
  ], practice: ['Leave one part of the plan open until you collect feedback.', 'Give an experiment a deadline and a clear definition of done.'] }
];

export const reflections = [
  ['life', 'What part of your life feels most like yours right now?', 'What are you doing in those moments that you wish you did more often?'],
  ['stuck', 'Where do you keep getting stuck?', 'Think of the last time it happened. What happened just before you stopped?'],
  ['block', 'What do you tell yourself just before you hold back?', 'When has that belief helped you? When has it cost you something?'],
  ['communication', 'Where do conversations tend to go off track?', 'What did you mean to say? What might the other person have heard?'],
  ['morals', 'What feels wrong to compromise, even when it would make life easier?', 'What belief sits underneath that line? Where did it come from?'],
  ['important', 'What gets your best time and attention? Is it what matters most?', 'What would you protect if you had to give something up?'],
  ['wand', 'If you could wave a magic wand and change one thing in your life, what would change?', 'What would you notice on an ordinary Tuesday? Which small part could you start now?'],
  ['others', 'How do people likely perceive you today?', 'What have they actually said or done that gives you that impression?'],
  ['self', 'How do you see yourself?', 'When is that description most true? What part of you does it leave out?'],
  ['desired', 'How do you want people to experience you?', 'What would someone see you do if they experienced you that way?'],
  ['alignment', 'Do your actions match that? Why or why not?', 'What could you do differently in one conversation this week?'],
  ['emotion', 'What emotion keeps showing up lately?', 'When does it arrive, what might it be telling you, and what do you need in that moment?'],
  ['awe', 'What’s the last thing you saw that blew your mind?', 'What surprised you about it? What did it make you curious about?'],
  ['sky', 'When did you last look up and notice the moon, stars, a rainbow, or the clouds?', 'What made you pause? What changed when you paid attention?'],
  ['wonder', 'What ordinary thing would you miss if it disappeared tomorrow?', 'What does that tell you about what you want to notice or protect?']
];

export const careerQuestions = [
  ['skill', 'What are your top skills, and why do you think so?', 'Name a specific result, or something people ask you for help with.'],
  ['likes', 'What do you like most about your current or most recent role?', 'Which part of the task feels good: solving, creating, helping, deciding, or something else?'],
  ['dislikes', 'What drains you, even when you do it well?', 'Is it the task, the pace, the people, or the way the job is set up?'],
  ['flow', 'What work could absorb you so fully it hardly feels like work?', 'What are you doing, who is with you, and what can you point to afterward?'],
  ['habits', 'How do you naturally work when things go well?', 'Think about pace, structure, collaboration, deep focus, and how you learn.'],
  ['desire', 'What do you want more of in your next role?', 'What would you willingly give up to get it?']
];

export const morningSets = [
  ['What are you feeling as you start today?', 'What deserves your best attention?', 'What small action would honor a value today?'],
  ['What are you carrying from yesterday?', 'Where might you need to ask for help?', 'What would make today feel well spent?'],
  ['What do you want to notice today?', 'What conversation could use more care?', 'What can you do today that your future self will thank you for?']
];

export function profile(answers) {
  return traits.map((trait, axis) => {
    const responses = trait.questions.map((_, index) => answers[`${axis}-${index}`])
      .filter(value => [1, 0, -1, '1', '0', '-1'].includes(value)).map(Number);
    const left = responses.filter(value => value === 1).length;
    const right = responses.filter(value => value === -1).length;
    const count = responses.length;
    const margin = Math.abs(left - right);
    const side = left === right ? null : left > right ? 0 : 1;
    const band = count < Math.ceil(trait.questions.length / 2) ? 'Partial'
      : side === null ? 'Context-dependent'
        : margin >= 2 && margin * 2 >= count ? 'Clearer lean' : 'Slight lean';
    return { ...trait, count, left, right, neutral: count - left - right, side, band,
      label: side === null ? 'Flexible across both' : trait.poles[side],
      exercise: side === null ? '' : trait.practice[side] };
  });
}

const roles = [
  ['Learning and development', /teach|coach|explain|learn|mentor|training/i, 'Facilitate a 15-minute lesson and ask a learner what stuck.'],
  ['User research', /listen|curio|research|interview|pattern|question|understand/i, 'Interview two people about one problem and synthesize what you heard.'],
  ['Project operations', /organi[sz]|planning|coordinat|process|follow|structure/i, 'Run a small project with a milestone, an owner, and one review.'],
  ['Product or service design', /creat|design|build|prototype|problem/i, 'Prototype one improvement and watch someone try it.'],
  ['Data analysis', /analy|data|number|evidence|quant/i, 'Answer one question with a public dataset and explain the result in plain language.'],
  ['Community or customer success', /relationship|commun|help|service|support|people/i, 'Help someone reach a goal and write down what made the difference.'],
  ['Writing and communications', /writ|edit|story|explain|communicat/i, 'Write a short explainer for a real audience and ask where they lost the thread.']
];

export function careerIdeas(career, selectedStrengths) {
  const fields = ['skill', 'likes', 'flow', 'habits', 'desire'];
  const positive = fields.map((field) => career[field] || '').concat(selectedStrengths);
  if (!positive.some((value) => value.trim())) return [];
  return roles.map(([title, pattern, practice]) => ({
    title, practice, clues: positive.map((value) => value.match(pattern)?.[0]).filter(Boolean),
    potentialFriction: pattern.test(career.dislikes || '')
  })).filter((role) => role.clues.length).sort((a, b) => b.clues.length - a.clues.length).slice(0, 3);
}
