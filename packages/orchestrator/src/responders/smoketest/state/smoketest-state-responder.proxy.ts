import { smoketestRunStateProxy } from '../../../state/smoketest-run/smoketest-run-state.proxy';

export const SmoketestStateResponderProxy = (): Record<PropertyKey, never> => {
  smoketestRunStateProxy();
  return {};
};
