export const topicRoutes = {
  personality: '/personality',
  values: '/values',
  goals: '/goals',
  activities: '/activities',
  skills: '/skills',
  stretch: '/stretch-assignments',
  learning: '/learning',
  reflection: '/reflections'
};

export const viewRoutes = {
  personal: '/personal-os',
  welcome: '/welcome',
  fun: '/fun',
  journey: '/start',
  discover: '/discover',
  roadmap: '/roadmap',
  output: '/plan',
  library: '/library',
  accomplishments: '/smile-file',
  vault: '/vault'
};

export const discoveryTopics = [['profile', 'Personality'], ['values', 'Values'], ['reflection', 'Reflection'],
  ['morning', 'Morning'], ['career', 'Career'], ['insights', 'Insights']];

export const valuesExerciseRoute = '/values/exercise';
export const pagePaths = [
  '/', valuesExerciseRoute, ...Object.values(viewRoutes), ...Object.values(topicRoutes)
];

export function pageAt(path) {
  const [pathname, query] = path.split('?');
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/' && new URLSearchParams(query).get('explore') === '1') {
    return { view: 'dashboard', path: '/?explore=1' };
  }
  if (clean === viewRoutes.discover) {
    const requested = new URLSearchParams(query).get('topic');
    if (discoveryTopics.some(([topic]) => topic === requested)) {
      return { view: 'discover', section: requested, path: `${clean}?topic=${requested}` };
    }
  }
  if (clean === valuesExerciseRoute) return { view: 'discover', section: 'values', path: clean };
  const topic = Object.keys(topicRoutes).find((key) => topicRoutes[key] === clean);
  if (topic) return { view: 'output', section: topic, path: clean };
  const view = Object.keys(viewRoutes).find((key) => viewRoutes[key] === clean);
  return view ? { view, path: clean } : { view: 'dashboard', path: '/' };
}
