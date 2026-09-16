/**
 * PURPOSE: Renders one call's `--help` page in the fixed section order — headline, USAGE, FLAGS,
 * REFUSES, OUTPUT, EXAMPLE, no per-call variation — or, when `call` is `null`, the index every bare
 * `dungeonmaster siegelense --help` prints: the headline, one line per built call, the NOT BUILT
 * YET block, then the footer. A call whose `refusals` array is empty omits the whole REFUSES block,
 * heading included, so a reader can tell "no rule to load" apart from "this call refuses nothing".
 * Reach for this over inlining the text in `SiegelenseFlow`'s `--help` branch: the flow's own
 * spawned-process acceptance test and this file's unit test must read the identical first line for
 * every call, and only a pure function makes that provable without a process. `SiegelenseCall` is
 * derived here as `keyof typeof siegelenseHelpStatics.calls` — the BUILT calls, narrower than
 * `siegelenseCallStatics.calls.names`'s full closed set — because no dedicated contract carries
 * that type; it is exported so a caller building a route table over the same keys, such as the
 * flow, can import it from here rather than re-deriving it. The index headline's built-versus-total
 * count is computed here, off those same two lists, rather than typed into
 * `siegelenseHelpStatics.index.headline` — a hand-typed tally goes stale the moment a call is
 * routed and nothing here catches it.
 *
 * USAGE:
 * siegelenseHelpRenderTransformer({ call: 'cleanup' });
 * // Returns the `cleanup` page: headline, USAGE, FLAGS, REFUSES, OUTPUT, EXAMPLE
 *
 * siegelenseHelpRenderTransformer({ call: null });
 * // Returns the index: headline, one line per built call, NOT BUILT YET, footer
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseHelpStatics } from '../../statics/siegelense-help/siegelense-help-statics';

export type SiegelenseCall = keyof typeof siegelenseHelpStatics.calls;

const SECTION_GAP = '\n\n';
const REQUIRED_LABEL = 'required';
const FLAG_COLUMN_GAP = 2;

export const siegelenseHelpRenderTransformer = ({
  call,
}: {
  call: SiegelenseCall | null;
}): ContentText => {
  if (call === null) {
    const builtNames = Object.keys(siegelenseHelpStatics.calls) as readonly SiegelenseCall[];
    const headline =
      `${siegelenseHelpStatics.index.headline} ` +
      `${builtNames.length} of ${siegelenseCallStatics.calls.names.length} calls are built.`;
    const callsBlock = [
      'CALLS',
      ...builtNames.map((name) => `  ${siegelenseHelpStatics.calls[name].summary}`),
    ].join('\n');
    const notBuiltBlock = [
      'NOT BUILT YET',
      ...siegelenseHelpStatics.index.notBuiltYet.map((name) => `  ${name}`),
    ].join('\n');

    return contentTextContract.parse(
      `${[headline, callsBlock, notBuiltBlock, siegelenseHelpStatics.index.footer].join(
        SECTION_GAP,
      )}\n`,
    );
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

  return contentTextContract.parse(`${blocks.join(SECTION_GAP)}\n`);
};
