/**
 * Report Type Definitions for Test Execution Reports
 * Defines the structure for JSON reports with test evidence paths
 */

/**
 * Evidence types that can be attached to test cases or steps
 */
export type EvidenceType = 'screenshot' | 'payload' | 'log';

/**
 * Test execution status in reports
 */
export type ReportStatus = 'passed' | 'failed' | 'skipped';

/**
 * Execution timing information
 */
export interface ExecutionTiming {
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  duration: string; // Human-readable format (e.g., "13m 17.8s")
  durationMs: number; // Duration in milliseconds
}

/**
 * Configuration details captured at execution time
 */
export interface ReportConfiguration {
  browserType: 'chromium' | 'firefox' | 'webkit';
  browserVersion?: string;
  parallelism?: number;
  retryFailed?: number;
  timeout: number;
  headless: boolean;
}

/**
 * Test execution summary with aggregate metrics
 */
export interface ReportSummary {
  totalScenarios: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number; // Percentage: 0-100
}

/**
 * Evidence item attached to test cases or steps
 * Includes screenshots, payloads, logs, etc. with local file paths
 */
export interface Evidence {
  type: EvidenceType;
  url?: string; // URL for screenshots and external links
  filePath?: string; // Local file path for embedded evidence
  format?: string; // Format of embedded data (e.g., 'json', 'text')
  data?: any; // Embedded data for payloads or logs
  description: string;
  timestamp: string; // ISO 8601 format
}

/**
 * Assertion result in report format
 */
export interface ReportAssertion {
  type: 'visible' | 'text' | 'attribute' | 'url' | 'count';
  target: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  description: string;
  status: ReportStatus;
}

/**
 * Step result in report format
 */
export interface ReportStep {
  id: string;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert';
  target?: string;
  value?: string;
  description: string;
  timeout?: number;
  status: ReportStatus;
  execution: ExecutionTiming;
  assertions?: ReportAssertion[];
  error?: string;
}

/**
 * Test case result in report format with evidence
 */
export interface ReportTestCase {
  id: string;
  name: string;
  description: string;
  status: ReportStatus;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  execution: ExecutionTiming;
  evidence: Evidence[];
  steps: ReportStep[];
  failureReason?: string;
}

/**
 * Scenario result in report format
 */
export interface ReportScenario {
  scenarioId: string;
  scenarioName: string;
  baseUrl: string;
  status: ReportStatus;
  execution: ExecutionTiming;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  testCases: ReportTestCase[];
}

/**
 * Complete test execution report with full details and evidence paths
 */
export interface Report {
  reportId: string;
  testRunId: string;
  testRunName: string;
  environment: string;
  execution: ExecutionTiming;
  configuration: ReportConfiguration;
  summary: ReportSummary;
  scenarios: ReportScenario[];
}
