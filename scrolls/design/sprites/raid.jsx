import { raccoonWizardPixels } from './raccoon-wizard.jsx';

// Builds the 'x y #color' strings PixelSprite expects from an ASCII grid. '.' is empty.
const grid = (rows, palette) => {
  const out = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.' && palette[ch]) out.push(`${x} ${y} ${palette[ch]}`);
    });
  });
  return out;
};

// Every sprite faces right; render enemies with flip so they face the hero.

// Raccoon wizard: the existing 21x15 sprite plus a staff with an orb on the right.
const staffRows = [
  '.O.',
  'OoO',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
  '.s.',
];
export const raccoonStaffPixels = [
  ...raccoonWizardPixels,
  ...grid(staffRows, { O: '#7b68ee', o: '#ffd700', s: '#c0a080' }).map((p) => {
    const [x, y, c] = p.split(' ');
    return `${Number(x) + 21} ${y} ${c}`;
  }),
];
export const raccoonStaffSize = { width: 24, height: 15 };

export const ratWarriorPixels = grid(
  [
    '..gg..........w.',
    '.gpg..........w.',
    '.gggg.........w.',
    '..gggggd......w.',
    '..ggggegg.....w.',
    '..ggggggggn...w.',
    '...ggggg....hhhh',
    '...sssggggg..h..',
    '..ssSsgggggg....',
    'pp.ssSsggggg....',
    '.p.sssggggggg...',
    '...ggg.ggg......',
    '...bbb.bbb......',
    '...bbb.bbb......',
  ],
  {
    g: '#8a8a9a',
    d: '#5a5a6a',
    p: '#e8a0a0',
    e: '#1a1a2a',
    n: '#e8a0a0',
    w: '#e0e0e0',
    h: '#ffd700',
    s: '#ff6b35',
    S: '#b84a1f',
    b: '#6b4a2a',
  },
);
export const ratWarriorSize = { width: 16, height: 14 };

export const frogClericPixels = grid(
  [
    '..WW..WW.....yy.',
    '.WeeWWeeW....yy.',
    '.gggggggg.....s.',
    'gggggggggg....s.',
    'gggggggkkg....s.',
    '.ggggggggg....s.',
    '.gbbbbbbgg....s.',
    '.gbbbbbbggggg.s.',
    '.gbbbbbbg.....s.',
    '..gggggg......s.',
    '..gg..gg......s.',
    '.ggg..ggg.....s.',
  ],
  {
    W: '#e0e0e0',
    e: '#1a1a2a',
    g: '#4ade80',
    b: '#d9f99d',
    k: '#166534',
    y: '#ffd700',
    s: '#c0a080',
  },
);
export const frogClericSize = { width: 16, height: 12 };

export const owlRangerPixels = grid(
  [
    '.b......b...q',
    '.bb....bb..q.',
    '.bbbbbbbb.q..',
    '.bYkbbYkb.q..',
    '.bbbboobb.q..',
    '.bbbbbbbb.q..',
    'bbbllllbbbq..',
    'bbllllllbbq..',
    'bblllllllb.q.',
    'bbllllllbb.q.',
    '.bbllllbb...q',
    '..bbbbbb.....',
    '..oo..oo.....',
  ],
  { b: '#a0764a', l: '#e8d3a8', Y: '#ffd700', k: '#1a1a2a', o: '#ff9f43', q: '#c0a080' },
);
export const owlRangerSize = { width: 13, height: 13 };

export const lintGoblinPixels = grid(
  [
    'dd.........dd',
    '.ddgggggggdd.',
    '..ggggggggg..',
    '..grkgggkrg..',
    '..ggggggggg..',
    '..gwkwkwkwg..',
    '...ggggggg...',
    '..dgggggggd..',
    '.ddgggggggdd.',
    '.dd.ggggg.dd.',
    '....gg.gg....',
    '...ddd.ddd...',
  ],
  { g: '#9acd32', d: '#5a7a1a', r: '#ef4444', k: '#1a1a2a', w: '#f5f5dc' },
);
export const lintGoblinSize = { width: 13, height: 12 };

export const slimePixels = grid(
  [
    '....bbbb....',
    '..bbhhbbbb..',
    '.bbwbbbbwbb.',
    '.bbkbbbbkbb.',
    'bbbbbbbbbbbb',
    'bbbbbkkkbbbb',
    'bdbbbbbbbbdb',
    '.dddddddddd.',
  ],
  { b: '#38bdf8', h: '#bae6fd', d: '#0c7aa8', w: '#e0e0e0', k: '#1a1a2a' },
);
export const slimeSize = { width: 12, height: 8 };

export const skeletonPixels = grid(
  [
    '..wwwwww..',
    '.wwwwwwww.',
    '.wkkwwkkw.',
    '.wkkwwkkw.',
    '..wwwwww..',
    '...wkkw...',
    '....ww....',
    '.wwwwwwww.',
    '..wsssswW.',
    '.wwwwwwww.',
    '...wwww...',
    '..ww..ww..',
    '..ww..ww..',
    '.www..www.',
  ],
  { w: '#e0e0e0', s: '#8a8a9a', W: '#e0e0e0', k: '#1a1a2a' },
);
export const skeletonSize = { width: 10, height: 14 };
