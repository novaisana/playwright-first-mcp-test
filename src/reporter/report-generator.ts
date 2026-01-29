/**
 * Report Generator
 * Transforms ScenarioResult[] into Report format with evidence paths
 */

import { ScenarioResult, TestCaseResult, StepResult } from '../types';
import {
  Report,
  ReportScenario,
  ReportTestCase,
  ReportStep,
  ReportSummary,
  Evidence,
} from '../types/report';
import { generateReportId, formatDuration, toISOString } from './test-run-id-generator';
import path from 'path';

interface ReportGeneratorOptions {
  testRunId: string;
  testRunName: string;
  environment: string;
  startTime: Date;
  endTime: Date;
  browserVersion?: string;
  parallelism?: number;
  retryFailed?: number;
}

/**
 * Converts test case result to report format with evidence paths
 */
function convertTestCaseToReport(testCaseResult: TestCaseResult): ReportTestCase {
  const durationMs = testCaseResult.endTime.getTime() - testCaseResult.startTime.getTime();

  return {
    id: testCaseResult.testCaseId,
    name: testCaseResult.testCaseName,
    description: '', // Not available in TestCaseResult
    status: testCaseResult.status,
    priority: 'medium', // Default priority - not captured in TestCaseResult
    tags: [], // Default tags - not captured in TestCaseResult
    execution: {
      startTime: toISOString(testCaseResult.startTime),
      endTime: toISOString(testCaseResult.endTime),
      duration: formatDuration(durationMs),
      durationMs,
    },
    evidence: extractEvidence(testCaseResult),
    steps: testCaseResult.stepResults.map((step) => convertStepToReport(step)),
    failureReason: testCaseResult.failureReason,
  };
}

/**
 * Extracts evidence from test case result
 * Collects screenshots from steps and creates evidence objects with relative paths
 */
function extractEvidence(testCaseResult: TestCaseResult): Evidence[] {
  const evidence: Evidence[] = [];

  // Collect unique screenshots from all steps
  testCaseResult.stepResults.forEach((step) => {
    if (step.screenshot) {
      // Extract filename from full path
      const filename = path.basename(step.screenshot);

      evidence.push({
        type: 'screenshot',
        url: `./test-evidence/${filename}`,
        description: `Screenshot from step ${step.stepId}`,
        timestamp: toISOString(step.timestamp),
      });
    }
  });

  return evidence;
}

/**
 * Converts step result to report format
 */
function convertStepToReport(step: StepResult): ReportStep {
  return {
    id: step.stepId,
    action: step.action,
    description: '', // Not captured in StepResult
    status: step.status,
    execution: {
      startTime: toISOString(step.timestamp),
      endTime: new Date(step.timestamp.getTime() + step.duration).toISOString(),
      duration: formatDuration(step.duration),
      durationMs: step.duration,
    },
    assertions: step.assertionResults
      ? step.assertionResults.map((assertion) => ({
          type: assertion.type,
          target: '', // Not captured in AssertionResult
          expected: assertion.expected,
          actual: assertion.actual,
          description: assertion.message,
          status: assertion.passed ? 'passed' : 'failed',
        }))
      : [],
    error: step.error,
  };
}

/**
 * Converts scenario result to report format
 */
function convertScenarioToReport(scenario: ScenarioResult): ReportScenario {
  const durationMs = scenario.endTime.getTime() - scenario.startTime.getTime();

  return {
    scenarioId: scenario.scenarioId,
    scenarioName: scenario.scenarioName,
    baseUrl: scenario.baseUrl,
    status: scenario.failed === 0 ? 'passed' : 'failed',
    execution: {
      startTime: toISOString(scenario.startTime),
      endTime: toISOString(scenario.endTime),
      duration: formatDuration(durationMs),
      durationMs,
    },
    summary: {
      totalTests: scenario.totalTestCases,
      passed: scenario.passed,
      failed: scenario.failed,
      skipped: scenario.skipped,
    },
    testCases: scenario.testCaseResults.map((tc) =>
      convertTestCaseToReport(tc)
    ),
  };
}

/**
 * Report Generator class
 * Transforms ScenarioResult[] into Report JSON structure
 */
export class ReportGenerator {
  private options: ReportGeneratorOptions;

  constructor(options: ReportGeneratorOptions) {
    this.options = options;
  }

  /**
   * Generates a complete report from scenario results
   */
  generateReport(scenarioResults: ScenarioResult[]): Report {
    // Calculate overall metrics
    const summary = this.calculateSummary(scenarioResults);

    // Convert scenarios to report format
    const scenarios = scenarioResults.map((scenario) =>
      convertScenarioToReport(scenario)
    );

    // Calculate total duration
    const totalDurationMs = this.options.endTime.getTime() - this.options.startTime.getTime();

    // Build report
    const report: Report = {
      reportId: generateReportId(this.options.startTime),
      testRunId: this.options.testRunId,
      testRunName: this.options.testRunName,
      environment: this.options.environment,
      execution: {
        startTime: toISOString(this.options.startTime),
        endTime: toISOString(this.options.endTime),
        duration: formatDuration(totalDurationMs),
        durationMs: totalDurationMs,
      },
      configuration: {
        browserType: scenarioResults.length > 0 ? scenarioResults[0].browserType : 'chromium',
        browserVersion: this.options.browserVersion,
        parallelism: this.options.parallelism,
        retryFailed: this.options.retryFailed,
        timeout: 30000, // Default timeout
        headless: true,
      },
      summary,
      scenarios,
    };

    return report;
  }

  /**
   * Calculates aggregate summary metrics from scenario results
   */
  private calculateSummary(scenarioResults: ScenarioResult[]): ReportSummary {
    const totalTests = scenarioResults.reduce((sum, s) => sum + s.totalTestCases, 0);
    const totalPassed = scenarioResults.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = scenarioResults.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = scenarioResults.reduce((sum, s) => sum + s.skipped, 0);

    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    return {
      totalScenarios: scenarioResults.length,
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal place
    };
  }
}
