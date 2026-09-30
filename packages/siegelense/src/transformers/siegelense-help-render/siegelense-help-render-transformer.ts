/**
 * PURPOSE: Renders one call's `--help` page in the fixed section order — headline, USAGE, FLAGS,
 * REFUSES, OUTPUT, EXAMPLE, no per-call variation — or, when `call` is `null`, the index every bare
 * `dungeonmaster siegelense --help` prints: the headline, one line per built call, then the footer.
 * An empty `refusals` array omits its whole block, heading included, so a reader can tell "no rule
 * to load" apart from "this call refuses nothing". Reach for this over inlining the text in
 * `SiegelenseFlow`'s `--help` branch: the flow's own spawned-process acceptance test and this
 * file's unit test must read the identical first line for every call, and only a pure function
 * makes that provable without a process. `SiegelenseCall` is derived here as `keyof typeof
 * siegelenseHelpStatics.calls` — the BUILT calls — because no dedicated contract carries that
 * type; it is exported so a caller building a route table over the same keys, such as the flow, can
 * import it from here rather than re-deriving it. The index carries no build-progress count: a
 * reader of `--help` wants the calls that exist, not a tally of how many more are coming.
 *
 * USAGE:
 * siegelenseHelpRenderTransformer({ call: 'cleanup' });
 * // Returns the `cleanup` page: headline, USAGE, FLAGS, REFUSES, OUTPUT, EXAMPLE
 *
 * siegelenseHelpRenderTransformer({ call: null });
 * // Returns the index: headline, one line per built call, footer
 */


import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';

export type SiegelenseCall = keyof typeof siegelenseHelpStatics.calls;

const SECTION_GAP = '\n\n';
const REQUIRED_LABEL = 'required';
const FLAG_COLUMN_GAP = 2;

export const siegelenseHelpRenderTransformer = ({
  call,
}: {
  call: SiegelenseCall | null;
}): string => {
  if (call === null) {
    const builtNames = Object.keys(siegelenseHelpStatics.calls) as readonly SiegelenseCall[];
    const callsBlock = [
      'CALLS',
      ...builtNames.map((name) => `  ${siegelenseHelpStatics.calls[name].summary}`),
    ].join('\n');

    return `${[siegelenseHelpStatics.index.headline, callsBlock, siegelenseHelpStatics.index.footer].join(SECTION_GAP)}\n`;
  }

  const entry = siegelenseHelpStatics.calls[call];

  const flagLines = entry.flags.map((flag) => ({
    left: flag.value === null ? flag.name : `${flag.name} ${flag.value}`,
    required: flag.required,
    description: flag.description,
  }));
  const maxLeftWidth = Math.max(...flagLines.map((flagLine) => flagLine.left.length));
  const flagsBlock = [
    'FLAGS',
    ...flagLines.map((flagLine) => {
      const requiredColumn = flagLine.required ? REQUIRED_LABEL : ' '.repeat(REQUIRED_LABEL.length);
      return `  ${flagLine.left.padEnd(maxLeftWidth + FLAG_COLUMN_GAP)}${requiredColumn}   ${flagLine.description}`;
    }),
  ].join('\n');

  const refusesLines =
    entry.refusals.length === 0
      ? []
      : ['REFUSES', ...entry.refusals.map((refusal) => `  ${refusal}`)];

  const blocks = [
    entry.summary,
    ['USAGE', `  ${entry.synopsis}`].join('\n'),
    flagsBlock,
    ...(refusesLines.length === 0 ? [] : [refusesLines.join('\n')]),
    ['OUTPUT', `  ${entry.output}`].join('\n'),
    ['EXAMPLE', `  ${entry.example}`].join('\n'),
  ];

  return `${blocks.join(SECTION_GAP)}\n`;
};
