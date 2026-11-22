export function answerSelection(groups, node) {
  const wrapper = node('div', '', 'answer-selection');
  const refreshers = [];
  const rows = [];
  function selectAll(title, entries) {
    const label = node('label', '', 'select-all');
    const input = document.createElement('input');
    input.type = 'checkbox';
    label.append(input, document.createTextNode(` ${title}`));
    refreshers.push(() => {
      const checked = entries.filter(({ control }) => control.checked).length;
      input.checked = checked === entries.length;
      input.indeterminate = checked > 0 && checked < entries.length;
    });
    input.onchange = () => {
      for (const { control } of entries) control.checked = input.checked;
      refreshers.forEach((refresh) => refresh());
    };
    return label;
  }
  for (const [title, entries] of groups) {
    if (!entries.length) continue;
    const section = node('details', '', 'follow-up');
    section.append(node('summary', title));
    const group = entries.map(([question, answer]) => {
      const label = node('label', '', 'answer-choice');
      const control = document.createElement('input');
      control.type = 'checkbox';
      control.onchange = () => refreshers.forEach((refresh) => refresh());
      label.append(control, document.createTextNode(` ${question}`), node('blockquote', answer, 'entry'));
      section.append(label);
      return { control, question, answer };
    });
    if (groups.length > 1) section.insertBefore(selectAll(`Select all in ${title}`, group), section.children[1]);
    rows.push(...group);
    wrapper.append(section);
  }
  if (rows.length) wrapper.prepend(selectAll('Select all answers', rows));
  return {
    wrapper,
    selected: () => rows.filter(({ control }) => control.checked).map(({ question, answer }) => ({ question, answer }))
  };
}
