import { screen } from '@testing-library/react';

import { UploadPercentStub } from '../../contracts/upload-percent/upload-percent.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

type UploadPercent = ReturnType<typeof UploadPercentStub>;

// No child proxies to create — this widget imports no binding, broker or adapter, so there is
// nothing here for a mock to intercept.
export const UploadProgressBarWidgetProxy = (): {
  hasBar: () => boolean;
  getPercent: () => UploadPercent | null;
} => ({
  hasBar: (): boolean => screen.queryByTestId(chatComposerStatics.upload.testId) !== null,
  getPercent: (): UploadPercent | null => {
    const bar = screen.queryByTestId(chatComposerStatics.upload.testId);
    if (bar === null) {
      return null;
    }
    const raw = bar.getAttribute('aria-valuenow');
    if (raw === null) {
      return null;
    }
    return UploadPercentStub({ value: Number(raw) });
  },
});
