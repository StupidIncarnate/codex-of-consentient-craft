import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  AbsoluteFilePathStub,
  ContextStub,
  DependencyStepStub,
  ObservableStub,
  QuestContractEntryStub,
  QuestIdStub,
  RequirementStub,
} from '@dungeonmaster/shared/contracts';

import { workUnitContract } from './work-unit-contract';
import type { WorkUnit } from './work-unit-contract';

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
    questId: QuestIdStub({ value: 'add-auth' }),
    relatedContracts: [QuestContractEntryStub()],
    relatedObservables: [ObservableStub()],
    relatedRequirements: [RequirementStub()],
    ...props,
  });

export const SpiritmenderWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'spiritmender',
    filePaths: [AbsoluteFilePathStub({ value: '/src/file.ts' })],
    ...props,
  });

export const LawbringerWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'lawbringer',
    filePaths: [AbsoluteFilePathStub({ value: '/src/broker.ts' })],
    ...props,
  });

export const SiegemasterWorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'siegemaster',
    questId: QuestIdStub({ value: 'add-auth' }),
    observables: [ObservableStub()],
    contexts: [ContextStub()],
    ...props,
  });

export const WorkUnitStub = ({ ...props }: StubArgument<WorkUnit> = {}): WorkUnit =>
  workUnitContract.parse({
    role: 'pathseeker',
    questId: QuestIdStub({ value: 'add-auth' }),
    ...props,
  });
