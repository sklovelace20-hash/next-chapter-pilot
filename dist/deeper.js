import { traits } from './discovery-content.js';

export const priorityQuestion = 'What’s most important to you right now?';
export const visitQuestions = [
  ['Emotions', 'What feeling has been most present since you last checked in?', 'What was happening the last time you felt it? What would have helped in that moment?'],
  ['Relationships', 'In which relationship do you feel most yourself right now?', 'What happens there that you would like more of elsewhere?'],
  ['Work', 'How did you feel at the end of your last workday?', 'Which moment contributed to that feeling? What about it mattered to you?'],
  ['Money', 'When you think about money today, what feeling comes up?', 'What do you know about the situation, and what are you still unsure about?'],
  ['Friendships', 'What feels easy or difficult in your friendships lately?', 'When did you last notice it? What would you want a friend to understand?'],
  ['Emotions', 'Was there a moment you wanted to pull back or speak up?', 'What did you expect might happen? What did you want to protect?'],
  ['Relationships', 'Is there a conversation you wish had gone differently?', 'What did they actually say or do? What would you ask to check your interpretation?'],
  ['Work', 'Which part of work recently made you curious, proud, or uneasy?', 'What did that moment ask of you? What might you try with room to experiment?'],
  ['Money', 'Is there a money decision taking up your attention?', 'What would give you more room to decide: information, time, a conversation, or something else?'],
  ['Friendships', 'Who would you like to make more room for, if anyone?', 'What kind of contact would fit the time and energy you actually have?'],
  ['Emotions', 'What do you need more of today: action, support, rest, or something else?', 'What would make that feel possible? What could wait?'],
  ['Relationships', 'When did you recently feel heard or misunderstood?', 'What did you want the other person to know? What could you ask them directly?'],
  ['Work', 'When did you last have room to approach a task your own way?', 'What did you choose to do? Where else could you test that approach?'],
  ['Money', 'What would feeling more at ease about money look like in an ordinary week?', 'What part is within your control? What information or support would help?'],
  ['Friendships', 'Is there a friendship you want to understand better?', 'What have you observed? What would you like to ask before drawing a conclusion?']
];

export function weekKey(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  local.setDate(local.getDate() - (local.getDay() + 6) % 7);
  return `${local.getFullYear()}-${local.getMonth() + 1}-${local.getDate()}`;
}

export function personalityEvidence(discovery = {}) {
  return traits.flatMap((trait, axis) => trait.questions.flatMap(([question, left, right], index) => {
    const answer = discovery.traits?.[`${axis}-${index}`];
    if (answer === '1') return [[question, left]];
    if (answer === '-1') return [[question, right]];
    if (answer === '0') return [[question, 'It depends']];
    return [];
  }));
}

export const planQuestions = [
  ['whyNow', 'Why does this matter now?', 'What would you be protecting or making room for if this changed?'],
  ['recentMoment', 'When did you last run into this?', 'What did you see or hear? What were you expecting to happen?'],
  ['underneath', 'Is there a fear, worry, or concern underneath it?', 'If the outcome you worry about happened, what would be at stake for you?'],
  ['alternative', 'What else might be true?', 'What would help you tell the difference between what happened and what you expect?'],
  ['resources', 'What strength or way of working has helped in a similar situation?', 'When did it help? Where would you want support or a different approach?'],
  ['options', 'What possibilities would you consider if you had room to explore?', 'What would a small experiment look like? What would making space instead look like?'],
  ['support', 'What support or boundary would make this realistic?', 'What could you pause, change, or ask someone for?'],
  ['fallback', 'What will you do if your first plan gets blocked?', 'When will you decide to adapt the plan, take a break, or ask for help?']
];

export function deeperJourney({ read, save, node, button, notify }) {
  let displayed;

  function textField(parent, label, value) {
    const wrapper = node('label', label);
    const input = node('textarea', '');
    input.value = value || '';
    wrapper.append(input);
    parent.append(wrapper);
    return input;
  }

  function saveJourney(patch) {
    const state = read();
    return save({ ...state, deeper: { ...state.deeper, ...patch } });
  }

  function today() {
    const when = weekKey(new Date());
    const deeper = read().deeper || {};
    if (displayed === undefined) {
      displayed = deeper.nextVisit || 0;
      saveJourney({ nextVisit: displayed + 1 });
    }
    const id = displayed;
    const [topic, question, follow] = visitQuestions[id % visitQuestions.length];
    const article = node('article', '', 'deeper-check');
    article.append(node('h2', 'A moment to check in'));
    const form = node('form', '');
    const entry = deeper.entries?.[id];
    const weekly = deeper.weeks?.[when];
    let priority;
    if (!weekly) priority = textField(form, priorityQuestion);
    else {
      form.append(node('p', 'You wrote this week:'), node('blockquote', weekly, 'entry'));
      const edit = node('details', '', 'follow-up');
      edit.append(node('summary', 'Update this week’s priority'));
      priority = textField(edit, 'This week’s priority', weekly);
      form.append(edit);
    }
    form.append(node('h3', topic));
    const answer = textField(form, question, entry?.answer);
    const detail = node('details', '', 'follow-up');
    detail.append(node('summary', 'Go deeper'));
    const clarify = textField(detail, follow, entry?.follow);
    detail.open = Boolean(entry?.follow);
    form.append(detail, node('button', 'Save reflection'));
    form.onsubmit = (event) => {
      event.preventDefault();
      const state = read().deeper || {};
      const value = priority.value.trim();
      const reply = answer.value.trim();
      const deeperReply = clarify.value.trim();
      const weeks = { ...state.weeks };
      const entries = { ...state.entries };
      if (value) weeks[when] = value;
      if (reply || deeperReply) entries[id] = { topic, question, answer: reply, followQuestion: follow, follow: deeperReply, date: new Date().toISOString() };
      if (!value && !reply && !deeperReply) return notify('Add a response you want to save.');
      if (saveJourney({ weeks, entries })) {
        const replacement = today();
        article.replaceWith(replacement);
        replacement.querySelector('h2').focus();
        notify('Reflection saved.');
      }
    };
    const next = button('Different question', () => {
      const candidate = read().deeper?.nextVisit ?? id + 1;
      if (saveJourney({ nextVisit: candidate + 1 })) {
        displayed = candidate;
        const replacement = today();
        article.replaceWith(replacement);
        replacement.querySelector('h2').focus();
      }
    }, 'quiet');
    next.type = 'button';
    form.append(next);
    article.querySelector('h2').tabIndex = -1;
    article.append(form);
    const history = Object.values(deeper.entries || {}).reverse();
    const priorities = Object.entries(deeper.weeks || {}).reverse();
    if (priorities.length) {
      const past = node('details', '', 'follow-up');
      past.append(node('summary', 'Weekly priorities'));
      for (const [week, value] of priorities) past.append(node('p', `Week of ${week}`), node('blockquote', value, 'entry'));
      article.append(past);
    }
    if (history.length) {
      const previous = node('details', '', 'follow-up');
      previous.append(node('summary', 'Past reflections'));
      for (const item of history) {
        previous.append(node('h3', `${item.topic} · ${new Date(item.date).toLocaleDateString()}`));
        if (item.answer) previous.append(node('p', item.question), node('blockquote', item.answer, 'entry'));
        if (item.follow) previous.append(node('p', item.followQuestion), node('blockquote', item.follow, 'entry'));
      }
      article.append(previous);
    }
    return article;
  }

  function reset() { displayed = undefined; }
  return { today, reset };
}
