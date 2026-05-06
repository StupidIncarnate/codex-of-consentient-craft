import { useRateLimitsBindingProxy } from '../../bindings/use-rate-limits/use-rate-limits-binding.proxy';
import { RateLimitCardWidgetProxy } from '../rate-limit-card/rate-limit-card-widget.proxy';

export const RateLimitsStackWidgetProxy = (): {
  setupConnectedChannel: () => void;
  deliverWsMessage: (params: { data: string }) => void;
  setupSnapshot: ReturnType<typeof useRateLimitsBindingProxy>['setupSnapshot'];
  setupError: ReturnType<typeof useRateLimitsBindingProxy>['setupError'];
} => {
  RateLimitCardWidgetProxy();
  const bindingProxy = useRateLimitsBindingProxy();

  return {
    setupConnectedChannel: () => {
      bindingProxy.setupConnectedChannel();
    },
    deliverWsMessage: ({ data }) => {
      bindingProxy.deliverWsMessage({ data });
    },
    setupSnapshot: bindingProxy.setupSnapshot,
    setupError: bindingProxy.setupError,
  };
};
