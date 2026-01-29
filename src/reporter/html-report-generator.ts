/**
 * HTML Report Generator
 * Transforms Report objects into complete HTML documents
 */

import { Report } from '../types/report';
import {
  generateHeader,
  generateScenario,
  generateStylesheet,
  generateJavaScript,
} from './html-template';
import { createLogger } from '../utils/logger';

const logger = createLogger('HtmlReportGenerator');

/**
 * HTML Report Generator class
 * Converts Report JSON into interactive HTML report
 */
export class HtmlReportGenerator {
  /**
   * Generates complete HTML document from Report object
   */
  static generateHtml(report: Report, testRunId: string): string {
    try {
      logger.debug('Generating HTML report', { testRunId, scenarioCount: report.scenarios.length });

      // Generate header
      const headerHtml = generateHeader(
        report.reportId,
        report.testRunName,
        report.environment,
        report.execution.startTime,
        report.execution.endTime,
        report.execution.duration,
        report.configuration.browserType,
        report.configuration.browserVersion,
        report.configuration.parallelism,
        report.summary.totalScenarios,
        report.summary.totalTests,
        report.summary.passed,
        report.summary.failed,
        report.summary.skipped,
        report.summary.successRate
      );

      // Generate scenarios
      const scenariosHtml = report.scenarios
        .map((scenario) =>
          generateScenario(
            scenario.scenarioId,
            scenario.scenarioName,
            scenario.baseUrl,
            scenario.status,
            scenario.execution.duration,
            scenario.execution.durationMs,
            scenario.summary.totalTests,
            scenario.summary.passed,
            scenario.summary.failed,
            scenario.summary.skipped,
            scenario.testCases
          )
        )
        .join('\n');

      // Generate complete HTML document
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${report.testRunName}</title>
    ${generateStylesheet()}
</head>
<body>
    <div class="container">
        ${headerHtml}
        
        <div class="scenarios-list">
            ${scenariosHtml}
        </div>
    </div>

    ${generateJavaScript()}
</body>
</html>`;

      logger.debug('HTML report generated successfully', {
        testRunId,
        htmlSize: html.length,
      });

      return html;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to generate HTML report', {
        error: errorMsg,
        testRunId,
      });
      throw error;
    }
  }


}
