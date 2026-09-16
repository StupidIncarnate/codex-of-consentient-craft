import type { StubArgument } from '@dungeonmaster/shared/@types';
import { opSaveRecordContract } from './op-save-record-contract';
import type { OpSaveRecord } from './op-save-record-contract';

export const OpSaveRecordStub = ({ ...props }: StubArgument<OpSaveRecord> = {}): OpSaveRecord =>
  opSaveRecordContract.parse({
    op: 'saveRecord',
    ref: 'guild[0:0]/quest[0:2]',
    name: 'third',
    ...props,
  });
