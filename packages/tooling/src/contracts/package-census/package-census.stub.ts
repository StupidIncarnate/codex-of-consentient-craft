import { packageCensusContract } from './package-census-contract';
import type { PackageCensus } from './package-census-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AdapterRecordStub } from '../adapter-record/adapter-record.stub';

export const PackageCensusStub = ({ ...props }: StubArgument<PackageCensus> = {}): PackageCensus =>
  packageCensusContract.parse({
    name: '@acme/example',
    dir: 'packages/example',
    adapters: [AdapterRecordStub()],
    ...props,
  });
