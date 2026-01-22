/**
 * Scenario Executor
 * Orchestrates the execution of test scenarios
 */

import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';
import {
  TestScenario,
  ScenarioResult,
  ExecutionOptions,
  TestCaseResult,
  TestStatus,
  StepResult,
  TestAssertion,
} from '../types/index';
import type { IBrowserManager, ILocatorHealer, IPageActions } from '../browser/contracts';
import { BrowserManager } from '../browser/browser-manager';
import { LocatorHealer } from '../browser/locator-healer';
import { PageActions } from '../browser/page-actions';

/**
 * ScenarioExecutor - Manages test scenario execution
 */
export class ScenarioExecutor {
  private logger = createLogger('ScenarioExecutor');

  constructor(
    private browserManager: IBrowserManager = new BrowserManager(),
    private pageActions: IPageActions = new PageActions(),
    private locatorHealer: ILocatorHealer = new LocatorHealer()
  ) {}

  /**
   * Execute a complete test scenario
   */
  async executeScenario(
    scenarioPath: string,
    options: ExecutionOptions = {}
  ): Promise<ScenarioResult> {
    this.logger.info('Starting scenario execution', { scenarioPath, options });

    // Load and parse scenario
    const scenario = this.loadScenario(scenarioPath);
    let scenarioDirty = false;
    const markScenarioDirty = () => {
      scenarioDirty = true;
    };
    
    const startTime = new Date();
    const testCaseResults: TestCaseResult[] = [];
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    const session = await this.browserManager.createSession(scenario.browserType, options);
    const { sessionId, page } = session;

    try {
      // Execute each test case sequentially (same session/page across the scenario)
      for (const testCase of scenario.testCases) {
        this.logger.info(`Executing test case: ${testCase.name}`, {
          testCaseId: testCase.id,
        });

        const tcStart = new Date();
        const stepResults: StepResult[] = [];
        let tcStatus: TestStatus = 'passed';
        let failureReason: string | undefined;

        try {
          for (const step of testCase.steps) {
            this.browserManager.touch(sessionId);

            const stepStart = Date.now();
            const timestamp = new Date();

            try {
              switch (step.action) {
                case 'navigate': {
                  if (!step.value) throw new Error('navigate step requires value');
                  await this.pageActions.navigate(page, scenario.baseUrl, step.value, step.timeout);
                  break;
                }
                case 'click': {
                  if (!step.target) throw new Error('click step requires target');
                  step.target = await this.ensureTarget(page, step.target, step.timeout, options, {
                    scenarioId: scenario.scenarioId,
                    testCaseId: testCase.id,
                    stepId: step.id,
                    kind: 'step',
                  }, markScenarioDirty);
                  await this.pageActions.click(page, step.target, step.timeout);
                  break;
                }
                case 'type': {
                  if (!step.target) throw new Error('type step requires target');
                  if (step.value === undefined) throw new Error('type step requires value');
                  step.target = await this.ensureTarget(page, step.target, step.timeout, options, {
                    scenarioId: scenario.scenarioId,
                    testCaseId: testCase.id,
                    stepId: step.id,
                    kind: 'step',
                  }, markScenarioDirty);
                  await this.pageActions.type(page, step.target, step.value, step.timeout);
                  break;
                }
                case 'wait': {
                  const waitMs =
                    step.timeout ??
                    (step.value !== undefined ? Number(step.value) : undefined) ??
                    1000;
                  await this.pageActions.wait(page, waitMs);
                  break;
                }
                case 'assert': {
                  const assertions = step.assertions ?? [];
                  await this.ensureAssertionsTargets(page, assertions, step.timeout, options, {
                    scenarioId: scenario.scenarioId,
                    testCaseId: testCase.id,
                    stepId: step.id,
                  }, markScenarioDirty);
                  const assertionResults = await this.pageActions.assert(page, assertions, step.timeout);
                  stepResults.push({
                    stepId: step.id,
                    action: step.action,
                    status: 'passed',
                    duration: Date.now() - stepStart,
                    assertionResults,
                    timestamp,
                  });
                  continue;
                }
                default: {
                  const neverAction: never = step.action;
                  throw new Error(`Unsupported action: ${neverAction}`);
                }
              }

              stepResults.push({
                stepId: step.id,
                action: step.action,
                status: 'passed',
                duration: Date.now() - stepStart,
                timestamp,
              });
            } catch (error) {
              const errMsg = error instanceof Error ? error.message : String(error);
              const screenshotPath = await this.tryScreenshot(
                scenario.scenarioId,
                testCase.id,
                step.id,
                options,
                page
              );

              stepResults.push({
                stepId: step.id,
                action: step.action,
                status: 'failed',
                duration: Date.now() - stepStart,
                error: errMsg,
                screenshot: screenshotPath ?? undefined,
                timestamp,
              });

              tcStatus = 'failed';
              failureReason = errMsg;
              throw error;
            }
          }
        } catch (error) {
          this.logger.error('Test case failed', {
            testCaseId: testCase.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        const tcEnd = new Date();
        const tcDuration = tcEnd.getTime() - tcStart.getTime();

        const result: TestCaseResult = {
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status: tcStatus,
          startTime: tcStart,
          endTime: tcEnd,
          duration: tcDuration,
          stepResults,
          failureReason,
        };

        testCaseResults.push(result);

        if (tcStatus === 'passed') passed++;
        else if (tcStatus === 'failed') failed++;
        else skipped++;
      }
    } finally {
      await this.browserManager.closeSession(sessionId);
      await this.browserManager.dispose();
    }

    if (scenarioDirty && (options.persistHealedLocators ?? true)) {
      this.persistScenario(scenarioPath, scenario);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    const scenarioResult: ScenarioResult = {
      scenarioId: scenario.scenarioId,
      scenarioName: scenario.scenarioName,
      totalTestCases: scenario.testCases.length,
      passed,
      failed,
      skipped,
      startTime,
      endTime,
      duration,
      testCaseResults,
      browserType: scenario.browserType,
      baseUrl: scenario.baseUrl,
    };

    this.logger.info('Scenario execution completed', {
      scenarioId: scenario.scenarioId,
      passed,
      failed,
      skipped,
      duration: `${duration}ms`,
    });

    return scenarioResult;
  }

  private async tryScreenshot(
    scenarioId: string,
    testCaseId: string,
    stepId: string,
    options: ExecutionOptions,
    page: { screenshot: (opts: { path: string; fullPage: boolean }) => Promise<unknown> }
  ): Promise<string | null> {
    if (!options.screenshot) return null;

    try {
      const dir = path.join(process.cwd(), 'test-results', scenarioId, testCaseId);
      fs.mkdirSync(dir, { recursive: true });
      const file = `${stepId}-${Date.now()}.png`;
      const fullPath = path.join(dir, file);
      await page.screenshot({ path: fullPath, fullPage: true });
      return fullPath;
    } catch (error) {
      this.logger.warn('Failed to take screenshot', {
        scenarioId,
        testCaseId,
        stepId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async ensureTarget(
    page: { locator: (s: string) => { first: () => { waitFor: (o: { state: 'attached'; timeout: number }) => Promise<void> } } },
    target: string,
    stepTimeoutMs: number | undefined,
    options: ExecutionOptions,
    meta: { scenarioId: string; testCaseId: string; stepId: string; kind: 'step' | 'assertion' }
    ,
    markScenarioDirty: () => void
  ): Promise<string> {
    const probeTimeoutMs = Math.min(750, stepTimeoutMs ?? 750);
    const ok = await this.isPresent(page, target, probeTimeoutMs);
    if (ok) return target;

    if (options.autoHeal === false) return target;

    const healed = await this.locatorHealer.heal(page as any, target, probeTimeoutMs);
    if (healed.healedTarget) {
      this.logger.warn('Auto-heal updated target', {
        ...meta,
        from: target,
        to: healed.healedTarget,
      });
      markScenarioDirty();
      return healed.healedTarget;
    }

    // Special-case message for login to match the requested behavior
    if (/login/i.test(target)) {
      throw new Error(`Auto-heal could not identify a locator for login. Original target: ${target}`);
    }

    return target; // keep original; the action will fail with the original error path
  }

  private async ensureAssertionsTargets(
    page: any,
    assertions: TestAssertion[],
    stepTimeoutMs: number | undefined,
    options: ExecutionOptions,
    meta: { scenarioId: string; testCaseId: string; stepId: string }
    ,
    markScenarioDirty: () => void
  ): Promise<void> {
    for (const a of assertions) {
      const updated = await this.ensureTarget(page, a.target, stepTimeoutMs, options, {
        ...meta,
        kind: 'assertion',
      }, markScenarioDirty);
      a.target = updated;
    }
  }

  private async isPresent(
    page: { locator: (s: string) => { first: () => { waitFor: (o: { state: 'attached'; timeout: number }) => Promise<void> } } },
    target: string,
    timeoutMs: number
  ): Promise<boolean> {
    try {
      await page.locator(target).first().waitFor({ state: 'attached', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  private persistScenario(scenarioPath: string, scenario: TestScenario): void {
    try {
      const pretty = `${JSON.stringify(scenario, null, 2)}\n`;
      fs.writeFileSync(scenarioPath, pretty, 'utf-8');
      this.logger.info('Persisted healed locators to scenario JSON', { scenarioPath });
    } catch (error) {
      this.logger.warn('Failed to persist healed locators to scenario JSON', {
        scenarioPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load and parse a test scenario from JSON file
   */
  private loadScenario(scenarioPath: string): TestScenario {
    this.logger.debug('Loading scenario', { scenarioPath });

    if (!fs.existsSync(scenarioPath)) {
      throw new Error(`Scenario file not found: ${scenarioPath}`);
    }

    const content = fs.readFileSync(scenarioPath, 'utf-8');
    const scenario = JSON.parse(content) as TestScenario;

    // Basic validation
    if (!scenario.scenarioId || !scenario.scenarioName || !scenario.baseUrl) {
      throw new Error('Invalid scenario format: missing required fields');
    }

    if (!scenario.testCases || scenario.testCases.length === 0) {
      throw new Error('Scenario must contain at least one test case');
    }

    this.logger.info('Scenario loaded successfully', {
      scenarioId: scenario.scenarioId,
      testCases: scenario.testCases.length,
    });

    return scenario;
  }
}