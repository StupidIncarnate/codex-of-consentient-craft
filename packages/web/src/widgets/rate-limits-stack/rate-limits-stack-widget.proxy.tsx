import { useRateLimitsBindingProxy } from '../../bindings/use-rate-limits/use-rate-limits-binding.proxy';
import { RateLimitCardWidgetProxy } from '../rate-limit-card/rate-limit-card-widget.proxy';

export const RateLimitsStackWidgetProxy = (): ReturnType<typeof useRateLimitsBindingProxy> => {
  RateLimitCardWidgetProxy();
  const bindingProxy = useRateLimitsBindingProxy();

  return {
    setupSnapshot: bindingProxy.setupSnapshot,
    setupError: bindingProxy.setupError,
    websocket: bindingProxy.websocket,
  };
};
