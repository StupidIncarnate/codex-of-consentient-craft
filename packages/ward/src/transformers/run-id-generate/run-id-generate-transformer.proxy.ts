import { runIdMockStatics } from '../../statics/run-id-mock/run-id-mock-statics';

export const runIdGenerateTransformerProxy = (): Record<PropertyKey, never> => {
  jest.spyOn(Date, 'now').mockReturnValue(runIdMockStatics.timestamp);
  jest.spyOn(Math, 'random').mockReturnValue(runIdMockStatics.randomValue);

  return {};
};
