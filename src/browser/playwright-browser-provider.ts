import { chromium, firefox, webkit, type Browser } from 'playwright';
import type { BrowserType, ExecutionOptions } from '../types';
import { createLogger } from '../utils/logger';
import type { IBrowserProvider } from './contracts';

/**
 * PlaywrightBrowserProvider
 * - One Browser instance per BrowserType (cached)
 * - Context/page are created per-session by BrowserManager
 */
export class PlaywrightBrowserProvider implements IBrowserProvider {
  private logger = createLogger('PlaywrightBrowserProvider');
  private browsers = new Map<BrowserType, Browser>();

  async getBrowser(browserType: BrowserType, options: ExecutionOptions): Promise<Browser> {
    const existing = this.browsers.get(browserType);
    if (existing) return existing;

    const headless = options.headless ?? true;
    const slowMo = options.slowMo ?? 0;

    this.logger.info('Launching browser', { browserType, headless, slowMo });

    const browser = await this.launch(browserType, { headless, slowMo });
    this.browsers.set(browserType, browser);
    return browser;
  }

  async dispose(): Promise<void> {
    const entries = Array.from(this.browsers.entries());
    this.browsers.clear();

    await Promise.all(
      entries.map(async ([browserType, browser]) => {
        try {
          this.logger.info('Closing browser', { browserType });
          await browser.close();
        } catch (error) {
          this.logger.error('Failed to close browser', {
            browserType,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );
  }

  private async launch(
    browserType: BrowserType,
    launch: { headless: boolean; slowMo: number }
  ): Promise<Browser> {
    switch (browserType) {
      case 'chromium':
        return chromium.launch(launch);
      case 'firefox':
        return firefox.launch(launch);
      case 'webkit':
        return webkit.launch(launch);
      default: {
        // Exhaustive check for future-proofing
        const neverType: never = browserType;
        throw new Error(`Unsupported browser type: ${neverType}`);
      }
    }
  }
}

