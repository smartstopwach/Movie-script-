import { BeatItem, GenreType, ScriptElement, ScriptProject } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const GENRE_LIST: {
  genre: GenreType;
  tagline: string;
  runtime: string;
}[] = [
  {
    genre: 'Feature Film',
    tagline: 'Classic 3-Act cinematic structure (90–120 pages)',
    runtime: '90–120 min',
  },
  {
    genre: 'Short Film',
    tagline: 'Tight, punchy visual storytelling (5–15 pages)',
    runtime: '5–15 min',
  },
  {
    genre: 'Thriller / Mystery',
    tagline: 'Hooks, clues, red herrings & high-stakes reveals',
    runtime: '95–115 min',
  },
  {
    genre: 'Romance / Drama',
    tagline: 'Emotional arcs, chemistry, conflict & catharsis',
    runtime: '90–110 min',
  },
  {
    genre: 'Sci-Fi / Fantasy',
    tagline: 'World-building, rules, wonder & high-concept stakes',
    runtime: '100–130 min',
  },
  {
    genre: 'Action / Adventure',
    tagline: 'Cold opens, set-pieces & relentless momentum',
    runtime: '95–120 min',
  },
  {
    genre: 'Comedy',
    tagline: 'Premise, escalation, callbacks & comedic payoff',
    runtime: '85–100 min',
  },
  {
    genre: 'Horror',
    tagline: 'Dread, isolation, false scares & survival climax',
    runtime: '85–105 min',
  },
];

const GENRE_BEATS: Record<GenreType, Omit<BeatItem, 'id'>[]> = {
  'Feature Film': [
    { act: 'Act I', title: 'Opening Image', description: 'Visual tone-setter showing the protagonist’s ordinary world.', done: true },
    { act: 'Act I', title: 'Inciting Incident', description: 'The event that disrupts the status quo and poses the central question.', done: false },
    { act: 'Act I', title: 'Break into Two', description: 'Protagonist commits to the journey and enters the new world.', done: false },
    { act: 'Act II', title: 'Midpoint', description: 'A major shift, false victory, or revelation raises the stakes.', done: false },
    { act: 'Act II', title: 'All Is Lost', description: 'The lowest point where the protagonist’s plan collapses.', done: false },
    { act: 'Act III', title: 'Climax', description: 'Final confrontation resolving the external & internal conflict.', done: false },
  ],
  'Short Film': [
    { act: 'Setup', title: 'Immediate Hook', description: 'Establish character, setting, and want within the first 60 seconds.', done: true },
    { act: 'Turn', title: 'Complication', description: 'An unexpected obstacle forces a choice.', done: false },
    { act: 'Payoff', title: 'Final Image / Twist', description: 'Resonant ending that reframes what came before.', done: false },
  ],
  'Thriller / Mystery': [
    { act: 'Act I', title: 'The Crime / Anomaly', description: 'A disturbing discovery hooks the audience immediately.', done: true },
    { act: 'Act I', title: 'The Investigation Begins', description: 'Protagonist takes the case despite personal risk.', done: false },
    { act: 'Act II', title: 'First Red Herring', description: 'A convincing suspect leads the hero into a trap.', done: false },
    { act: 'Act II', title: 'The Twist', description: 'Everything we assumed about the antagonist is flipped.', done: false },
    { act: 'Act III', title: 'The Unmasking', description: 'High-tension confrontation where the truth comes out.', done: false },
  ],
  'Romance / Drama': [
    { act: 'Act I', title: 'Meet-Cute / Spark', description: 'Two worlds collide with undeniable chemistry or friction.', done: true },
    { act: 'Act II', title: 'Deepening Bond', description: 'Shared vulnerability brings them closer.', done: false },
    { act: 'Act II', title: 'The Rift', description: 'An unspoken truth or external pressure tears them apart.', done: false },
    { act: 'Act III', title: 'Grand Gesture / Honesty', description: 'Vulnerability wins out in an earned emotional climax.', done: false },
  ],
  'Sci-Fi / Fantasy': [
    { act: 'Act I', title: 'World & Rules', description: 'Show the speculative premise in action without heavy exposition.', done: true },
    { act: 'Act I', title: 'The Anomaly', description: 'Something breaks the known rules of this world.', done: false },
    { act: 'Act II', title: 'Crossing the Threshold', description: 'Exploring the deeper lore and unintended consequences.', done: false },
    { act: 'Act III', title: 'Systemic Climax', description: 'Using the world’s own rules to defeat the threat.', done: false },
  ],
  'Action / Adventure': [
    { act: 'Act I', title: 'Cold Open Set-Piece', description: 'Adrenaline-fueled intro showcasing the hero’s skill.', done: true },
    { act: 'Act II', title: 'Ticking Clock', description: 'A deadline forces the team into hostile territory.', done: false },
    { act: 'Act II', title: 'Ambush / Betrayal', description: 'The mission goes sideways; resources are stripped away.', done: false },
    { act: 'Act III', title: 'Final Showdown', description: 'All-out kinetic climax with personal stakes.', done: false },
  ],
  Comedy: [
    { act: 'Act I', title: 'The Flawed Premise', description: 'Introduce a character with a blind spot and a ridiculous goal.', done: true },
    { act: 'Act II', title: 'Escalation', description: 'One small lie snowballs into chaos.', done: false },
    { act: 'Act II', title: 'The Callback', description: 'Earlier setup returns in an unexpected, hilarious way.', done: false },
    { act: 'Act III', title: 'Comedic Payoff', description: 'Everyone collides in one room; truth & laughs erupt.', done: false },
  ],
  Horror: [
    { act: 'Act I', title: 'The Warning', description: 'An eerie omen establishes dread before anything attacks.', done: true },
    { act: 'Act I', title: 'Isolation', description: 'Cut off help, signal, or escape routes.', done: false },
    { act: 'Act II', title: 'False Scare & First Victim', description: 'Raise paranoia, then strike when the guard is down.', done: false },
    { act: 'Act III', title: 'Final Confrontation', description: 'The survivor faces the source of the terror.', done: false },
  ],
};

export function createProjectFromGenre(genre: GenreType, title?: string): ScriptProject {
  const cleanTitle = title?.trim() || `UNTITLED ${genre.toUpperCase()}`;
  const sampleElements: ScriptElement[] = [
    { id: uid(), type: 'transition', text: 'FADE IN:' },
    { id: uid(), type: 'scene', text: 'EXT. VARANASI RAILWAY STATION - NIGHT' },
    {
      id: uid(),
      type: 'action',
      text: 'Monsoon rain lashes the empty platform. A single yellow streetlamp flickers over wet tracks. Steam rises from a tea stall.',
    },
    {
      id: uid(),
      type: 'action',
      text: 'AARAV (28), wearing a soaked denim jacket, clutches a battered leather diary. He checks his watch — 11:55 PM.',
    },
    { id: uid(), type: 'character', text: 'AARAV' },
    { id: uid(), type: 'parenthetical', text: '(to the tea vendor)' },
    {
      id: uid(),
      type: 'dialogue',
      text: 'The 12:05 express... is it still running tonight?',
    },
    { id: uid(), type: 'character', text: 'VENDOR' },
    {
      id: uid(),
      type: 'dialogue',
      text: 'Nothing leaves on time in this rain, brother. Who are you waiting for?',
    },
    { id: uid(), type: 'transition', text: 'CUT TO:' },
    { id: uid(), type: 'scene', text: 'INT. TRAIN COMPARTMENT - CONTINUOUS' },
    {
      id: uid(),
      type: 'action',
      text: 'Dim blue light. MEERA (26) sits by the rain-streaked window, staring at an old photograph.',
    },
    { id: uid(), type: 'character', text: 'MEERA' },
    { id: uid(), type: 'parenthetical', text: '(whispering)' },
    {
      id: uid(),
      type: 'dialogue',
      text: 'Five years, Aarav. Let’s see if you still remember.',
    },
    { id: uid(), type: 'transition', text: 'FADE OUT.' },
  ];

  return {
    id: uid(),
    title: cleanTitle,
    author: 'Screenwriter',
    genre,
    logline: 'Write a one-sentence hook that captures your protagonist, conflict, and stakes.',
    elements: sampleElements,
    beats: GENRE_BEATS[genre].map((b) => ({ ...b, id: uid() })),
    research: [
      {
        id: uid(),
        category: 'Location',
        title: 'Old Observatory',
        content: 'Built in 1924. Brass telescope, spiral iron staircase, echoing acoustics. Smells of wet stone and ozone.',
        updatedAt: new Date().toLocaleDateString(),
      },
      {
        id: uid(),
        category: 'Reference',
        title: 'Visual Tone & Lighting',
        content: 'High-contrast chiaroscuro, practical tungsten lamps, cool cyan rain outside.',
        updatedAt: new Date().toLocaleDateString(),
      },
    ],
    characters: [
      {
        id: uid(),
        name: 'MAYA',
        role: 'Protagonist',
        arc: 'Skeptical archivist who learns some truths are meant to be uncovered.',
        traits: 'Observant, stubborn, dry humor',
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
