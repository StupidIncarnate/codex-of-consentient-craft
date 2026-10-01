// 12x9 castle-gate glyph used for the ALL GUILDS button.
const rows = [
  'g.g..gg..g.g',
  'gggggggggggg',
  'gggggggggggg',
  'ggggddddgggg',
  'gggddddddggg',
  'gggddddddggg',
  'gggddddddggg',
  'gggddddddggg',
  'gggddddddggg',
];
const palette = { g: '#fbbf24', d: '#0d0907' };

export const guildGate = rows.flatMap((row, y) =>
  [...row].flatMap((ch, x) => (palette[ch] ? [`${x} ${y} ${palette[ch]}`] : [])),
);
export const guildGateSize = { width: 12, height: 9 };
