/**
 * HTML Template Generator
 * Provides template literal functions for generating HTML report components
 */

/**
 * Generates inline CSS stylesheet for the report
 */
export function generateStylesheet(): string {
  return `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            color: #2d2d2d;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 25px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .report-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d2d2d;
        }

        .report-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .meta-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .meta-value {
            font-size: 16px;
            font-weight: 600;
            color: #2d2d2d;
        }

        .summary {
            display: flex;
            gap: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .summary-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .summary-label {
            font-size: 14px;
            color: #666;
        }

        .summary-value {
            font-size: 20px;
            font-weight: 600;
        }

        .summary-value.passed {
            color: #7fb89b;
        }

        .summary-value.failed {
            color: #f4b4c4;
        }

        /* Scenarios List */
        .scenarios-list {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Scenario Item */
        .scenario-item {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .scenario-header {
            display: grid;
            grid-template-columns: 180px 1fr 150px 120px 50px;
            gap: 15px;
            padding: 20px;
            background-color: #f0f4f8;
            cursor: pointer;
            align-items: center;
            transition: background-color 0.2s;
        }

        .scenario-header:hover {
            background-color: #e8eef5;
        }

        .scenario-id {
            font-size: 13px;
            font-weight: 600;
            color: #666;
        }

        .scenario-name {
            font-size: 16px;
            font-weight: 600;
            color: #2d2d2d;
        }

        .scenario-duration {
            font-size: 14px;
            color: #666;
        }

        .scenario-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
        }

        .scenario-status.passed {
            background-color: #d4edda;
            color: #155724;
        }

        .scenario-status.failed {
            background-color: #f8d7da;
            color: #721c24;
        }

        .expand-icon {
            font-size: 20px;
            color: #666;
            transition: transform 0.3s;
            text-align: center;
        }

        .scenario-item.expanded .expand-icon {
            transform: rotate(180deg);
        }

        /* Scenario Tests Container */
        .scenario-tests {
            display: none;
            padding: 20px;
            background-color: #fafafa;
            border-top: 2px solid #e0e0e0;
        }

        .scenario-item.expanded .scenario-tests {
            display: block;
        }

        .scenario-summary {
            display: flex;
            gap: 20px;
            padding: 15px;
            background-color: white;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
            flex-wrap: wrap;
        }

        .scenario-summary-item {
            display: flex;
            gap: 8px;
        }

        .scenario-summary-label {
            color: #666;
        }

        .scenario-summary-value {
            font-weight: 600;
        }

        /* Test Case Item */
        .test-item {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
            background-color: white;
        }

        .test-header {
            display: grid;
            grid-template-columns: 100px 1fr 120px 120px 50px;
            gap: 15px;
            padding: 20px;
            background-color: #fafafa;
            cursor: pointer;
            align-items: center;
            transition: background-color 0.2s;
        }

        .test-header:hover {
            background-color: #f5f5f5;
        }

        .test-id {
            font-size: 13px;
            font-weight: 600;
            color: #666;
        }

        .test-description {
            font-size: 15px;
            color: #2d2d2d;
        }

        .test-status {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
        }

        .test-status.passed {
            background-color: #d4edda;
            color: #155724;
        }

        .test-status.failed {
            background-color: #f8d7da;
            color: #721c24;
        }

        .test-item.expanded .expand-icon {
            transform: rotate(180deg);
        }

        /* Steps */
        .test-steps {
            display: none;
            padding: 20px;
            background-color: white;
            border-top: 1px solid #e0e0e0;
        }

        .test-item.expanded .test-steps {
            display: block;
        }

        .step {
            padding: 15px;
            margin-bottom: 10px;
            background-color: #f9f9f9;
            border-radius: 6px;
            border-left: 3px solid #a8c5dd;
        }

        .step.failed {
            border-left-color: #f4b4c4;
            background-color: #fff5f5;
        }

        .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .step-id {
            font-size: 12px;
            font-weight: 600;
            color: #666;
        }

        .step-action {
            font-size: 13px;
            font-weight: 600;
            color: #2d2d2d;
        }

        .step-status {
            font-size: 12px;
            font-weight: 600;
        }

        .step-status.passed {
            color: #7fb89b;
        }

        .step-status.failed {
            color: #f4b4c4;
        }

        .step-description {
            font-size: 14px;
            color: #444;
            margin-top: 5px;
        }

        .step-details {
            margin-top: 10px;
            font-size: 13px;
            color: #666;
        }

        .step-details code {
            background-color: #e8e8e8;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }

        .assertion {
            margin-top: 8px;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            font-size: 13px;
            border: 1px solid #e0e0e0;
        }

        .assertion.failed {
            background-color: #fff0f0;
            border-color: #f4b4c4;
        }

        .assertion-type {
            font-weight: 600;
            color: #7fb89b;
        }

        .assertion-type.failed {
            color: #f4b4c4;
        }

        .assertion-details {
            margin-top: 5px;
            color: #444;
        }

        .error-info {
            margin-top: 10px;
            padding: 12px;
            background-color: #fff0f0;
            border-left: 3px solid #f4b4c4;
            border-radius: 4px;
        }

        .error-message {
            font-size: 13px;
            font-weight: 600;
            color: #721c24;
            margin-bottom: 5px;
        }
    </style>
  `;
}

/**
 * Generates header section with report metadata and summary
 */
export function generateHeader(
  reportId: string,
  testRunName: string,
  environment: string,
  startTime: string,
  _endTime: string,
  duration: string,
  browserType: string,
  browserVersion: string | undefined,
  parallelism: number | undefined,
  totalScenarios: number,
  totalTests: number,
  passed: number,
  failed: number,
  skipped: number,
  successRate: number
): string {
  const browserDisplay = browserVersion ? `${browserType} ${browserVersion}` : browserType;
  const parallelismDisplay = parallelism || 1;

  return `
    <div class="header">
      <h1 class="report-title">${testRunName}</h1>
      
      <div class="report-meta">
        <div class="meta-item">
          <span class="meta-label">Report ID</span>
          <span class="meta-value">${reportId}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Execution Started</span>
          <span class="meta-value">${new Date(startTime).toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Duration</span>
          <span class="meta-value">${duration}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Environment</span>
          <span class="meta-value">${environment}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Browser</span>
          <span class="meta-value">${browserDisplay}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Parallelism</span>
          <span class="meta-value">${parallelismDisplay} thread${parallelismDisplay !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div class="summary">
        <div class="summary-item">
          <span class="summary-label">Scenarios:</span>
          <span class="summary-value">${totalScenarios}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Tests:</span>
          <span class="summary-value">${totalTests}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Passed:</span>
          <span class="summary-value passed">${passed}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Failed:</span>
          <span class="summary-value failed">${failed}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Skipped:</span>
          <span class="summary-value">${skipped}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Success Rate:</span>
          <span class="summary-value">${successRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates a single assertion element
 */
export function generateAssertion(
  type: string,
  target: string,
  expected: string | number | boolean,
  actual: string | number | boolean,
  description: string,
  status: string
): string {
  const statusIcon = status === 'passed' ? '✓' : '✗';
  const statusClass = status === 'passed' ? '' : ' failed';

  return `
    <div class="assertion${statusClass}">
      <span class="assertion-type${statusClass}">${statusIcon} ${type}:</span> ${description}
      <div class="assertion-details">
        Target: <code>${target || 'N/A'}</code> | Expected: <code>${expected}</code> | Actual: <code>${actual}</code>
      </div>
    </div>
  `;
}

/**
 * Generates a single step element with assertions
 */
export function generateStep(
  id: string,
  action: string,
  target: string | undefined,
  description: string,
  status: string,
  _startTime: string,
  _endTime: string,
  durationMs: number,
  assertions: Array<{
    type: string;
    target: string;
    expected: string | number | boolean;
    actual: string | number | boolean;
    description: string;
    status: string;
  }> = [],
  error?: string
): string {
  const statusIcon = status === 'passed' ? '✓' : '✗';
  const statusClass = status === 'passed' ? ' passed' : ' failed';
  const duration = (durationMs / 1000).toFixed(2);

  let stepsHtml = `
    <div class="step${status === 'failed' ? ' failed' : ''}">
      <div class="step-header">
        <span class="step-id">${id}</span>
        <span class="step-action">${action.toUpperCase()}</span>
        <span class="step-status${statusClass}">${statusIcon} ${status.toUpperCase()}</span>
      </div>
  `;

  if (description) {
    stepsHtml += `<div class="step-description">${description}</div>`;
  }

  stepsHtml += `<div class="step-details">`;
  if (target) {
    stepsHtml += `Target: <code>${target}</code> | `;
  }
  stepsHtml += `Duration: <code>${duration}s</code></div>`;

  // Add assertions
  if (assertions && assertions.length > 0) {
    assertions.forEach((assertion) => {
      stepsHtml += generateAssertion(
        assertion.type,
        assertion.target,
        assertion.expected,
        assertion.actual,
        assertion.description,
        assertion.status
      );
    });
  }

  // Add error info if failed
  if (error) {
    stepsHtml += `
      <div class="error-info">
        <div class="error-message">Error: ${error}</div>
      </div>
    `;
  }

  stepsHtml += `</div>`;

  return stepsHtml;
}

/**
 * Generates a single test case element
 */
export function generateTestCase(
  id: string,
  name: string,
  description: string,
  status: string,
  _priority: string,
  _tags: string[],
  _startTime: string,
  _endTime: string,
  _durationMs: number,
  steps: Array<any> = []
): string {
  const statusClass = status === 'passed' ? 'passed' : 'failed';
  const fullDescription = description ? `${name} - ${description}` : name;

  let html = `
    <div class="test-item">
      <div class="test-header" onclick="toggleTest(this)">
        <span class="test-id">${id}</span>
        <span class="test-description">${fullDescription}</span>
        <span class="test-status ${statusClass}">${status.toUpperCase()}</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="test-steps">
  `;

  // Add steps
  if (steps && steps.length > 0) {
    steps.forEach((step: any) => {
      html += generateStep(
        step.id,
        step.action,
        step.target,
        step.description,
        step.status,
        step.execution.startTime,
        step.execution.endTime,
        step.execution.durationMs,
        step.assertions || [],
        step.error
      );
    });
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

/**
 * Generates a single scenario element with test cases
 */
export function generateScenario(
  scenarioId: string,
  scenarioName: string,
  baseUrl: string,
  status: string,
  duration: string,
  _durationMs: number,
  totalTests: number,
  passedTests: number,
  failedTests: number,
  skippedTests: number,
  testCases: Array<any> = []
): string {
  const statusClass = status === 'passed' ? 'passed' : 'failed';

  return `
    <div class="scenario-item">
      <div class="scenario-header" onclick="toggleScenario(this)">
        <span class="scenario-id">${scenarioId}</span>
        <span class="scenario-name">${scenarioName}</span>
        <span class="scenario-duration">${duration}</span>
        <span class="scenario-status ${statusClass}">${status.toUpperCase()}</span>
        <span class="expand-icon">▼</span>
      </div>
      <div class="scenario-tests">
        <div class="scenario-summary">
          <div class="scenario-summary-item">
            <span class="scenario-summary-label">Base URL:</span>
            <span class="scenario-summary-value">${baseUrl}</span>
          </div>
          <div class="scenario-summary-item">
            <span class="scenario-summary-label">Tests:</span>
            <span class="scenario-summary-value">${totalTests}</span>
          </div>
          <div class="scenario-summary-item">
            <span class="scenario-summary-label">Passed:</span>
            <span class="scenario-summary-value" style="color: #7fb89b;">${passedTests}</span>
          </div>
          <div class="scenario-summary-item">
            <span class="scenario-summary-label">Failed:</span>
            <span class="scenario-summary-value" style="color: #f4b4c4;">${failedTests}</span>
          </div>
          <div class="scenario-summary-item">
            <span class="scenario-summary-label">Skipped:</span>
            <span class="scenario-summary-value">${skippedTests}</span>
          </div>
        </div>
        ${
          testCases
            .map((tc: any) =>
              generateTestCase(
                tc.id,
                tc.name,
                tc.description,
                tc.status,
                tc.priority,
                tc.tags,
                tc.execution.startTime,
                tc.execution.endTime,
                tc.execution.durationMs,
                tc.steps
              )
            )
            .join('')
        }
      </div>
    </div>
  `;
}

/**
 * Generates JavaScript for interactivity
 */
export function generateJavaScript(): string {
  return `
    <script>
      function toggleScenario(element) {
        const scenarioItem = element.parentElement;
        scenarioItem.classList.toggle('expanded');
      }

      function toggleTest(element) {
        const testItem = element.parentElement;
        testItem.classList.toggle('expanded');
      }
    </script>
  `;
}
