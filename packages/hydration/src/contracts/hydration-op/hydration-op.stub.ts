import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OpCreateStub } from '../op-create/op-create.stub';
import { OpSetStub } from '../op-set/op-set.stub';
import { OpRemoveStub } from '../op-remove/op-remove.stub';
import { OpSaveRecordStub } from '../op-save-record/op-save-record.stub';
import { OpExtraStub } from '../op-extra/op-extra.stub';
import { OpFilterStub } from '../op-filter/op-filter.stub';
import { hydrationOpContract } from './hydration-op-contract';
import type { HydrationOp } from './hydration-op-contract';

export const HydrationOpStub = ({ ...props }: StubArgument<HydrationOp> = {}): HydrationOp => {
  // `StubArgument` unbrands every literal, so `props.op` reads as plain `string` here — a chained
  // comparison (rather than an object index) is what resolves the right default without an
  // `any`-typed lookup, following `StepStub`'s own precedent for a discriminated union.
  const opKind = props.op ?? 'create';
  const base =
    opKind === 'set'
      ? OpSetStub()
      : opKind === 'remove'
        ? OpRemoveStub()
        : opKind === 'saveRecord'
          ? OpSaveRecordStub()
          : opKind === 'extra'
            ? OpExtraStub()
            : opKind === 'filter'
              ? OpFilterStub()
              : OpCreateStub();

  return hydrationOpContract.parse({ ...base, ...props });
};
