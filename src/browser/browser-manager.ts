import type { BrowserContext, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import type { BrowserType, ExecutionOptions } from '../types';
import type {
  BrowserSessionHandle,
  BrowserSessionMetadata,
  IBrowserManager,
  IBrowserProvider,
  IClock,
  IIdGenerator,
  ISessionStore,
} from './contracts';
import { InMemorySessionStore } from './in-memory-session-store';
import { PlaywrightBrowserProvider } from './playwright-browser-provider';

type SessionResources = {
  browserType: BrowserType;
  context: BrowserContext;
  page: Page;
};

class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}

class UuidGenerator implements IIdGenerator {
  newId(): string {
    return uuidv4();
  }
}

/**
 * BrowserManager
 * - Creates a session with unique ID
 * - Creates BrowserContext + Page per session
 * - Tracks metadata (launchTime, lastActivity, browserType)
 * - Cleans up context/page on close
 */
export class BrowserManager implements IBrowserManager {
  private logger = createLogger('BrowserManager');
  private resources = new Map<string, SessionResources>();

  constructor(
    private provider: IBrowserProvider = new PlaywrightBrowserProvider(),
    private store: ISessionStore = new InMemorySessionStore(),
    private clock: IClock = new SystemClock(),
    private ids: IIdGenerator = new UuidGenerator()
  ) {}

  async createSession(browserType: BrowserType, options: ExecutionOptions): Promise<BrowserSessionHandle> {
    const sessionId = this.ids.newId();
    const now = this.clock.now();

    const metadata: BrowserSessionMetadata = {
      sessionId,
      browserType,
      launchTime: now,
      lastActivity: now,
      status: 'active',
    };

    this.store.create(metadata);

    const browser = await this.provider.getBrowser(browserType, options);
    const context = await browser.newContext();
    const page = await context.newPage();

    const timeout = options.timeout ?? 30000;
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    this.resources.set(sessionId, { browserType, context, page });
    this.logger.info('Session created', { sessionId, browserType, timeout });

    return { sessionId, browserType, context, page };
  }

  touch(sessionId: string): void {
    const now = this.clock.now();
    const current = this.store.get(sessionId);
    if (!current) return;
    if (current.status !== 'active') return;
    this.store.update(sessionId, { lastActivity: now });
  }

  getSessionMetadata(sessionId: string): BrowserSessionMetadata | undefined {
    return this.store.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const now = this.clock.now();
    const current = this.store.get(sessionId);
    const res = this.resources.get(sessionId);

    if (current && current.status === 'active') {
      this.store.update(sessionId, { status: 'closed', lastActivity: now });
    }

    this.resources.delete(sessionId);

    if (!res) {
      this.logger.debug('Session resources already closed', { sessionId });
      return;
    }

    await this.safeClose('page', sessionId, () => res.page.close());
    await this.safeClose('context', sessionId, () => res.context.close());
    this.logger.info('Session closed', { sessionId, browserType: res.browserType });
  }

  async dispose(): Promise<void> {
    const openSessionIds = Array.from(this.resources.keys());
    await Promise.all(openSessionIds.map((id) => this.closeSession(id)));
    await this.provider.dispose();
  }

  private async safeClose(
    resource: 'page' | 'context',
    sessionId: string,
    fn: () => Promise<void>
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error('Failed to close resource', {
        resource,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

