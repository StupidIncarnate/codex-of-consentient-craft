/**
 * PURPOSE: Message text whose `![Pasted Image N](...)` tokens all point at something a browser can
 * actually load. A chat entry arrives that way already — the orchestrator rewrites each token on its
 * way off disk — but `quest.userRequest` does NOT: it is stored carrying the raw filesystem path the
 * server wrote, so any surface rendering it has to resolve the tokens first. This brand marks text
 * that has been through that step, so a raw-path string cannot reach an `<img>` by mistake.
 *
 * USAGE:
 * servedImageContentContract.parse('Look at ![Pasted Image 1](/api/images?path=%2Fq%2Fa.png)');
 * // Returns: ServedImageContent branded string
 */

import { z } from 'zod';

export const servedImageContentContract = z.string().brand<'ServedImageContent'>();

export type ServedImageContent = z.infer<typeof servedImageContentContract>;
