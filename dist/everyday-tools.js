import { everydayGuides } from './everyday-content.js';

const guideNames = {
  living: 'A Guide for Living',
  feeling: 'A Guide for Feeling',
  growing: 'A Guide for Growing',
  work: 'Career paths and skills',
  skills: 'A Guide for Skills Building',
  classes: 'Free Classes'
};

const paragraphText = (runs) => runs.map((run) => typeof run === 'string' ? run : run.text).join('');

function paragraph(runs, node) {
  const result = node('p', '');
  for (const run of runs) {
    if (typeof run === 'string') {
      result.append(document.createTextNode(run));
    } else if (run.url) {
      const link = node('a', run.text);
      link.href = run.url;
      result.append(link);
    } else {
      result.append(node('strong', run.text));
    }
  }
  return result;
}

export function learningCards({ node, skills, practiceFor }) {
  const categories = [
    ...everydayGuides.classes.filter(section => section.title !== "Free classes and educational catalogs").map(section => [section.title, section.items.map(item => item.title)]),
    ['Study & writing', ['Learning and study', 'Writing and communication', 'Academic reading and writing', 'General education textbooks', 'Open the four-week learning plan']],
    ['Wellbeing & everyday life', ['Psychology', 'Mental health self-help', 'Stress skills', 'Personal finance', 'Emergency preparedness']],
    ['Technology & data', ['Adult digital basics', 'Excel', 'Math and statistics', 'Programming', 'Web development', 'SQL', 'Data analysis and machine learning', 'AI and digital literacy', 'Defensive cybersecurity']],
    ['Business & leadership', ['Sales and customer discovery', 'Marketing and analytics', 'Leadership and operations', 'Project management']],
    ['Creativity, languages & local classes', ['Arts and design', 'Languages', 'Asheville-area learning']]
  ];
  const entries = everydayGuides.classes.flatMap(section => section.items);
  const byTitle = new Map(entries.map(entry => [entry.title, entry]));
  const groups = categories.map(([title, names]) => [title, names.map(name => byTitle.get(name)).filter(Boolean)]);
  const assigned = new Set(categories.flatMap(([, names]) => names));
  const extra = entries.filter(entry => !assigned.has(entry.title));
  if (extra.length) groups.push(['More learning topics', extra]);
  const tailored = skills.map(skill => ({
    title: skill, body: (practiceFor(skill)?.resources || []).map(([text,url]) => [{text,url}])
  })).filter(entry => entry.body.length);
  if (tailored.length) groups.push(['Resources for my skills', tailored]);
  const root = node('section', '', 'learning-browser');
  const label = node('label', 'Find a learning topic');
  const search = node('input'); search.type = 'search'; label.append(search);
  const grid = node('div', '', 'learning-grid');
  const status = node('p'); status.setAttribute('role','status');
  root.append(label, grid, status);
  const cards = groups.map(([title, items]) => {
    const card = node('details', '', 'learning-category');
    card.append(node('summary', title));
    const topics = node('div', '', 'learning-topics');
    const rows = items.map(entry => {
      const detail = node('details', '', 'learning-topic');
      detail.append(node('summary', entry.title));
      for (const line of entry.body) detail.append(paragraph(line,node));
      topics.append(detail);
      return {detail, text:[title,entry.title,...entry.body.map(paragraphText)].join(' ').toLowerCase()};
    });
    card.append(topics); grid.append(card);
    return {card,rows};
  });
  search.oninput = () => {
    const query = search.value.trim().toLowerCase();
    let total = 0;
    for (const {card,rows} of cards) {
      let matches = 0;
      for (const {detail,text} of rows) {
        detail.hidden = !text.includes(query);
        if (!detail.hidden) matches++;
      }
      card.hidden = !matches;
      card.open = Boolean(query && matches);
      total += matches;
    }
    status.textContent = query ? (total ? total + ' matching topics' : 'No matching topics.') : '';
  };
  return root;
}

export function everydayTools({ guide, node, button, addPractice, excludeResourceUrls }) {
  const collection = node('details', '', `everyday-guide everyday-${guide}`);
  collection.append(node('summary', guideNames[guide]));
  if (guide === 'living') {
    collection.append(node('p', 'These reflections draw from Alcoholics Anonymous. Whether you’re thinking about quitting drinking, cutting back, or working through something else entirely, there’s room for you here. Maybe you keep replaying the same argument. Maybe there’s someone you’d like to forgive, and part of you is still mad. Start there. Pick one question that feels honest today. Sometimes noticing your part, asking for help, or deciding what you’re ready to put down gives you a little more room to grow.'));
  }
  const searchLabel = node('label', 'Find a topic in this guide');
  const search = document.createElement('input');
  search.type = 'search';
  searchLabel.append(search);
  const status = node('p', '', 'everyday-count');
  status.setAttribute('aria-live', 'polite');
  collection.append(searchLabel, status);

  const sections = everydayGuides[guide].map((section) => {
    const group = node('section', '', 'everyday-group');
    group.append(node('h3', section.title));
    for (const line of section.intro) group.append(paragraph(line, node));
    const entries = section.items.filter((entry) => {
      if (!excludeResourceUrls) return true;
      const links = entry.body.flat().filter((run) => run.url);
      if (links.length !== 1) return true;
      const url = new URL(links[0].url);
      const key = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') + url.hash;
      return !excludeResourceUrls.has(key);
    }).map((entry) => {
      const detail = node('details', '', 'follow-up everyday-entry');
      detail.append(node('summary', entry.title));
      for (const line of entry.body) detail.append(paragraph(line, node));
      if (addPractice && guide === 'skills' && /^\d+\. /.test(entry.title)) {
        const title = entry.title.replace(/^\d+\. /, '');
        const practice = entry.body.map(paragraphText).join('\n');
        detail.append(button('Add to my roadmap', () => addPractice(title, practice), 'quiet'));
      }
      group.append(detail);
      const text = [entry.title, ...entry.body.map(paragraphText)].join(' ').toLowerCase();
      return { detail, text };
    });
    collection.append(group);
    return { group, searchText: section.title.toLowerCase(), entries };
  });

  function filter() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    for (const { group, searchText, entries } of sections) {
      let matches = 0;
      for (const { detail, text } of entries) {
        detail.hidden = Boolean(query && !text.includes(query) && !searchText.includes(query));
        if (!detail.hidden) matches += 1;
      }
      group.hidden = matches === 0;
      count += matches;
    }
    status.textContent = count ? `${count} ${count === 1 ? 'entry' : 'entries'}` : 'No matching entries.';
  }
  search.addEventListener('input', filter);
  filter();
  return collection;
}
