import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { runIdMockStatics } from '../../statics/run-id-mock/run-id-mock-statics';

export const runIdGenerateTransformerProxy = (): Record<PropertyKey, never> => {
  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(runIdMockStatics.timestamp);
  registerSpyOn({ object: Math, method: 'random' })
    .calledWith([])
    .returns(runIdMockStatics.randomValue);

  return {};
};
