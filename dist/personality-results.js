import { profile } from './discovery-content.js';

const interpretations = [
  {
    name: 'Energy and processing', origin: 'Extraversion and Introversion (E–I)',
    meaning: 'Where you tend to direct attention and how you gather your thoughts or recover energy.',
    sides: [
      ['Talking things through can generate ideas quickly and bring others into the conversation.',
        'An early idea may sound like a final decision, or quieter people may have little time to respond.'],
      ['Thinking privately can help you notice details and bring a more considered point to the group.',
        'Others may miss your input if you wait until the discussion has moved on.']
    ],
    example: 'Before a team meeting, one person clarifies an idea by talking with a colleague. Another writes two points first. Giving everyone a minute to think before discussion makes room for both.',
    growth: 'Try giving people both a minute to write and time to talk. Notice whether more people contribute or the discussion becomes clearer.'
  },
  {
    name: 'Taking in information', origin: 'Sensing and Intuition (S–N)',
    meaning: 'What you notice first when learning or making sense of something: concrete evidence or patterns and possibilities.',
    sides: [
      ['Specific examples make it easier to spot errors, test a claim, and explain what to do.',
        'Relying on familiar examples alone can make it easier to miss a broader pattern or a new option.'],
      ['Looking for connections can reveal new explanations and directions.',
        'An appealing theory can get ahead of the evidence or leave others unsure how to act.']
    ],
    example: 'When customer sign-ups fall, one person checks the exact screens where people leave. Another sees a pattern across devices. Testing that pattern against the actual screens makes the explanation stronger.',
    growth: 'Pair one observation with one possible explanation. Name what you would check to see if the explanation holds.'
  },
  {
    name: 'Making decisions', origin: 'Thinking and Feeling (T–F)',
    meaning: 'What you tend to weigh first in a trade-off: consistent criteria or the impact on people and values.',
    sides: [
      ['Clear criteria make a decision easier to explain and apply fairly across cases.',
        'A rule can miss relevant circumstances or the impact on people who have little influence.'],
      ['Checking who is affected can reveal needs, values, and consequences a rule might miss.',
        'Trying to accommodate everyone can obscure a hard trade-off or make similar cases feel inconsistent.']
    ],
    example: 'When picking a meeting time, one person compares attendance across options. Another asks who would repeatedly be excluded. The group can use a clear rule and rotate the cost when no time works for everyone.',
    growth: 'Before deciding, write down one criterion and ask one affected person what you might be missing. Note what changed in the decision.'
  },
  {
    name: 'Organizing and adapting', origin: 'Judging and Perceiving (J–P)',
    meaning: 'How you tend to manage plans and commitments: decide early or keep options open as you learn.',
    sides: [
      ['Early milestones clarify expectations and leave time to review.',
        'An early commitment can make it harder to act on new information or can lock in the wrong approach.'],
      ['Leaving options open makes it easier to respond to feedback and unexpected opportunities.',
        'When decisions stay open too long, work can pile up or leave collaborators unsure what to do.']
    ],
    example: 'Two friends plan a trip. One books lodging early and the other waits to choose activities until the weather is clearer. They get certainty where it matters and flexibility where it helps.',
    growth: 'Set one firm checkpoint and deliberately leave one decision open until you have evidence. See whether that reduces rework or last-minute pressure.'
  }
];

const sources = [
  ['Myers & Briggs Foundation · Four preference pairs', 'https://www.myersbriggs.org/my-mbti-personality-type/the-mbti-preferences/'],
  ['McCrae and Costa · Research on preferences as dimensions', 'https://doi.org/10.1111/j.1467-6494.1989.tb00759.x'],
  ['Stieger and colleagues · Research on practicing personality change', 'https://doi.org/10.1073/PNAS.2017548118']
];

export function personalityResults(answers, node, refreshPersonality) {
  const report = node('div', '', 'personality-results');
  const result = profile(answers);
  if (!result.some(axis => axis.count)) {
    report.append(node('p', 'Answer the Personality questions in Discover to see your patterns here.'));
    return report;
  }
  report.append(node('p', 'Each result describes how you answered a set of situations. Use it to spot a habit, check it against a real example, and decide which behavior to practice.'));
  const rubric = node('details', '', 'follow-up');
  rubric.append(node('summary', 'How to read your results'),
    node('p', 'Each question counts once toward the side you picked. “It depends” counts as an answer for coverage and adds no point to either side. The difference between the two side counts gives the lean.'));
  const bands = node('ul', '');
  for (const band of [
    'Partial · Fewer than half the questions on that dimension are answered.',
    'Context-dependent · Every answer was “It depends,” or both sides received the same count.',
    'Slight lean · One side leads, but by fewer than two answers or by less than half of the answers given.',
    'Clearer lean · One side leads by at least two answers and by at least half of the answers given.'
  ]) bands.append(node('li', band));
  rubric.append(bands, node('p', 'Example · Four answers on one side, one on the other, and two “It depends” give a lead of three out of seven. That is a slight lean. Five, one, and one give a lead of four out of seven, a clearer lean.'),
    node('p', 'These are scoring rules for this exercise. The counts show your answer pattern and do not rank your skill or compare you with other people.'));
  report.append(rubric);
  result.forEach((axis, index) => {
    const guide = interpretations[index];
    const row = node('details', '', 'follow-up personality-result');
    const headline = !axis.count ? 'Unanswered' : axis.side === null ? axis.band : axis.band + ' toward ' + axis.label.toLowerCase();
    const summary = node('summary', '');
    summary.append(node('strong', guide.name), node('span', headline, 'personality-result-lean'));
    row.append(summary, node('p', guide.meaning), node('p', 'Inspired by ' + guide.origin + '.'),
      node('p', `${axis.count} of ${axis.questions.length} answered · ${axis.poles[0]} ${axis.left} · ${axis.poles[1]} ${axis.right} · It depends ${axis.neutral}`));
    guide.sides.forEach(([helps, tradeoff], side) => {
      row.append(node('h4', axis.poles[side]), node('p', 'Where it helps · ' + helps),
        node('p', 'What to watch for · ' + tradeoff));
    });
    row.append(node('h4', 'Example'), node('p', guide.example), node('h4', 'Try this'),
      node('p', axis.exercise || guide.growth),
      node('p', 'Afterward, write down what changed and when you would use that approach again.'));
    report.append(row);
  });
  const background = node('details', '', 'follow-up');
  background.append(node('summary', 'Where this comes from and how to use it'),
    node('p', 'Next Chapter’s 25-question exercise adapts four ideas from the Myers-Briggs framework, which Isabel Briggs Myers and Katharine Cook Briggs developed from Carl Jung’s theory of psychological types. The wording, scoring, and results here belong to Next Chapter. The exercise gives four separate preference readings and assigns no official MBTI type.'),
    node('p', 'Research has found that MBTI scores can behave as dimensions rather than distinct types. A close split can mean that different situations call for different approaches. A clearer lean is a place to look for examples, not a rule for what you can do.'),
    node('p', 'Patterns can work together. Someone who thinks quietly and prefers structure might prepare an excellent agenda but wait too long to share it. Sending a short draft before a meeting keeps the benefit of preparation and makes room for feedback.'),
    node('p', 'For development, choose one behavior you want to use more flexibly. Try it in a real situation, notice the outcome, and repeat or adjust. Research on targeted practice suggests that some personality traits can change over time. These exercises are opportunities to practice a behavior and observe what happens.'));
  const references = node('ul', '');
  for (const [title, url] of sources) {
    const item = node('li', '');
    const link = node('a', title);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
    references.append(item);
  }
  background.append(references);
  report.append(background);
  if (refreshPersonality) report.append(refreshPersonality());
  return report;
}
