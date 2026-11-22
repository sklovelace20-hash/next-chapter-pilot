const barriers = [
  ['I’m tired', 'Pick something you can do from the couch. Play one favorite song and give it your full attention.'],
  ['I’m too busy', 'Borrow five minutes from your next break. Put on one song and move however you feel like moving.'],
  ['I feel guilty taking a break', 'Think of what you’d say to a friend who needed a little joy today. Try giving yourself the same room.'],
  ['I’m worried I’ll look silly', 'Try it where nobody’s watching. Draw something badly on purpose or sing the chorus at full volume.'],
  ['I don’t know what sounds fun', 'Think of the last thing that made you laugh. Start with something in that neighborhood, or let “Surprise me” pick.'],
  ['I’d rather have company', 'Text someone a tiny invitation. “Want to take a ten-minute walk or swap a song today?”']
];

const ideas = [
  ['One-song dance party', 'Put on a song you can’t sit still to. Kitchen, porch, chair. Wherever you are works.', ['Quick', 'Low energy']],
  ['Take a color walk', 'Pick a color and see how many places it turns up. Try it outside, from a window, or around the house.', ['Outdoors', 'Quick']],
  ['Make the ugliest drawing you can', 'Use any scrap of paper. Give yourself two minutes to draw a dog from memory, then give it a ridiculous title.', ['Quick', 'Creative']],
  ['Swap a song', 'Send a friend a song you loved years ago and ask for one that takes them back.', ['With someone', 'Low energy']],
  ['Shoot around', 'If you have a ball and a nearby hoop, take a few shots. Make up a ridiculous trick shot and see what happens.', ['Outdoors']],
  ['Rewatch the scene you quote', 'Find a favorite scene from something you already have access to. See if you still know every line.', ['Quick', 'Low energy']],
  ['Play photo bingo', 'Find something tiny, something lopsided, and something that looks like a face. Take a picture or just point it out.', ['Creative', 'Outdoors', 'With someone']],
  ['Make a tiny museum', 'Pick three objects nearby and write absurdly serious museum labels for them.', ['Creative', 'Quick']],
  ['Catch the last light', 'Step outside, sit by a window, or take the pup out during golden hour. Look for one thing you usually pass by.', ['Outdoors', 'Low energy']],
  ['Trade a bad joke', 'Call or text someone and challenge them to make you groan. The worse the joke, the better.', ['With someone', 'Quick']],
  ['Build the soundtrack to today', 'Pick three songs from music you already have access to and give the set a title.', ['Creative', 'Low energy']],
  ['Play a round of 20 Questions', 'Pick an object. Give someone twenty yes-or-no questions to guess it, then switch. Works by text, too.', ['With someone', 'Low energy']]
];

export function funPage({ get, node }) {
  const group = get('fun-barriers');
  const reframe = get('fun-reframe');
  const filter = get('fun-filter');
  const grid = get('fun-ideas');
  const pick = get('fun-pick');
  let previous;
  const matching = () => ideas.filter(([, , tags]) => !filter.value || tags.includes(filter.value));

  for (const [label, suggestion] of barriers) {
    const choice = node('button', label, 'quiet');
    choice.type = 'button';
    choice.setAttribute('aria-pressed', 'false');
    choice.onclick = () => {
      for (const entry of group.children) entry.setAttribute('aria-pressed', String(entry === choice));
      reframe.hidden = false;
      reframe.textContent = suggestion;
    };
    group.append(choice);
  }

  function renderIdeas() {
    pick.hidden = true;
    previous = undefined;
    grid.replaceChildren(...matching().map(([name, description]) => {
      const card = node('details', '', 'page-details');
      card.append(node('summary', name), node('p', description));
      return card;
    }));
  }

  filter.onchange = renderIdeas;
  get('fun-random').onclick = () => {
    const pool = matching();
    const choices = pool.length > 1 ? pool.filter((idea) => idea !== previous) : pool;
    previous = choices[Math.floor(Math.random() * choices.length)];
    pick.hidden = false;
    pick.replaceChildren(node('h3', previous[0]), node('p', previous[1]));
  };
  renderIdeas();
}
