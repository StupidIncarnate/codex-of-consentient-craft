// PURPOSE: Proxy for pasted-image-attach-broker providing test control over the minted attachmentId
// and the composed downscale ladder's outcome.
// USAGE: Create proxy in test, stage mintsIds()/ladderYields()/ladderFails(), call the broker.

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { pastedImageDownscaleBrokerProxy } from '../downscale/pasted-image-downscale-broker.proxy';
import type { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';

export const pastedImageAttachBrokerProxy = (): {
  mintsIds: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  ladderYields: (params: { attachment: ReturnType<typeof ComposerAttachmentStub> }) => void;
  ladderFails: (params: { error: Error }) => void;
} => {
  // Child creation only, per enforce-proxy-child-creation — the broker imports
  // pastedImageDownscaleBroker, so this proxy must instantiate its proxy too.
  const downscaleProxy = pastedImageDownscaleBrokerProxy();

  const uuidHandle: SpyOnHandle = registerSpyOn({
    object: crypto,
    method: 'randomUUID',
    passthrough: true,
  });

  return {
    mintsIds: ({ ids }): void => {
      // randomUUID takes no arguments, so there is no address beyond "the next call" — onceFor
      // staged in order is consumed FIFO, one entry per call.
      for (const id of ids) uuidHandle.onceFor([]).returns(id);
    },
    // The downscale broker's own proxy mocks the CANVAS adapters, not the broker's return value, so
    // the only lever available here is the ORIGINAL measured size. The rest of the target attachment
    // (dataUrl, mediaType, byteLength) is decided by what the TEST passes into
    // pastedImageAttachBroker itself: a dataUrl/mediaType under the byte ceiling comes back
    // unchanged from the ladder, so a caller stages an attachment whose dataUrl/mediaType match the
    // broker call under test and this method supplies the matching measured dimensions.
    ladderYields: ({ attachment }): void => {
      downscaleProxy.originalIs({ widthPx: attachment.widthPx, heightPx: attachment.heightPx });
    },
    ladderFails: ({ error }): void => {
      downscaleProxy.decodeFails({ error });
    },
  };
};
