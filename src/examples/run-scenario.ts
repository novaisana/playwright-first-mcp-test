/**
 * Test Runner Example
 * Demonstrates how to use the ScenarioExecutor directly
 */

import { ScenarioExecutor } from '../server/scenario-executer';
import { createLogger } from '../utils/logger';
import path from 'path';

const logger = createLogger('TestRunner');

async function runTest() {
  logger.info('='.repeat(60));
  logger.info('MCP-Playwright Test Runner - Step 1');
  logger.info('='.repeat(60));

  try {
    // Create executor
    const executor = new ScenarioExecutor();

    // Path to scenario
    const scenarioPath = path.join(
      process.cwd(),
      'test-scenarios',
      'sample-scenario.json'
    );

    logger.info('Starting test execution', { scenarioPath });

    // Execute scenario
    const result = await executor.executeScenario(scenarioPath, {
      headless: process.env.HEADLESS === 'true',
      screenshot: true,
      timeout: 30000,
      persistHealedLocators: true,
    });

    // Display results
    logger.info('='.repeat(60));
    logger.info('TEST EXECUTION RESULTS');
    logger.info('='.repeat(60));
    
    console.log('\nScenario:', result.scenarioName);
    console.log('Scenario ID:', result.scenarioId);
    console.log('Base URL:', result.baseUrl);
    console.log('Browser:', result.browserType);
    console.log('\n--- Summary ---');
    console.log('Total Test Cases:', result.totalTestCases);
    console.log('✓ Passed:', result.passed);
    console.log('✗ Failed:', result.failed);
    console.log('○ Skipped:', result.skipped);
    console.log('Duration:', `${result.duration}ms`);
    
    console.log('\n--- Test Cases ---');
    result.testCaseResults.forEach((tc, index) => {
      const icon = tc.status === 'passed' ? '✓' : tc.status === 'failed' ? '✗' : '○';
      console.log(`${icon} ${index + 1}. ${tc.testCaseName} (${tc.status})`);
      if (tc.failureReason) {
        console.log(`   Reason: ${tc.failureReason}`);
      }
    });

    logger.info('='.repeat(60));
    logger.info('Test execution completed successfully');
    logger.info('='.repeat(60));

  } catch (error) {
    logger.error('Test execution failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();