/**
 * PURPOSE: Proxy for QuestGetPlanningNotesResponder. Scaffold stub broker has no I/O, so the proxy is empty.
 *
 * USAGE:
 * QuestGetPlanningNotesResponderProxy();
 */

import { questGetPlanningNotesBrokerProxy } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker.proxy';
import { QuestGetPlanningNotesResponder } from './quest-get-planning-notes-responder';

export const QuestGetPlanningNotesResponderProxy = (): {
  callResponder: typeof QuestGetPlanningNotesResponder;
} => {
  questGetPlanningNotesBrokerProxy();

  return {
    callResponder: QuestGetPlanningNotesResponder,
  };
};
