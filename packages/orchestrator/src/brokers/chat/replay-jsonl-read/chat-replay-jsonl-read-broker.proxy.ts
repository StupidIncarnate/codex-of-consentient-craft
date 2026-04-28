import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';

export const chatReplayJsonlReadBrokerProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  return {
    returns: ({ content }: { content: string }): void => {
      readJsonlProxy.returns({ content });
    },
    throws: ({ error }: { error: Error }): void => {
      readJsonlProxy.throws({ error });
    },
  };
};
