import { bundleHashContract, type BundleHash } from './bundle-hash-contract';

const DEFAULT_VALUE = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const BundleHashStub = ({ value }: { value?: string } = {}): BundleHash =>
  bundleHashContract.parse(value ?? DEFAULT_VALUE);
