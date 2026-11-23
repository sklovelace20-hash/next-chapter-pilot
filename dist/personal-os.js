import { mirrorSources } from './growth.js';
import { timelineFor } from './project-tracker.js';
import { libraryResources } from './library.js';
import { discoveryTopics, topicRoutes, viewRoutes } from './routes.js';

const topics = { personality: 'Personality', values: 'Values', goals: 'Goals', activities: 'Activities', skills: 'Skills and lessons', stretch: 'Stretch assignments', learning: 'Education and learning', reflection: 'Reflections and insights' };
const destinations = [
  ['Today', '/'], ['Discover', viewRoutes.discover], ['Roadmap', viewRoutes.roadmap], ['Plan Hub', viewRoutes.output],
  ['Resources', viewRoutes.library], ['Smile File', viewRoutes.accomplishments], ['Fun', viewRoutes.fun],
  ['Starting point', viewRoutes.journey], ['Welcome', viewRoutes.welcome], ['Values exercise', '/values/exercise'],
  ...Object.entries(topicRoutes).map(([key,url]) => [topics[key],url]),
  ...discoveryTopics.map(([key,title]) => ['Discover · ' + title, '/discover?topic=' + key])
];
export function personalOS(host, state, node) {
  const link = (title,url) => {
    const a = node('a',title);
    a.href = url;
    if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const title = node('h1','Personal OS');
  title.tabIndex = -1;
  const steps = timelineFor(state)?.steps || [];
  const next = steps.find(step => !step.done);
  const overview = node('section','','os-overview');
  overview.append(node('h2',state.plan?.goal || 'Your plan at a glance'),
    node('strong', next ? 'Your next move' : 'Plan status'),
    node('p',next?.today || next?.action || (steps.length ? 'All milestones complete.' : 'Choose a goal in Plan Hub to start your roadmap.')));
  if (steps.length) overview.append(node('p',steps.filter(step=>step.done).length + ' of ' + steps.length + ' milestones complete'));
  overview.append(link(next ? 'Open Roadmap' : 'Open Plan Hub',next ? viewRoutes.roadmap : viewRoutes.output));
  const search = node('input','');
  search.type = 'search';
  const label = node('label','Search your information, resources, and pages');
  label.append(search);
  const pages = node('nav','','os-links');
  pages.setAttribute('aria-label','Personal OS shortcuts');
  const records = node('div','');
  const groups = new Map();
  function add(group,title,body,url) {
    if (!title) return;
    if (!groups.has(group)) groups.set(group,[]);
    groups.get(group).push({title,body:[body].flat().filter(Boolean).join('\n'),url});
  }
  for (const [section,entries] of mirrorSources(state)) for (const [q,a] of entries) add(section,q,a);
  for (const s of steps) add('Milestones',s.title,[s.done ? 'Completed' : 'Planned',s.today,s.action,s.evidence,s.notes],viewRoutes.roadmap);
  for (const a of state.savedActivities || []) add('Activities and lessons',a.title,[a.skill,a.firstAction,...(a.steps || []),a.evidence],topicRoutes[a.mode]);
  for (const a of state.activityReflections || []) add('Activity reflections',a.title,[a.note,...Object.entries(a.answers || {}).map(([q,v])=>q+' · '+v)],topicRoutes.activities);
  for (const [key,s] of Object.entries(state.planHub || {})) if (s.accepted) add('Accepted insights',topics[key],[s.accepted.overview,...(s.accepted.insights || []),...(s.accepted.questions || [])],topicRoutes[key]);
  if (state.assessment?.summary) add('Reports','Accepted report summary',state.assessment.summary,viewRoutes.output);
  for (const a of state.accomplishments || []) add('Smile File',a.title,[a.date,a.note],viewRoutes.accomplishments);
  for (const a of state.bucketList || []) add('Bucket List Bingo',a.title,a.done ? 'Completed' : 'On my list',viewRoutes.fun);
  for (const r of libraryResources) add('Resources',r.title,[r.by,r.format,r.theme,r.description],r.url);
  const links = state.plan ? [...destinations,['Privacy Vault',viewRoutes.vault]] : destinations;
  function filter() {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = text => words.every(word=>text.toLowerCase().includes(word));
    pages.replaceChildren(...links.filter(([name])=>matches(name)).map(([name,url])=>link(name,url)));
    records.replaceChildren();
    for (const [group,items] of groups) {
      const found = items.filter(i=>matches([group,i.title,i.body].join(' ')));
      if (!found.length) continue;
      const box = node('details','','follow-up');
      box.append(node('summary',group+' ('+found.length+')'));
      box.open = words.length > 0;
      for (const item of found) {
        const row = node('div','','os-record');
        row.append(item.url ? link(item.title,item.url) : node('strong',item.title),node('p',item.body,'entry'));
        box.append(row);
      }
      records.append(box);
    }
    if (!records.childElementCount && !pages.childElementCount) records.append(node('p','No matches. Try another word.'));
  }
  search.oninput = filter;
  host.replaceChildren(title,overview,label,pages,records);
  filter();
}
