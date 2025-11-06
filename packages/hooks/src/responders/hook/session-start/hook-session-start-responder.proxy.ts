import { sessionIsNewBroker } from '../../../brokers/session/is-new/session-is-new-broker';
import { standardsLoadFilesBroker } from '../../../brokers/standards/load-files/standards-load-files-broker';

jest.mock('../../../brokers/session/is-new/session-is-new-broker');
jest.mock('../../../brokers/standards/load-files/standards-load-files-broker');

export const HookSessionStartResponderProxy = (): {
  setupIsNewSession: (params: { isNew: boolean }) => void;
  setupStandardsLoad: (params: { content: string }) => void;
} => {
  const mockSessionIsNewBroker = jest.mocked(sessionIsNewBroker);
  const mockStandardsLoadFilesBroker = jest.mocked(standardsLoadFilesBroker);

  return {
    setupIsNewSession: ({ isNew }: { isNew: boolean }): void => {
      mockSessionIsNewBroker.mockResolvedValueOnce(isNew);
    },
    setupStandardsLoad: ({ content }: { content: string }): void => {
      mockStandardsLoadFilesBroker.mockResolvedValueOnce(content);
    },
  };
};
