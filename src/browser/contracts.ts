/**
 * Browser module contracts (DIP)
 * All higher-level code depends on these abstractions, not Playwright directly.
 */

import type { Browser, BrowserContext, Page } from 'playwright';
import type { AssertionResult, BrowserType, ExecutionOptions, TestAssertion } from '../types';

export interface BrowserSessionMetadata {
  sessionId: string;
  browserType: BrowserType;
  launchTime: Date;
  lastActivity: Date;
  status: 'active' | 'closed';
}

export interface BrowserSessionHandle {
  sessionId: string;
  browserType: BrowserType;
  context: BrowserContext;
  page: Page;
}

export interface IClock {
  now(): Date;
}

export interface IIdGenerator {
  newId(): string;
}

export interface ISessionStore {
  create(metadata: BrowserSessionMetadata): void;
  get(sessionId: string): BrowserSessionMetadata | undefined;
  update(sessionId: string, patch: Partial<BrowserSessionMetadata>): void;
  delete(sessionId: string): void;
  list(): BrowserSessionMetadata[];
}

export interface IBrowserProvider {
  getBrowser(browserType: BrowserType, options: ExecutionOptions): Promise<Browser>;
  dispose(): Promise<void>;
}

export interface IBrowserManager {
  createSession(browserType: BrowserType, options: ExecutionOptions): Promise<BrowserSessionHandle>;
  touch(sessionId: string): void;
  getSessionMetadata(sessionId: string): BrowserSessionMetadata | undefined;
  closeSession(sessionId: string): Promise<void>;
  dispose(): Promise<void>;
}

export interface IPageActions {
  navigate(page: Page, baseUrl: string, value: string, timeoutMs?: number): Promise<void>;
  click(page: Page, target: string, timeoutMs?: number): Promise<void>;
  type(page: Page, target: string, value: string, timeoutMs?: number): Promise<void>;
  wait(page: Page, timeoutMs: number): Promise<void>;
  assert(page: Page, assertions: TestAssertion[], timeoutMs?: number): Promise<AssertionResult[]>;
}

export interface LocatorHealResult {
  healedTarget: string | null;
  tried: string[];
}

export interface ILocatorHealer {
  /**
   * Try to find a working selector when the provided target is not found.
   * Returns a healedTarget (or null) and the list of tried candidates (excluding the original).
   */
  heal(page: Page, target: string, probeTimeoutMs?: number): Promise<LocatorHealResult>;
}

