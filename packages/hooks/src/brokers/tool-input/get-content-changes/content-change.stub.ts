import type { ContentChange } from './tool-input-get-content-changes-broker';

export const ContentChangeStub = (overrides?: Partial<ContentChange>): ContentChange => {
  return {
    oldContent: '',
    newContent: '',
    ...overrides,
  };
};
