/**
 * PURPOSE: Replaces the {{SERVER_URL}} placeholder in prompt templates with the resolved server URL based on environment
 *
 * USAGE:
 * const resolved = resolveServerUrlTransformer({ template: contentTextContract.parse('curl {{SERVER_URL}}/api/health') });
 * // Returns 'curl http://dungeonmaster.localhost:3737/api/health' as ContentText
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';

export const resolveServerUrlTransformer = ({
  template,
}: {
  template: ContentText;
}): ContentText => {
  const port = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
  const serverUrl = `http://${environmentStatics.hostname}:${port}`;

  return contentTextContract.parse(
    template.replaceAll(environmentStatics.serverUrlPlaceholder, serverUrl),
  );
};
