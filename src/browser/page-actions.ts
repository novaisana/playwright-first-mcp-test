import type { Locator, Page } from 'playwright';
import { createLogger } from '../utils/logger';
import type {
  AssertionResult,
  AssertionType,
  TestAssertion,
} from '../types';
import type { IPageActions } from './contracts';

export class PageActions implements IPageActions {
  private logger = createLogger('PageActions');

  async navigate(page: Page, baseUrl: string, value: string, timeoutMs?: number): Promise<void> {
    const url = this.resolveUrl(baseUrl, value);
    this.logger.debug('Navigate', { url, timeoutMs });
    await page.goto(url, { timeout: timeoutMs });
  }

  async click(page: Page, target: string, timeoutMs?: number): Promise<void> {
    this.logger.debug('Click', { target, timeoutMs });
    await page.locator(target).click({ timeout: timeoutMs });
  }

  async type(page: Page, target: string, value: string, timeoutMs?: number): Promise<void> {
    this.logger.debug('Type', { target, timeoutMs });
    const locator = page.locator(target);
    await locator.fill(value, { timeout: timeoutMs });
  }

  async wait(page: Page, timeoutMs: number): Promise<void> {
    this.logger.debug('Wait', { timeoutMs });
    await page.waitForTimeout(timeoutMs);
  }

  async assert(page: Page, assertions: TestAssertion[], timeoutMs?: number): Promise<AssertionResult[]> {
    const results: AssertionResult[] = [];

    for (const a of assertions) {
      results.push(await this.runAssertion(page, a, timeoutMs));
    }

    const failures = results.filter((r) => !r.passed);
    if (failures.length > 0) {
      const msg = failures.map((f) => f.message).join(' | ');
      throw new Error(`Assertion failed: ${msg}`);
    }

    return results;
  }

  private resolveUrl(baseUrl: string, value: string): string {
    // If value is absolute URL, use it.
    if (/^https?:\/\//i.test(value)) return value;
    // Ensure baseUrl has no trailing slash, value has leading slash.
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${base}${path}`;
  }

  private async runAssertion(
    page: Page,
    assertion: TestAssertion,
    timeoutMs?: number
  ): Promise<AssertionResult> {
    const { type, target, expected } = assertion;

    switch (type) {
      case 'visible':
        return this.assertVisible(page, target, expected, timeoutMs);
      case 'text':
        return this.assertText(page, target, expected, timeoutMs);
      case 'attribute':
        return this.assertAttribute(page, target, expected, timeoutMs);
      case 'url':
        return this.assertUrl(page, expected);
      case 'count':
        return this.assertCount(page, target, expected, timeoutMs);
      default: {
        const neverType: never = type;
        throw new Error(`Unsupported assertion type: ${neverType as AssertionType}`);
      }
    }
  }

  private async assertVisible(
    page: Page,
    target: string,
    expected: string | number,
    timeoutMs?: number
  ): Promise<AssertionResult> {
    const locator = page.locator(target);
    const expectedBool = this.toBoolean(expected);
    const actual = await locator.isVisible({ timeout: timeoutMs });
    const passed = actual === expectedBool;
    return {
      type: 'visible',
      expected: String(expectedBool),
      actual: String(actual),
      passed,
      message: passed
        ? `visible OK: ${target}`
        : `expected visible=${expectedBool} but got ${actual} for ${target}`,
    };
  }

  private async assertText(
    page: Page,
    target: string,
    expected: string | number,
    timeoutMs?: number
  ): Promise<AssertionResult> {
    const locator = page.locator(target);
    const expectedStr = String(expected);
    await locator.waitFor({ state: 'attached', timeout: timeoutMs });
    const actualText = (await locator.first().textContent()) ?? '';
    const actual = actualText.trim();
    const passed = actual.includes(expectedStr);
    return {
      type: 'text',
      expected: expectedStr,
      actual,
      passed,
      message: passed
        ? `text OK: ${target} contains "${expectedStr}"`
        : `expected text to contain "${expectedStr}" but got "${actual}" for ${target}`,
    };
  }

  private async assertAttribute(
    page: Page,
    target: string,
    expected: string | number,
    timeoutMs?: number
  ): Promise<AssertionResult> {
    // Format: target can be "cssSelector@attrName"
    const [selector, attrName] = target.split('@');
    if (!selector || !attrName) {
      throw new Error(`Invalid attribute assertion target. Use "selector@attrName". Got: ${target}`);
    }
    const locator: Locator = page.locator(selector);
    await locator.waitFor({ state: 'attached', timeout: timeoutMs });
    const actualAttr = await locator.first().getAttribute(attrName);
    const actual = actualAttr ?? '';
    const expectedStr = String(expected);
    const passed = actual === expectedStr;
    return {
      type: 'attribute',
      expected: expectedStr,
      actual,
      passed,
      message: passed
        ? `attribute OK: ${selector}@${attrName} == "${expectedStr}"`
        : `expected ${selector}@${attrName} == "${expectedStr}" but got "${actual}"`,
    };
  }

  private async assertUrl(page: Page, expected: string | number): Promise<AssertionResult> {
    const expectedStr = String(expected);
    const actual = page.url();
    const passed = actual.includes(expectedStr);
    return {
      type: 'url',
      expected: expectedStr,
      actual,
      passed,
      message: passed ? `url OK: contains "${expectedStr}"` : `expected url to contain "${expectedStr}" but got "${actual}"`,
    };
  }

  private async assertCount(
    page: Page,
    target: string,
    expected: string | number,
    timeoutMs?: number
  ): Promise<AssertionResult> {
    const expectedNum = typeof expected === 'number' ? expected : Number(expected);
    if (!Number.isFinite(expectedNum)) {
      throw new Error(`Invalid expected count: ${String(expected)}`);
    }
    const locator = page.locator(target);
    // Wait for at least the DOM to settle for the selector.
    await locator.first().waitFor({ state: 'attached', timeout: timeoutMs });
    const actual = await locator.count();
    const passed = actual === expectedNum;
    return {
      type: 'count',
      expected: expectedNum,
      actual,
      passed,
      message: passed ? `count OK: ${target} == ${expectedNum}` : `expected count ${expectedNum} but got ${actual} for ${target}`,
    };
  }

  private toBoolean(value: string | number): boolean {
    if (typeof value === 'number') return value !== 0;
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
    // fallback: non-empty string => true
    return Boolean(v);
  }
}

