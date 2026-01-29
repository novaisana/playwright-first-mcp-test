# Playwright MCP Test Framework

An intelligent, AI-ready browser test automation framework that bridges **Playwright**, **TypeScript**, and the **Model Context Protocol (MCP)**. Execute test scenarios declaratively via JSON files, orchestrate tests through MCP tools, and enable AI models (like Claude) to intelligently manage your test suite.

---

## Technologies Used

- **Playwright** (v1.57.0) — Multi-browser automation (Chromium, Firefox, WebKit)
- **TypeScript** (v5.9.3) — Type-safe test definitions and execution logic
- **Model Context Protocol (MCP)** (v1.25.3) — AI-ready protocol for exposing test tools to Claude and other AI clients
- **Winston** (v3.19.0) — Structured logging across all components
- **Node.js** (v18+) — Runtime environment

---

## Project Objective

Execute and manage E2E tests using **declarative JSON scenarios** and **MCP protocol integration**. This enables:
- ✅ Code-free test definition (JSON-based scenarios)
- ✅ AI-orchestrated test execution (Claude can call test tools)
- ✅ Self-healing selectors (automatic recovery from UI changes)
- ✅ Comprehensive reporting (JSON + screenshots)
- ✅ Multi-browser testing (Chromium, Firefox, WebKit)

---

## Architecture & Overall Flow

```
┌─────────────────────────────────────────────────────────┐
│  MCP Client (Claude, IDE, external tool)                │
└────────────────────┬────────────────────────────────────┘
                     │ MCP Protocol (StdIO)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  MCPTestServer                                          │
│  • Exposes test tools (execute_scenario, list_scenarios)│
│  • Routes tool calls to appropriate handlers            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │  ScenarioExecutor            │
      │  • Loads JSON scenario files │
      │  • Executes test cases/steps │
      │  • Manages test lifecycle    │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │  BrowserManager              │
      │  • Session lifecycle         │
      │  • Context/Page management   │
      │  • Resource cleanup          │
      └──────────┬───────────────────┘
                 │
          ┌──────┴──────┬──────────┐
          ▼             ▼          ▼
       navigate()  click()  type() wait() assert()
            │                        │
            └────────┬───────────────┘
                     ▼
      ┌──────────────────────────────┐
      │  PageActions                 │
      │  • Browser interactions      │
      │  • Assertion validation      │
      │  • Screenshot capture        │
      └──────────┬───────────────────┘
                 │
      ┌──────────┴───────────┐
      │  LocatorHealer       │
      │  • Self-heal selectors
      │  • Fuzzy selector matching
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │  Playwright                  │
      │  • Real browser automation   │
      │  • Screenshot capture        │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │  ReportGenerator             │
      │  • Transform results to JSON │
      │  • Link evidence paths       │
      │  • Persist reports           │
      └──────────────────────────────┘
```

---

## Page Objects Pattern

This framework implements a **Page Abstraction Layer** to decouple test logic from UI implementation:

### **PageActions (src/browser/page-actions.ts)**
Encapsulates all browser interactions in reusable methods:

```typescript
// All UI interactions go through PageActions
await pageActions.navigate(page, baseUrl, '/login');
await pageActions.type(page, 'input#username', 'user');
await pageActions.click(page, 'button#login');
await pageActions.assert(page, [{ type: 'visible', target: 'h1', expected: 'true' }]);
```

**Benefits:**
- Test logic is independent from selectors
- UI changes only require updating PageActions
- Consistent, reusable interaction methods
- Easy to extend with new actions

### **LocatorHealer (src/browser/locator-healer.ts)**
Auto-recovers broken CSS selectors when UI changes:
- Generates selector candidates (typo fixes, tag variants)
- Fuzzy-matches IDs on the page
- Automatically heals failing tests without code changes

---

## Project Structure

```
src/
├── browser/
│   ├── page-actions.ts           # Browser interactions (navigate, click, type, assert)
│   ├── browser-manager.ts        # Session & context lifecycle management
│   ├── locator-healer.ts         # Self-healing selectors
│   ├── playwright-browser-provider.ts # Browser factory
│   ├── in-memory-session-store.ts # Session metadata storage
│   └── contracts.ts              # Type-safe interfaces
├── server/
│   ├── index.ts                  # MCP server & tool handlers
│   └── scenario-executer.ts      # Core test execution engine
├── reporter/
│   ├── report-generator.ts       # Transform results to JSON reports
│   └── report-writer.ts          # Persist reports to disk
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── utils/
│   └── logger.ts                 # Winston-based structured logging
└── examples/
    └── run-scenario.ts           # Multi-scenario test runner

test-scenarios/
├── login.json                    # JSON test definitions
├── add-to-cart.json
└── checkout.json

test-results/
├── {scenarioId}/
│   ├── tc-001/                   # Screenshots for test case 001
│   ├── tc-002/
│   └── report.json               # Aggregated execution report
```

---

## Setup & Installation

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies and Playwright browsers
npm run setup

# Or manually:
npm install
npx playwright install
```

### Environment Variables (Optional)
Create `.env` file for custom settings:

```bash
MCP_SERVER_NAME=mcp-playwright-test
MCP_SERVER_VERSION=1.0.0
HEADLESS=true
```

---

## How to Run Tests

### Run All Scenarios (Headless)
```bash
npm test
```
Executes all `.json` files in `test-scenarios/` directory.

### Run Tests with Browser Visible
```bash
npm run test:headed
```
Shows browser window during test execution (useful for debugging).

### Validate Scenario JSON
```bash
npm run validate
```
Checks scenario files for structural correctness without executing.

### Start MCP Server (AI Integration)
```bash
npm run dev
```
Starts the MCP server on StdIO. Claude and other AI clients can now call test tools.

### Build TypeScript
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/` folder.

### Clean Build Artifacts
```bash
npm run clean
```

---

## Example: Login Test Walkthrough

### Scenario Structure
The login test demonstrates the full workflow:

```json
{
  "scenarioId": "login-test-001",
  "scenarioName": "Login Test Scenario",
  "baseUrl": "https://www.saucedemo.com",
  "browserType": "chromium",
  "testCases": [
    {
      "id": "tc-001",
      "name": "Navigate to Homepage",
      "steps": [
        { "id": "step-001", "action": "navigate", "value": "/" },
        { "id": "step-002", "action": "assert", "assertions": [...] }
      ]
    },
    {
      "id": "tc-002",
      "name": "Execute Login",
      "steps": [
        { "action": "type", "target": "input#user-name", "value": "standard_user" },
        { "action": "type", "target": "input#password", "value": "secret_sauce" },
        { "action": "click", "target": "#login-button" },
        { "action": "assert", "assertions": [
          { "type": "url", "expected": "/inventory.html" },
          { "type": "text", "target": "div.app_logo", "expected": "Swag Labs" }
        ] }
      ]
    }
  ]
}
```

See [test-scenarios/login.json](test-scenarios/login.json) for the complete example.

### Test Execution Flow
1. **Navigate** → Load login page (`/`)
2. **Verify** → Assert page body is visible
3. **Input** → Type username into `input#user-name`
4. **Input** → Type password into `input#password`
5. **Action** → Click `#login-button`
6. **Assert** → Verify URL changed to `/inventory.html`
7. **Assert** → Verify "Swag Labs" text visible

### Results
After execution:
- ✅ Screenshots captured at each step → `test-results/login-test-001/tc-001/*.png`
- ✅ Execution report → `test-results/login-test-001/report.json`
- ✅ Logs → `logs/` directory

---

## Test Scenario Format

Test scenarios are **declarative JSON files** with the following structure:

```typescript
{
  scenarioId: string;              // Unique test identifier
  scenarioName: string;            // Human-readable name
  baseUrl: string;                 // Base URL for navigation
  browserType: 'chromium' | 'firefox' | 'webkit';
  
  testCases: [
    {
      id: string;                  // Unique test case ID
      name: string;                // Test case description
      priority: 'high' | 'medium' | 'low';
      tags: string[];              // For filtering/categorization
      
      steps: [
        {
          id: string;
          action: 'navigate' | 'click' | 'type' | 'wait' | 'assert';
          target?: string;         // CSS selector
          value?: string;          // For navigate/type actions
          assertions?: [
            {
              type: 'visible' | 'text' | 'attribute' | 'url' | 'count';
              target: string;      // CSS selector
              expected: string | number;
            }
          ];
          timeout?: number;        // Optional timeout in ms
        }
      ];
    }
  ];
}
```

Full TypeScript interfaces: [src/types/index.ts](src/types/index.ts)

---

## MCP Integration (AI-Ready)

The MCP server exposes test execution as **discoverable tools** for AI models:

### Available Tools

**1. execute_scenario**
```
Tool: execute_scenario
Input: { scenarioPath: string, options?: ExecutionOptions }
Output: ScenarioResult with pass/fail status, duration, test details
```

**2. list_scenarios**
```
Tool: list_scenarios
Input: { directory?: string }
Output: Array of available scenario files
```

**3. validate_scenario**
```
Tool: validate_scenario
Input: { scenarioPath: string }
Output: Validation result (passes/fails JSON schema check)
```

**4. get_health**
```
Tool: get_health
Output: Server health status
```

### How AI Uses These Tools

When you run MCP server (`npm run dev`), AI clients (like Claude) can:
1. **List scenarios** → `"Show me all available tests"`
2. **Execute tests** → `"Run the login test scenario"`
3. **Validate** → `"Check if my scenario JSON is valid"`
4. **Get results** → Receive structured execution results with screenshots

Example Claude prompt:
```
"Execute the login test scenario and show me the results"
→ Claude calls execute_scenario tool
→ MCP server runs test
→ Returns report with screenshots and assertions
→ Claude shows you the results
```

---

## Test Results & Reports

After each test run:

### Report File: `test-results/{scenarioId}/report.json`
```json
{
  "reportId": "uuid",
  "reportGeneratedAt": "2026-01-28T10:30:45Z",
  "scenario": {
    "scenarioId": "login-test-001",
    "scenarioName": "Login Test Scenario"
  },
  "execution": {
    "startTime": "...",
    "endTime": "...",
    "duration": 45000,
    "status": "passed",
    "summary": { "passed": 2, "failed": 0, "skipped": 0 }
  },
  "testCaseResults": [...]
}
```

### Screenshots: `test-results/{scenarioId}/{testCaseId}/step-*.png`
Full-page screenshots captured at each step for visual debugging.

### Logs: `logs/` directory
Structured logs with timestamps, component context, and error details.

---

## Getting Started

```bash
# 1. Install & setup
npm run setup

# 2. Run a test scenario
npm test

# 3. Check results
ls test-results/
cat test-results/login-test-001/report.json

# 4. (Optional) Start MCP server for AI integration
npm run dev
```

---

## Troubleshooting

### Common Issues

**Q: Playwright not installed**
```bash
npx playwright install
```

**Q: Tests timing out**
- Increase timeout in scenario: `"timeout": 60000`
- Check network connectivity to test site
- Use `npm run test:headed` to watch execution

**Q: Selectors not found**
- LocatorHealer will auto-try alternative selectors
- Check test results screenshots for visual confirmation
- Validate selector with browser DevTools

**Q: MCP Server won't start**
```bash
npm run build  # Rebuild TypeScript first
npm run dev
```

---

## License

ISC

---

## Project Links

- **Main repo structure:** See `src/` folders
- **Example scenarios:** [test-scenarios/](test-scenarios/)
- **TypeScript interfaces:** [src/types/index.ts](src/types/index.ts)
- **MCP Server:** [src/server/index.ts](src/server/index.ts)
