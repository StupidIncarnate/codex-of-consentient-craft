import { factoryFunctionTextContract } from './factory-function-text-contract';

export const FactoryFunctionTextStub = (
  { value }: { value: string } = { value: '() => ({})' },
): ReturnType<typeof factoryFunctionTextContract.parse> => factoryFunctionTextContract.parse(value);
