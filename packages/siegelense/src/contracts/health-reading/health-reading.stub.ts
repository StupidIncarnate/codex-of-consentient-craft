import type { StubArgument } from '@dungeonmaster/shared/@types';

import { HealthVerdictStub } from '../health-verdict/health-verdict.stub';
import { healthReadingContract } from './health-reading-contract';
import type { HealthReading } from './health-reading-contract';

export const HealthReadingStub = ({ ...props }: StubArgument<HealthReading> = {}): HealthReading =>
  healthReadingContract.parse({
    verdict: HealthVerdictStub({ value: 'HEALTHY' }),
    rootPresent: true,
    blank: false,
    blankColour: null,
    consoleErrors: 0,
    firstConsoleError: null,
    network5xxCount: 0,
    first5xx: null,
    serverErrors: 0,
    firstServerError: null,
    rendered: 'HEALTHY   root present · not blank · console clean · no 5xx · server log clean',
    ...props,
  });
