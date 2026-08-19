import { HealthPageWidgetProxy } from '../../../widgets/health-page/health-page-widget.proxy';

export const AppHealthResponderProxy = (): ReturnType<typeof HealthPageWidgetProxy> =>
  HealthPageWidgetProxy();
