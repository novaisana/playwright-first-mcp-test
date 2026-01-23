/**
 * Test Runner - Scalable Multi-Scenario Executor
 * Discovers and executes all test scenarios from the test-scenarios folder
 */

import { ScenarioExecutor } from '../server/scenario-executer';
import { createLogger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const logger = createLogger('TestRunner');

interface ScenarioSummary {
  scenarioName: string;
  scenarioId: string;
  status: 'passed' | 'failed';
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  error?: string;
}

async function runAllScenarios() {
  logger.info('='.repeat(60));
  logger.info('MCP-Playwright Test Runner - Multi-Scenario Execution');
  logger.info('='.repeat(60));

  try {
    const executor = new ScenarioExecutor();
    const scenariosDir = path.join(process.cwd(), 'test-scenarios');

    // Validate scenarios directory exists
    if (!fs.existsSync(scenariosDir)) {
      throw new Error(`test-scenarios directory not found: ${scenariosDir}`);
    }

    // Discover all scenario files
    const scenarioFiles = fs
      .readdirSync(scenariosDir)
      .filter((file) => file.endsWith('.json'))
      .sort();

    if (scenarioFiles.length === 0) {
      throw new Error('No scenario files (.json) found in test-scenarios folder');
    }

    logger.info(`Discovered ${scenarioFiles.length} scenario(s)`, { scenarioFiles });

    // Execute scenarios and collect results
    const summaries: ScenarioSummary[] = [];
    let totalDuration = 0;

    for (const file of scenarioFiles) {
      const scenarioPath = path.join(scenariosDir, file);
      logger.info(`Executing scenario: ${file}`);

      try {
        const result = await executor.executeScenario(scenarioPath, {
          headless: process.env.HEADLESS !== 'false',
          screenshot: true,
          timeout: 30000,
          persistHealedLocators: true,
        });

        const status = result.failed === 0 ? 'passed' : 'failed';
        summaries.push({
          scenarioName: result.scenarioName,
          scenarioId: result.scenarioId,
          status,
          passed: result.passed,
          failed: result.failed,
          skipped: result.skipped,
          duration: result.duration,
        });

        totalDuration += result.duration;
        logger.info(`Scenario completed: ${file}`, { status });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        summaries.push({
          scenarioName: file,
          scenarioId: file,
          status: 'failed',
          passed: 0,
          failed: 1,
          skipped: 0,
          duration: 0,
          error: errorMsg,
        });

        logger.error(`Scenario failed: ${file}`, { error: errorMsg });
      }
    }

    // Display results
    logger.info('='.repeat(60));
    logger.info('TEST EXECUTION RESULTS');
    logger.info('='.repeat(60));

    const passedScenarios = summaries.filter((s) => s.status === 'passed').length;
    const failedScenarios = summaries.filter((s) => s.status === 'failed').length;
    const totalTests = summaries.reduce((sum, s) => sum + (s.passed + s.failed + s.skipped), 0);
    const totalPassed = summaries.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = summaries.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = summaries.reduce((sum, s) => sum + s.skipped, 0);

    console.log('\n--- Overall Summary ---');
    console.log(`Total Scenarios: ${summaries.length}`);
    console.log(`✓ Scenarios Passed: ${passedScenarios}`);
    console.log(`✗ Scenarios Failed: ${failedScenarios}`);

    console.log('\n--- Test Cases Summary ---');
    console.log(`Total Test Cases: ${totalTests}`);
    console.log(`✓ Passed: ${totalPassed}`);
    console.log(`✗ Failed: ${totalFailed}`);
    console.log(`○ Skipped: ${totalSkipped}`);
    console.log(`Total Duration: ${totalDuration}ms`);

    console.log('\n--- Scenario Details ---');
    summaries.forEach((summary, index) => {
      const icon = summary.status === 'passed' ? '✓' : '✗';
      console.log(`${icon} ${index + 1}. ${summary.scenarioName}`);
      console.log(
        `   Passed: ${summary.passed}, Failed: ${summary.failed}, Skipped: ${summary.skipped}, Duration: ${summary.duration}ms`
      );
      if (summary.error) {
        console.log(`   Error: ${summary.error}`);
      }
    });

    logger.info('='.repeat(60));

    // Exit with appropriate status
    if (failedScenarios === 0) {
      logger.info('All scenarios completed successfully');
      logger.info('='.repeat(60));
      process.exit(0);
    } else {
      logger.error(`${failedScenarios} scenario(s) failed`);
      logger.info('='.repeat(60));
      process.exit(1);
    }
  } catch (error) {
    logger.error('Test execution failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

runAllScenarios();