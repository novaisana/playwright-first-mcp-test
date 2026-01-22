import { createLogger } from '../utils/logger';
import type { BrowserSessionMetadata, ISessionStore } from './contracts';

/**
 * InMemorySessionStore
 * Simple in-process store for session metadata.
 */
export class InMemorySessionStore implements ISessionStore {
  private logger = createLogger('InMemorySessionStore');
  private sessions = new Map<string, BrowserSessionMetadata>();

  create(metadata: BrowserSessionMetadata): void {
    if (this.sessions.has(metadata.sessionId)) {
      throw new Error(`Session already exists: ${metadata.sessionId}`);
    }
    this.sessions.set(metadata.sessionId, metadata);
    this.logger.debug('Session metadata created', {
      sessionId: metadata.sessionId,
      browserType: metadata.browserType,
    });
  }

  get(sessionId: string): BrowserSessionMetadata | undefined {
    return this.sessions.get(sessionId);
  }

  update(sessionId: string, patch: Partial<BrowserSessionMetadata>): void {
    const current = this.sessions.get(sessionId);
    if (!current) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    const updated: BrowserSessionMetadata = { ...current, ...patch };
    this.sessions.set(sessionId, updated);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  list(): BrowserSessionMetadata[] {
    return Array.from(this.sessions.values());
  }
}

