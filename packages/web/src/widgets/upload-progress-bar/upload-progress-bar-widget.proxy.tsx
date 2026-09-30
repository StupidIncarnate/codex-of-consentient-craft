import { screen } from '#gateway/npm/testing-library__react';

import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

// No child proxies to create — this widget imports no binding, broker or adapter, so there is
// nothing here for a mock to intercept.
export const UploadProgressBarWidgetProxy = (): {
  hasBar: () => boolean;
  getPercent: () => number | null;
} => ({
  hasBar: (): boolean => screen.queryByTestId(chatComposerStatics.upload.testId) !== null,
  getPercent: (): number | null => {
    const bar = screen.queryByTestId(chatComposerStatics.upload.testId);
    if (bar === null) {
      return null;
    }
    const raw = bar.getAttribute('aria-valuenow');
    if (raw === null) {
      return null;
    }
    return Number(raw);
  },
});
