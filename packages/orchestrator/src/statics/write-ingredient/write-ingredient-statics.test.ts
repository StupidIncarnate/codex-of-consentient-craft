import { mcpToolResultStatics } from '@dungeonmaster/shared/statics';

import { sadPathRoutingStatics } from '../sad-path-routing/sad-path-routing-statics';
import { spilledToolResultStatics } from '../spilled-tool-result/spilled-tool-result-statics';
import { unitMarkingStatics } from '../unit-marking/unit-marking-statics';

import { writeIngredientStatics } from './write-ingredient-statics';

const WHITESPACE_RUN = /\s+/gu;

const TEMPLATE = writeIngredientStatics.prompt.template;

const ARGUMENTS = writeIngredientStatics.prompt.placeholders.arguments;

const hasIn = ({ needle }: { needle: string }): boolean =>
  TEMPLATE.replace(WHITESPACE_RUN, ' ').includes(needle.replace(WHITESPACE_RUN, ' '));

describe('writeIngredientStatics', () => {
  it('VALID: exported template => is a non-empty string', () => {
    expect(TEMPLATE).toMatch(/^.+$/su);
  });

  it('VALID: served template => fits the MCP verbatim ceiling in bytes', () => {
    expect(Buffer.byteLength(TEMPLATE, 'utf8')).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
  });

  it('VALID: served template => carries exactly one $ARGUMENTS slot, last, under its own heading', () => {
    expect({
      placeholder: ARGUMENTS,
      count: TEMPLATE.split(ARGUMENTS).length - 1,
      atTheEnd: TEMPLATE.trimEnd().endsWith(ARGUMENTS),
      underItsOwnHeading: hasIn({ needle: `## Operation Context\n\n${ARGUMENTS}` }),
    }).toStrictEqual({
      placeholder: '$ARGUMENTS',
      count: 1,
      atTheEnd: true,
      underItsOwnHeading: true,
    });
  });

  it('VALID: served template => names its seven top-level sections in document order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^## .+$/gmu), (match) => match[0])).toStrictEqual([
      '## What you were given',
      '## What is yours, and what is not',
      '## The script',
      '## When the request asks for a repair, not a first draft',
      '## The sad paths, and where each lands',
      '## How you finish',
      '## Operation Context',
    ]);
  });

  it('VALID: served template => names its six script steps in order', () => {
    expect(Array.from(TEMPLATE.matchAll(/^### \d+\. .+$/gmu), (match) => match[0])).toStrictEqual([
      '### 1. Read the request',
      '### 2. Check whether existing recipes already compose',
      '### 3. Find and read the production writer',
      '### 4. Declare the ingredient — `links`, `routes`, `copies:`',
      '### 5. Prove it with a colocated test',
      '### 6. Declare your outcome and signal',
    ]);
  });

  it('VALID: served template => takes sad-path and spilled shared blocks, and takes no marking block', () => {
    expect({
      sadPaths: TEMPLATE.split(sadPathRoutingStatics.markdown).length - 1,
      spilled: TEMPLATE.split(spilledToolResultStatics.markdown).length - 1,
      marking: TEMPLATE.includes(unitMarkingStatics.markdown),
      markingHeading: TEMPLATE.includes('## Marking your units'),
    }).toStrictEqual({
      sadPaths: 1,
      spilled: 1,
      marking: false,
      markingHeading: false,
    });
  });

  it('VALID: served template => places the spill rule beside find and read the production writer', () => {
    const step3Index = TEMPLATE.indexOf('### 3. Find and read the production writer');
    const spillIndex = TEMPLATE.indexOf(spilledToolResultStatics.markdown);
    const step4Index = TEMPLATE.indexOf(
      '### 4. Declare the ingredient — `links`, `routes`, `copies:`',
    );

    expect({
      step3BeforeSpill: step3Index < spillIndex,
      spillBeforeStep4: spillIndex < step4Index,
    }).toStrictEqual({
      step3BeforeSpill: true,
      spillBeforeStep4: true,
    });
  });

  it('VALID: served template => scopes its writes and declares no forward route', () => {
    expect({
      scopedWrites: hasIn({
        needle:
          "`Edit` and `Write` **inside `packages/hydration-recipes` only, and only the new ingredient's own files**",
      }),
      noForwardRoute: hasIn({
        needle: '**You declare no forward route.**',
      }),
      stepInGraph: hasIn({
        needle: '**You are a step in the graph, not a sub-agent something else dispatches.**',
      }),
      subagentType: TEMPLATE.includes('subagent_type'),
    }).toStrictEqual({
      scopedWrites: true,
      noForwardRoute: true,
      stepInGraph: true,
      subagentType: false,
    });
  });
});
