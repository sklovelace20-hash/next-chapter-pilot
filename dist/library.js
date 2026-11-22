import { middleTheoryResources, middleTheoryStarts, middleTheoryPractices } from './middle-theory-library.js';
import { everydayTools } from './everyday-tools.js';
const nextChapterResources = [
  ['Frameworks', 'Myers-Briggs personality preferences', 'The Myers & Briggs Foundation', 'https://www.myersbriggs.org/my-mbti-personality-type/myers-briggs-overview/',
    'Explore how you tend to get energy, take in information, make decisions, and approach structure.', 'When do your preferences change with the situation?'],
  ['Frameworks', 'The Enneagram', 'The Enneagram Institute', 'https://www.enneagraminstitute.com/type-descriptions/',
    'Consider patterns in attention and motivation as questions about your experience.', 'When do you react differently to the same kind of pressure?'],
  ['Frameworks', 'CliftonStrengths (StrengthsFinder)', 'Gallup', 'https://www.gallup.com/cliftonstrengths/en/252137/home.aspx',
    'Notice recurring ways you contribute, and look for situations where you can use those strengths deliberately.', 'What do people routinely ask for your help with?'],
  ['Books', 'Alcoholics Anonymous (Big Book)', 'Alcoholics Anonymous World Services', 'https://www.aa.org/the-big-book',
    'Read AA’s account of the recovery program and personal stories from members.', 'If relevant to your recovery, what do the stories help you put into words?'],
  ['Books', 'Twelve Steps and Twelve Traditions', 'Alcoholics Anonymous World Services', 'https://www.aa.org/twelve-steps-twelve-traditions',
    'Explore AA’s explanations of its Steps and Traditions, including reflection, responsibility, and community.', 'If relevant to you, where would honest reflection or asking for help make a difference?'],
  ['Books', 'Daring Greatly', 'Brené Brown', 'https://brenebrown.com/book/daring-greatly/',
    'Explore vulnerability, courage, and connection.', 'Where would a small act of honesty help you show up more fully?'],
  ['Books', 'Think Again', 'Adam Grant', 'https://adamgrant.net/book/think-again/',
    'Practice updating beliefs when better information appears.', 'What evidence would change your mind about a current decision?'],
  ['Books', 'Atomic Habits', 'James Clear', 'https://jamesclear.com/atomic-habits',
    'Build repeatable actions by making the first step small and shaping the environment around it.', 'What existing routine could make a new action easier to remember?'],
  ['Books', 'Good to Great', 'Jim Collins', 'https://www.jimcollins.com/books.html#good-to-great',
    'Borrow a planning question from organizational research about what deserves sustained attention.', 'Which choice fits your interests, demonstrated strengths, and available resources?'],
  ['Books', 'Eat That Frog!', 'Brian Tracy', 'https://bkconnection.com/collections/bestsellers/products/9798890570925_eat-that-frog-fourth-edition',
    'Identify a high-impact task and give it a realistic slot before less important work.', 'Which task would make the most meaningful difference if you started it today?'],
  ['Podcasts', 'Unlocking Us', 'Brené Brown', 'https://brenebrown.com/podcasts/',
    'Conversations about connection, courage, and how people relate to one another.', 'What idea from an episode would you try in a real conversation?'],
  ['Podcasts', 'WorkLife', 'Adam Grant · TED', 'https://www.ted.com/podcasts/worklife',
    'Explore practical questions about motivation, collaboration, and how people work.', 'What would you test with a colleague before adopting an idea?'],
  ['Memoirs', 'The Light We Carry', 'Michelle Obama', 'https://michelleobamabooks.com/',
    'Personal stories about finding steadiness and connection in uncertain times.', 'What example helps you recognize a source of support in your own life?'],
  ['Publications', 'Daily Reflections', 'Alcoholics Anonymous World Services', 'https://www.aa.org/daily-reflections',
    'Daily reading and reflection written for the AA recovery community.', 'If useful to you, what would you take from today’s reading into the next 24 hours?'],
  ['Publications', '3-2-1 Newsletter', 'James Clear', 'https://jamesclear.com/3-2-1',
    'Short ideas and a question to consider as part of a regular reflection practice.', 'Which idea is worth testing, and how would you tell if it helped?']
];

const themes = ['Authenticity', 'Authenticity', 'Purpose', 'Recovery', 'Recovery', 'Relationships',
  'Purpose', 'Habits', 'Purpose', 'Habits', 'Relationships', 'Purpose', 'Emotions', 'Recovery', 'Habits'];
const formats = { Frameworks: 'Framework', Books: 'Book', Podcasts: 'Podcast', Memoirs: 'Memoir', Publications: 'Publication' };
const resourceKey = (value) => {
  const url = new URL(value);
  return url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') + url.hash;
};

const authorBooks = [
  ['Brené Brown', [
    ['Strong Ground', 'https://brenebrown.com/book/strong-ground/'],
    ['Atlas of the Heart', 'https://brenebrown.com/book/atlas-of-the-heart/'],
    ['Dare to Lead', 'https://brenebrown.com/book/dare-to-lead/'],
    ['You Are Your Best Thing', 'https://brenebrown.com/book/you-are-your-best-thing/', 'Co-edited with Tarana Burke'],
    ['The Gifts of Imperfection', 'https://brenebrown.com/book/the-gifts-of-imperfection/'],
    ['Braving the Wilderness', 'https://brenebrown.com/book/braving-the-wilderness/'],
    ['Rising Strong', 'https://brenebrown.com/book/rising-strong/'],
    ['Daring Greatly', 'https://brenebrown.com/book/daring-greatly/'],
    ['I Thought It Was Just Me (But It Isn’t)', 'https://brenebrown.com/book/i-thought-it-was-just-me/'],
    ['The Power of Vulnerability', 'https://www.soundstrue.com/products/the-power-of-vulnerability', 'Audio program'],
    ['Rising Strong as a Spiritual Practice', 'https://www.soundstrue.com/products/rising-strong-as-a-spiritual-practice', 'Audio program']
  ]],
  ['Adam Grant', [
    ['Vibe', 'https://adamgrant.net/book/vibe/'],
    ['Hidden Potential', 'https://adamgrant.net/book/hidden-potential/'],
    ['Think Again', 'https://adamgrant.net/book/think-again/'],
    ['Originals', 'https://adamgrant.net/book/originals/'],
    ['Give and Take', 'https://adamgrant.net/book/give-and-take/'],
    ['Option B', 'https://adamgrant.net/book/option-b/', 'With Sheryl Sandberg'],
    ['Leif and the Fall', 'https://www.penguinrandomhouse.com/books/610621/leif-and-the-fall-by-allison-sweet-grant-and-adam-grant-illustrated-by-merrilee-liddiard/', 'With Allison Sweet Grant'],
    ['The Gift Inside the Box', 'https://www.penguinrandomhouse.com/books/610620/the-gift-inside-the-box-by-adam-grant-and-allison-sweet-grant-illustrated-by-diana-schoenbrun/', 'With Allison Sweet Grant'],
    ['Power Moves', 'https://www.audible.com/pd/Power-Moves-Audiobook/B07H4XVBBW', 'Audio original']
  ]]
];
const bookCollections = new Map(authorBooks.flatMap(([author, books]) =>
  books.map(([, url]) => [resourceKey(url), author])));
const catalogBooks = authorBooks.flatMap(([by, books]) => books.map(([title, url, description]) =>
  ({ format: 'Book', theme: 'Purpose', title, by, url, description })));

export const libraryResources = [...new Map([
  ...catalogBooks,
  ...middleTheoryResources,
  ...nextChapterResources.map(([category, title, by, url, description, prompt], index) =>
    ({ format: formats[category], theme: themes[index], title, by, url, description, prompt }))
].map((resource) => [resourceKey(resource.url), resource])).values()];



export function filterLibrary(resources, { query = '', format = '', theme = '', featured = false } = {}) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return resources.filter((resource) => {
    if ((format && resource.format !== format) || (theme && resource.theme !== theme) || (featured && !resource.featured)) return false;
    const text = [resource.title, resource.by, resource.format, resource.theme, resource.description, resource.prompt].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

const sections = [
  ['All', []],
  ['Books', ['Book', 'Memoir', 'Borrowing']],
  ['Listen & read', ['Podcast', 'Substack', 'Newsletter', 'Craft archive', 'Publication']],
  ['Tools', ['Tool', 'Community', 'Framework']],
  ['Guides', []]
];

export function library({ host, node, button }) {
  let filter = {};
  let active = 'All';


  function openSeparately(link) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function externalLink(label, url) {
    const link = node('a', label);
    link.href = url;
    return openSeparately(link);
  }

  function resourceCard(title, caption, resources) {
    const card = node('details', '', 'library-resource');
    const summary = node('summary', '', 'resource-summary');
    summary.append(node('strong', title), node('span', caption, 'library-credit'));
    const list = node('ul', '', 'resource-items');
    for (const resource of resources) {
      const item = node('li', '');
      item.append(externalLink(resource.title, resource.url));
      if (resource.description) item.append(node('p', resource.description));
      if (resource.prompt) item.append(node('p', resource.prompt));
      list.append(item);
    }
    card.append(summary, list);
    return card;
  }

  function resourceCards(items) {
    const collections = new Map();
    const cards = [];
    for (const item of items) {
      const author = bookCollections.get(resourceKey(item.url));
      if (author) {
        if (!collections.has(author)) collections.set(author, []);
        collections.get(author).push(item);
      } else {
        const caption = [item.by, item.theme].filter(Boolean).join(' · ');
        cards.push(resourceCard(item.title, caption, [item]));
      }
    }
    return [...Array.from(collections, ([author, books]) =>
      resourceCard(author + ' books', books.length + (books.length === 1 ? ' title' : ' titles'), books)), ...cards];
  }

  function collection(title, items) {
    const content = node('details', '', 'everyday-guide library-collection');
    content.append(node('summary', title));
    for (const item of items) {
      const entry = node('section', '', 'library-entry');
      entry.append(node('h3', item.title));
      if (item.meta) entry.append(node('p', item.meta, 'library-credit'));
      const paragraph = node('p', '');
      for (const part of item.body) {
        paragraph.append(typeof part === 'string' ? document.createTextNode(part) : externalLink(part.title, part.url));
      }
      entry.append(paragraph);
      content.append(entry);
    }
    return content;
  }

  function render() {
    const intro = node('div', '', 'section-intro topic-intro topic-learning library-intro');
    const heading = node('h1', 'Resources');
    heading.tabIndex = -1;
    intro.append(heading, node('p', 'Find books, listening, and practical tools.'));
    const nav = node('nav', '', 'library-sections');
    nav.setAttribute('aria-label', 'Resource sections');
    const sectionButtons = sections.map(([title, formats]) => {
      const control = button(title, () => {
        selectSection(title, formats);
        if (window.location.hash === '#library-guides') {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        window.scrollTo(0, 0);
      }, 'quiet');
      nav.append(control);
      return control;
    });
    nav.append(externalLink('Courses', '/learning'));
    const resources = node('section', '', 'library-results');
    const controls = node('div', '', 'library-controls');
    const searchLabel = node('label', 'Search resources');
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Title, creator, or keyword';
    search.value = filter.query || '';
    searchLabel.append(search);
    controls.append(searchLabel);
    const filters = node('details', '', 'follow-up library-filters');
    const filterSummary = node('summary', 'Filters');
    const filterFields = node('div', '', 'library-filter-fields');
    filters.append(filterSummary, filterFields);
    controls.append(filters);

    function select(label, key, emptyLabel) {
      const wrapper = node('label', label);
      const input = document.createElement('select');
      input.add(new Option(emptyLabel, ''));
      if (key !== 'format') {
        const options = [...new Set(libraryResources.map((resource) => resource[key]))].sort();
        for (const value of options) input.add(new Option(value, value));
      }
      input.value = filter[key] || '';
      input.onchange = refresh;
      wrapper.append(input);
      filterFields.append(wrapper);
      return input;
    }

    const format = select('Format', 'format', 'All formats');
    const theme = select('Topic', 'theme', 'All topics');
    const featuredLabel = node('label', '', 'library-featured');
    const featured = document.createElement('input');
    featured.type = 'checkbox';
    featured.checked = Boolean(filter.featured);
    featured.onchange = refresh;
    featuredLabel.append(featured, document.createTextNode(' Start-here picks'));
    const reset = button('Clear filters', () => {
      search.value = format.value = theme.value = '';
      featured.checked = false;
      refresh();
      search.focus();
    }, 'quiet');
    filterFields.append(featuredLabel, reset);
    search.oninput = refresh;

    const count = node('p', '', 'library-count');
    count.setAttribute('role', 'status');
    const grid = node('div', '', 'learning-browser learning-grid');
    function showResults() {
      const [, sectionFormats] = sections.find(([title]) => title === active);
      const collection = sectionFormats.length
        ? libraryResources.filter(resource => sectionFormats.includes(resource.format))
        : libraryResources;
      const results = filterLibrary(collection, filter);
      const applied = [filter.format, filter.theme, filter.featured].filter(Boolean).length;
      filterSummary.textContent = applied ? `Filters (${applied})` : 'Filters';
      const formats = [...new Set(results.map(resource => resource.format))];
      grid.replaceChildren(...formats.map(formatName => {
        const items = results.filter(resource => resource.format === formatName);
        const category = node('section', '', 'learning-category');
        category.append(node('h2', formatName + ' (' + items.length + ')'));
        const topics = node('div', '', 'learning-topics');
        topics.append(...resourceCards(items));
        category.append(topics);
        return category;
      }));
      count.textContent = results.length ? results.length + ' resources' : 'No matching resources. Try a different search or clear the filters.';
    }

    function refresh() {
      filter = { query: search.value, format: format.value, theme: theme.value, featured: featured.checked };

      showResults();
    }

    function selectSection(title, formats) {
      active = title;
      resources.hidden = title === 'Guides';
      guides.hidden = !resources.hidden;
      sectionButtons.forEach(control => control.setAttribute('aria-pressed', String(control.textContent === title)));
      if (resources.hidden) return;
      const options = [...(formats.length ? formats : new Set(libraryResources.map(resource => resource.format)))].sort();
      format.replaceChildren(new Option('All formats', ''), ...options.map(value => new Option(value, value)));
      format.value = options.includes(filter.format) ? filter.format : '';
      refresh();
    }

    const guides = node('section', '', 'everyday-library');
    guides.id = 'library-guides';
    const guideHeader = node('div', '', 'section-intro everyday-library-intro');
    guideHeader.append(node('h2', 'Guides and practices'));
    guides.append(guideHeader,
      collection('Where to start', middleTheoryStarts),
      collection('Four practices to try', middleTheoryPractices),
      everydayTools({ guide: 'living', node, button, excludeResourceUrls: new Set(libraryResources.map(({ url }) => resourceKey(url))) }),
      everydayTools({ guide: 'growing', node, button }));
    for (const link of guides.querySelectorAll('a')) openSeparately(link);
    resources.append(controls, count, grid);
    host.replaceChildren(intro, nav, resources, guides);
    const selected = sections.find(([title]) => title === active);
    selectSection(window.location.hash === '#library-guides' ? 'Guides' : selected[0], selected[1]);
  }
  return { render };
}
