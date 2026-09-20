import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { HealthVerdictStub } from '../health-verdict/health-verdict.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { healthReadingContract } from './health-reading-contract';
import type { HealthReading } from './health-reading-contract';

export const HealthReadingStub = ({ ...props }: StubArgument<HealthReading> = {}): HealthReading =>
  healthReadingContract.parse({
    verdict: HealthVerdictStub({ value: 'HEALTHY' }),
    rootPresent: true,
    blank: false,
    blankColour: null,
    consoleErrors: ReadingCountStub({ value: 0 }),
    firstConsoleError: null,
    network5xxCount: ReadingCountStub({ value: 0 }),
    first5xx: null,
    serverErrors: ReadingCountStub({ value: 0 }),
    firstServerError: null,
    rendered: ContentTextStub({
      value: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
    }),
    ...props,
  });
