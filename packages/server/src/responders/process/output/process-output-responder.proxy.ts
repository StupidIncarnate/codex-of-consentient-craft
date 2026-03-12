import { ProcessOutputResponder } from './process-output-responder';

export const ProcessOutputResponderProxy = (): {
  callResponder: typeof ProcessOutputResponder;
} => ({
  callResponder: ProcessOutputResponder,
});
