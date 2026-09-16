import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { PixelChangeStub } from '../pixel-change/pixel-change.stub';
import { ServerLogWindowStub } from '../server-log-window/server-log-window.stub';
import { StepExpectationStub } from '../step-expectation/step-expectation.stub';
import { StepIndexStub } from '../step-index/step-index.stub';
import { StepVerbStub } from '../step-verb/step-verb.stub';
import { stepReadingContract } from './step-reading-contract';
import type { StepReading } from './step-reading-contract';

export const StepReadingStub = ({ ...props }: StubArgument<StepReading> = {}): StepReading =>
  stepReadingContract.parse({
    step: StepIndexStub({ value: 2 }),
    verb: StepVerbStub({ value: 'click' }),
    node: null,
    ok: true,
    expected: StepExpectationStub(),
    reading: ContentTextStub({ value: 'clicked [data-testid="GUILD_ADD"]' }),
    shot: AbsoluteFilePathStub({
      value: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
    }),
    pixelChange: PixelChangeStub(),
    blank: false,
    blankColour: null,
    serverWindow: ServerLogWindowStub(),
    startedAtMs: EpochMsStub({ value: 1_700_000_000_000 }),
    endedAtMs: EpochMsStub({ value: 1_700_000_000_210 }),
    ...props,
  });
