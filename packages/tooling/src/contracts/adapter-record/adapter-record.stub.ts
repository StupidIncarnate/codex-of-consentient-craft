import { adapterRecordContract } from './adapter-record-contract';
import type { AdapterRecord } from './adapter-record-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OutsideCallStub } from '../outside-call/outside-call.stub';
import { GatewayExportStub } from '../gateway-export/gateway-export.stub';

export const AdapterRecordStub = ({ ...props }: StubArgument<AdapterRecord> = {}): AdapterRecord =>
  adapterRecordContract.parse({
    file: 'packages/example/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    exportNames: ['fsReadFileAdapter'],
    shape: 'pass-through',
    reasons: [],
    outsideCalls: [OutsideCallStub()],
    gateway: [GatewayExportStub()],
    productionCallers: [],
    testFiles: [],
    proxyFiles: [],
    adapterProxy: null,
    ...props,
  });
