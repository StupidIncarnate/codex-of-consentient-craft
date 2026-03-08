import { designProcessStateProxy } from '../../../state/design-process/design-process-state.proxy';
import { DesignStopResponder } from './design-stop-responder';

export const DesignStopResponderProxy = (): {
  callResponder: typeof DesignStopResponder;
} => {
  designProcessStateProxy();

  return {
    callResponder: DesignStopResponder,
  };
};
