import type { StubArgument } from '@dungeonmaster/shared/@types';
import { DependencyStepStub, QuestIdStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { workUnitContract } from './work-unit-contract';
import type { WorkUnit } from './work-unit-contract';
import { FilePairWorkUnitStub } from '../file-pair-work-unit/file-pair-work-unit.stub';
import { FileWorkUnitStub } from '../file-work-unit/file-work-unit.stub';

export const PathseekerWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'pathseeker',
    questId: QuestIdStub({ value: 'add-auth' }),
    ...props,
  });

export const CodeweaverWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'codeweaver',
    step: DependencyStepStub(),
    ...props,
  });

export const SpiritmenderWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'spiritmender',
    file: FileWorkUnitStub(),
    stepId: StepIdStub(),
    ...props,
  });

export const LawbringerWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'lawbringer',
    filePair: FilePairWorkUnitStub(),
    stepId: StepIdStub(),
    ...props,
  });

export const SiegemasterWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'siegemaster',
    questId: QuestIdStub({ value: 'add-auth' }),
    stepId: StepIdStub(),
    ...props,
  });

export const WorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'pathseeker',
    questId: QuestIdStub({ value: 'add-auth' }),
    ...props,
  });
