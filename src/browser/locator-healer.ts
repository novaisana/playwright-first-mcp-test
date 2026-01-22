import type { Page } from 'playwright';
import { createLogger } from '../utils/logger';
import type { ILocatorHealer, LocatorHealResult } from './contracts';

/**
 * LocatorHealer
 * Heuristics-based auto-heal for CSS selectors.
 * Primary strategy: if selector includes id/data-test, generate alternative candidates.
 */
export class LocatorHealer implements ILocatorHealer {
  private logger = createLogger('LocatorHealer');

  async heal(page: Page, target: string, probeTimeoutMs: number = 750): Promise<LocatorHealResult> {
    const candidates = await this.generateCandidates(page, target);
    const tried: string[] = [];

    for (const candidate of candidates) {
      tried.push(candidate);
      const ok = await this.isPresent(page, candidate, probeTimeoutMs);
      if (ok) {
        this.logger.info('Auto-heal succeeded', {
          from: target,
          to: candidate,
          probeTimeoutMs,
        });
        return { healedTarget: candidate, tried };
      }
    }

    this.logger.debug('Auto-heal found no alternative', { target, triedCount: tried.length });
    return { healedTarget: null, tried };
  }

  private async isPresent(page: Page, selector: string, timeoutMs: number): Promise<boolean> {
    try {
      await page.locator(selector).first().waitFor({ state: 'attached', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  private async generateCandidates(page: Page, target: string): Promise<string[]> {
    // For attribute assertion targets like "selector@attr", only heal selector part.
    const [selectorPart, attrPart] = target.includes('@') ? target.split('@') : [target, undefined];

    const base = selectorPart.trim();
    const id = this.extractAttrValue(base, 'id') ?? this.extractIdHash(base);
    const dataTest = this.extractAttrValue(base, 'data-test');

    const candidates: string[] = [];

    if (id) {
      // Common typo-fixes / small mutations
      const typoFixes = this.generateIdMutations(id);
      for (const fixed of typoFixes) {
        candidates.push(`#${this.cssEscapeId(fixed)}`);
        candidates.push(`[id=\"${this.cssEscapeAttr(fixed)}\"]`);
        candidates.push(`input#${this.cssEscapeId(fixed)}`);
        candidates.push(`button#${this.cssEscapeId(fixed)}`);
      }

      // Most robust forms
      candidates.push(`#${this.cssEscapeId(id)}`);
      candidates.push(`[id=\"${this.cssEscapeAttr(id)}\"]`);
      candidates.push(`*[id=\"${this.cssEscapeAttr(id)}\"]`);

      // Common tag variants (fixes saucedemo login-button which is an <input>, not <button>)
      candidates.push(`input#${this.cssEscapeId(id)}`);
      candidates.push(`button#${this.cssEscapeId(id)}`);
      candidates.push(`input[id=\"${this.cssEscapeAttr(id)}\"]`);
      candidates.push(`button[id=\"${this.cssEscapeAttr(id)}\"]`);
    }

    if (dataTest) {
      candidates.push(`[data-test=\"${this.cssEscapeAttr(dataTest)}\"]`);
      candidates.push(`*[data-test=\"${this.cssEscapeAttr(dataTest)}\"]`);
      candidates.push(`button[data-test=\"${this.cssEscapeAttr(dataTest)}\"]`);
      candidates.push(`input[data-test=\"${this.cssEscapeAttr(dataTest)}\"]`);
    }

    // Special-case: if selector looked like "button[id='x']" and we have x, try "input[id='x']" earlier.
    if (id && /\bbutton\b/i.test(base) && !candidates.includes(`input[id=\"${this.cssEscapeAttr(id)}\"]`)) {
      candidates.unshift(`input[id=\"${this.cssEscapeAttr(id)}\"]`);
      candidates.unshift(`input#${this.cssEscapeId(id)}`);
    }

    // Fuzzy-match against existing element ids on the page (helps with typos like login-buton -> login-button)
    if (id) {
      const bestId = await this.findClosestExistingId(page, id);
      if (bestId) {
        // Prefer the simplest usable form
        candidates.unshift(`#${this.cssEscapeId(bestId)}`);
        candidates.unshift(`[id=\"${this.cssEscapeAttr(bestId)}\"]`);
      }
    }

    // Re-attach attribute part if present
    const finalized = attrPart
      ? candidates.map((c) => `${c}@${attrPart}`)
      : candidates;

    // Remove duplicates and the original selector
    return Array.from(new Set(finalized)).filter((c) => c !== target);
  }

  private extractAttrValue(selector: string, attrName: string): string | null {
    // matches [attr='x'] or [attr="x"] possibly with tag prefix like button[attr='x']
    const re = new RegExp(`${attrName}\\s*=\\s*['\\"]([^'\\"]+)['\\"]`, 'i');
    const m = selector.match(re);
    return m?.[1] ?? null;
  }

  private extractIdHash(selector: string): string | null {
    // matches #id (simple case)
    const m = selector.match(/#([A-Za-z_][A-Za-z0-9_-]*)/);
    return m?.[1] ?? null;
  }

  private cssEscapeId(id: string): string {
    // Minimal escape for ids used after '#'
    return id.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  private cssEscapeAttr(value: string): string {
    // Escape for inside double quotes
    return value.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
  }

  private generateIdMutations(id: string): string[] {
    const out: string[] = [];
    const lower = id.toLowerCase();

    // buton -> button
    if (lower.includes('buton')) out.push(id.replace(/buton/gi, 'button'));

    // singular missing 't' in common patterns
    if (lower.includes('login-buton')) out.push(id.replace(/login-buton/gi, 'login-button'));

    return Array.from(new Set(out)).filter((x) => x !== id);
  }

  private async findClosestExistingId(page: Page, desiredId: string): Promise<string | null> {
    try {
      // Keep it bounded for performance; most pages have far fewer ids than this.
      const ids = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        if (!doc?.querySelectorAll) return [];
        const els = Array.from(doc.querySelectorAll('[id]')) as any[];
        const values = els.map((e) => String(e?.id ?? '')).filter(Boolean);
        // de-dupe
        return Array.from(new Set(values)).slice(0, 500);
      });

      if (!Array.isArray(ids) || ids.length === 0) return null;

      let best: { id: string; dist: number } | null = null;
      for (const candidate of ids) {
        const dist = this.levenshtein(desiredId, candidate);
        if (!best || dist < best.dist) best = { id: candidate, dist };
        // perfect match is not expected here, but early exit is cheap
        if (dist === 0) break;
      }

      if (!best) return null;

      // Accept only “close enough” matches
      const maxDist = Math.max(1, Math.floor(desiredId.length * 0.2)); // 20% of length
      if (best.dist <= maxDist) return best.id;
      return null;
    } catch {
      // If evaluate fails (cross-origin etc), just skip fuzzy mode.
      return null;
    }
  }

  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const v0 = new Array(b.length + 1).fill(0);
    const v1 = new Array(b.length + 1).fill(0);

    for (let i = 0; i <= b.length; i++) v0[i] = i;

    for (let i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < b.length; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(
          v1[j] + 1,
          v0[j + 1] + 1,
          v0[j] + cost
        );
      }
      for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
    }

    return v1[b.length];
  }
}

