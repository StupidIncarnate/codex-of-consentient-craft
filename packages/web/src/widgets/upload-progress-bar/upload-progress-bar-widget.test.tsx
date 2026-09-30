import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { UploadProgressBarWidget } from './upload-progress-bar-widget';
import { UploadProgressBarWidgetProxy } from './upload-progress-bar-widget.proxy';

describe('UploadProgressBarWidget', () => {
  it('EMPTY: {percent: 0} => the bar is in the document and reads 0', () => {
    const proxy = UploadProgressBarWidgetProxy();
    const percent = 0;

    mantineRenderMiddleware({ ui: <UploadProgressBarWidget percent={percent} /> });

    expect(proxy.hasBar()).toBe(true);
    expect(proxy.getPercent()).toBe(0);
  });

  it('VALID: {percent: 50} => reads 50', () => {
    const proxy = UploadProgressBarWidgetProxy();
    const percent = 50;

    mantineRenderMiddleware({ ui: <UploadProgressBarWidget percent={percent} /> });

    expect(proxy.getPercent()).toBe(50);
  });

  it('VALID: {percent: 100} => reads 100', () => {
    const proxy = UploadProgressBarWidgetProxy();
    const percent = 100;

    mantineRenderMiddleware({ ui: <UploadProgressBarWidget percent={percent} /> });

    expect(proxy.getPercent()).toBe(100);
  });

  it("VALID: {percent: 37} => reads 37, the prop's own number rather than a rounded or bucketed one", () => {
    const proxy = UploadProgressBarWidgetProxy();
    const percent = 37;

    mantineRenderMiddleware({ ui: <UploadProgressBarWidget percent={percent} /> });

    expect(proxy.getPercent()).toBe(37);
  });
});
