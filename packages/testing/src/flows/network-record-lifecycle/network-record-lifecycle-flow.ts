/**
 * PURPOSE: Orchestrates network record lifecycle by delegating to the network-record-lifecycle responder
 *
 * USAGE:
 * const recorder = NetworkRecordLifecycleFlow();
 * // Returns { start, afterEach, stop } for jest hook registration
 */

import { NetworkRecordLifecycleResponder } from '../../responders/network-record/lifecycle/network-record-lifecycle-responder';

type FlowResult = ReturnType<typeof NetworkRecordLifecycleResponder>;

export const NetworkRecordLifecycleFlow = (): FlowResult => NetworkRecordLifecycleResponder();
