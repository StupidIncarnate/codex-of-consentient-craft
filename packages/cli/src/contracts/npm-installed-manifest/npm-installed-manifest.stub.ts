import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  npmInstalledManifestContract,
  type NpmInstalledManifest,
} from './npm-installed-manifest-contract';

export const NpmInstalledManifestStub = ({
  ...props
}: StubArgument<NpmInstalledManifest> = {}): NpmInstalledManifest =>
  npmInstalledManifestContract.parse({
    version: '1.0.0',
    ...props,
  });
