import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

// Every case here is ONE REAL ROUND TRIP: seed a real PNG at a path whose FILENAME carries a
// hostile character, seed a transcript line whose token names that raw path, open the session
// view, and assert the served image actually LOADS. A character that escapes unencoded splits or
// truncates the query, the server looks for a different file, the GET 404s and the thumbnail
// breaks — so every row is falsifiable by the real network round trip, not by agreeing with a
// string computed the same way twice.
const GUILD_PATH = '/tmp/dm-e2e-transcript-image-path-encoding';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript image path encoding', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {content "A![Pasted Image 1](<seeded absolute path>)B"} => the rendered img src is the whole expected URL string, with every "/" in the path encoded as "%2F"', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding URL Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'x.png',
      widthPx: 29,
      heightPx: 29,
      seed: 100,
    });
    const content = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });

    const sessionId = `e2e-session-encoding-url-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const expectedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }),
    );

    await nav.navigateToSession({ urlSlug, sessionId });

    const src = await page.getByTestId('CHAT_MESSAGE_IMAGE').getAttribute('src');
    expect(src).toBe(expectedUrl);
  });

  test('VALID: {an image token in a session} => the browser issues one GET whose raw path query value equals encodeURIComponent(imagePath), and the response is 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding GET Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'get-issued.png',
      widthPx: 28,
      heightPx: 28,
      seed: 99,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-get-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      method: response.request().method(),
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      method: 'GET',
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });
  });

  test('VALID: {a filename containing a literal space} => the raw query value round-trips exactly, the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Space Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'has space.png',
      widthPx: 31,
      heightPx: 31,
      seed: 101,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-space-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(31);
  });

  test('VALID: {a filename containing an ampersand} => the raw query value round-trips exactly as one query parameter, the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Ampersand Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'has&sign.png',
      widthPx: 33,
      heightPx: 33,
      seed: 102,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-ampersand-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      queryParamCount: images.countRawQueryParams({ url: response.url() }),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      queryParamCount: 1,
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(33);
  });

  test('VALID: {a filename containing a hash} => the raw query value round-trips exactly, the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Hash Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'has#hash.png',
      widthPx: 35,
      heightPx: 35,
      seed: 103,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-hash-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(35);
  });

  test('VALID: {a filename containing a question mark} => the raw query value round-trips exactly, the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Question Mark Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'has?mark.png',
      widthPx: 37,
      heightPx: 37,
      seed: 104,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-question-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(37);
  });

  test('VALID: {a filename containing a literal "%41"} => the raw query value round-trips exactly (a single-encoded %25 for the "%", never a double-decode to "A"), the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Percent Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'percent%41.png',
      widthPx: 39,
      heightPx: 39,
      seed: 105,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-percent-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(39);
  });

  test('VALID: {a filename containing a literal plus} => the raw query value round-trips exactly (never a bare "+" that a query-decoder would turn back into a space), the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Plus Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'has+plus.png',
      widthPx: 41,
      heightPx: 41,
      seed: 106,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-plus-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(41);
  });

  test('VALID: {a filename containing a non-ASCII character} => the raw query value round-trips exactly and decodes back to the seeded path byte-for-byte, the image loads at its seeded width, and the GET returns 200', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Path Encoding Non-ASCII Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'café.png',
      widthPx: 43,
      heightPx: 43,
      seed: 107,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-encoding-nonascii-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const routePrefix = String(images.buildImagesRouteUrl({ query: 'path=' }));
    const responsePromise = page.waitForResponse((response) =>
      response.url().startsWith(routePrefix),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    const response = await responsePromise;

    expect({
      rawPathValue: String(images.readRawPathQueryValue({ url: response.url() })),
      decodedPathValue: String(images.decodeRawPathQueryValue({ url: response.url() })),
      status: response.status(),
    }).toStrictEqual({
      rawPathValue: String(
        images.buildExpectedRawPathQueryValue({ imagePath: String(seeded.imagePath) }),
      ),
      decodedPathValue: String(seeded.imagePath),
      status: 200,
    });

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(43);
  });
});
