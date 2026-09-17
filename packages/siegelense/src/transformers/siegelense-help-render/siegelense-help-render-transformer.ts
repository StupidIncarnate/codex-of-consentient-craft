/**
 * PURPOSE: Renders one call's `--help` page in the fixed section order — headline, USAGE, FLAGS,
 * REFUSES, OUTPUT, EXAMPLE, no per-call variation — or, when `call` is `null`, the index every bare
 * `dungeonmaster siegelense --help` prints: the headline, one line per built call, the NOT BUILT
 * YET block, then the footer. An empty array omits its whole block, heading included — true of
 * `refusals` on a call and of `notBuiltYet` on the index alike, so a reader can tell "no rule to
 * load" apart from "this call refuses nothing", and a finished surface apart from a truncated page.
 * Reach for this over inlining the text in `SiegelenseFlow`'s `--help` branch: the flow's own
 * spawned-process acceptance test and this file's unit test must read the identical first line for
 * every call, and only a pure function makes that provable without a process. `SiegelenseCall` is
 * derived here as `keyof typeof siegelenseHelpStatics.calls` — the BUILT calls, never wider than
 * `siegelenseCallStatics.calls.names` — because no dedicated contract carries that type; it is
 * exported so a caller building a route table over those same keys, such as the flow, can import
 * it from here rather than re-deriving it.
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
    const callsBlock = [
      'CALLS',
      ...builtNames.map((name) => `  ${siegelenseHelpStatics.calls[name].summary}`),
    ].join('\n');
    // Same rule the REFUSES block follows below: an empty list omits the heading too. A bare
    // NOT BUILT YET with nothing under it reads as a truncated page rather than as a finished tool.
    // Joined rather than mapped, because `as const` over an empty list types its elements `never`,
    // and a template literal over `never` does not compile.
    const notBuiltList = siegelenseHelpStatics.index.notBuiltYet.join('\n  ');
    const notBuiltBlock = notBuiltList === '' ? [] : [`NOT BUILT YET\n  ${notBuiltList}`];

    return contentTextContract.parse(
      `${[
        siegelenseHelpStatics.index.headline,
        callsBlock,
        ...notBuiltBlock,
        siegelenseHelpStatics.index.footer,
      ].join(SECTION_GAP)}\n`,
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
