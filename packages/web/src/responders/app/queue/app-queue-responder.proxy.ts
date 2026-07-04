import { QueuePageWidgetProxy } from '../../../widgets/queue-page/queue-page-widget.proxy';

export const AppQueueResponderProxy = (): ReturnType<typeof QueuePageWidgetProxy> =>
  QueuePageWidgetProxy();
