/**
 * Type Definitions for MCP-Playwright Test Framework
 * These interfaces define the structure of our test scenarios and results
 */

// ============================================
// Test Action and Assertion Types
// ============================================

/**
 * Available test actions that can be performed
 */
export type TestAction = 'navigate' | 'click' | 'type' | 'wait' | 'assert';

/**
 * Types of assertions that can be performed
 */
export type AssertionType = 'visible' | 'text' | 'attribute' | 'url' | 'count';

/**
 * Browser types supported by Playwright
 */
export type BrowserType = 'chromium' | 'firefox' | 'webkit';

/**
 * Test execution status
 */
export type TestStatus = 'passed' | 'failed' | 'skipped';

/**
 * Test priority levels
 */
export type TestPriority = 'high' | 'medium' | 'low';

// ============================================
// Test Scenario Structures
// ============================================

/**
 * Assertion definition - what to verify in a test step
 */
export interface TestAssertion {
  type: AssertionType;
  target: string;
  expected: string | number;
  description?: string;
}

/**
 * Individual test step - a single action in a test case
 */
export interface TestStep {
  id: string;
  action: TestAction;
  target?: string;
  value?: string;
  timeout?: number;
  assertions?: TestAssertion[];
  description: string;
}

/**
 * Test case - a complete test scenario with multiple steps
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  priority: TestPriority;
  tags: string[];
  steps: TestStep[];
}

/**
 * Test scenario - collection of related test cases
 */
export interface TestScenario {
  scenarioId: string;
  scenarioName: string;
  baseUrl: string;
  browserType: BrowserType;
  testCases: TestCase[];
}

// ============================================
// Test Execution Results
// ============================================

/**
 * Result of a single assertion
 */
export interface AssertionResult {
  type: AssertionType;
  expected: string | number;
  actual: string | number;
  passed: boolean;
  message: string;
}

/**
 * Result of a single test step
 */
export interface StepResult {
  stepId: string;
  action: TestAction;
  status: TestStatus;
  duration: number;
  error?: string;
  screenshot?: string;
  assertionResults?: AssertionResult[];
  timestamp: Date;
}

/**
 * Result of a complete test case
 */
export interface TestCaseResult {
  testCaseId: string;
  testCaseName: string;
  status: TestStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  stepResults: StepResult[];
  failureReason?: string;
}

/**
 * Result of an entire scenario execution
 */
export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  totalTestCases: number;
  passed: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  testCaseResults: TestCaseResult[];
  browserType: BrowserType;
  baseUrl: string;
}

// ============================================
// MCP Server Types
// ============================================

/**
 * MCP tool call request
 */
export interface MCPToolCall {
  name: string;
  arguments: any;
}

/**
 * MCP tool response
 */
export interface MCPToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Execution options for test scenarios
 */
export interface ExecutionOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  screenshot?: boolean;
  video?: boolean;
  /** Enable/disable locator auto-heal (default: true) */
  autoHeal?: boolean;
  /** Persist healed locators back to scenario JSON file (default: true) */
  persistHealedLocators?: boolean;
}

/**
 * Browser session information
 */
export interface BrowserSession {
  sessionId: string;
  browserType: BrowserType;
  launchTime: Date;
  lastActivity: Date;
  status: 'active' | 'closed';
}

// ============================================
// Logger Types
// ============================================

/**
 * Log levels for the logger
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Log metadata
 */
export interface LogMetadata {
  [key: string]: any;
}