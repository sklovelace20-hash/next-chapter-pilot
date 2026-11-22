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

export function everydayTools({ guide, node, button, addPractice, excludeResourceUrls }) {
  const collection = node('details', '', `everyday-guide everyday-${guide}`);
  collection.append(node('summary', guideNames[guide]));
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
