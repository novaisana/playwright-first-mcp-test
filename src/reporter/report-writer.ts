/**
 * Report Writer
 * Persists reports to disk and copies evidence files to report directory
 */

import { Report } from '../types/report';
import { HtmlReportGenerator } from './html-report-generator';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReportWriter');

interface WriteReportOptions {
  baseDir?: string; // Base directory for reports (default: 'reports')
}

interface WriteReportResult {
  reportPath: string;
  evidencePaths: string[];
  filesCreated: number;
  totalSize: number;
}

interface WriteHtmlReportResult {
  htmlPath: string;
  size: number;
}

/**
 * Report Writer class
 * Handles persistence of reports and evidence files to disk
 */
export class ReportWriter {
  private baseDir: string;

  constructor(options?: WriteReportOptions) {
    this.baseDir = options?.baseDir || path.join(process.cwd(), 'reports');
  }

  /**
   * Writes a complete report to disk with evidence files
   * Creates folder structure: {baseDir}/{testRunId}/{scenarioId}/{testCaseId}/test-evidence/
   */
  async writeReport(
    report: Report,
    testResultsBaseDir?: string
  ): Promise<WriteReportResult> {
    const testResultsDir = testResultsBaseDir || path.join(process.cwd(), 'test-results');

    try {
      // Create base report directory structure
      const reportBaseDir = path.join(this.baseDir, report.testRunId);
      this.ensureDirectoryExists(reportBaseDir);

      let totalFilesCreated = 0;
      let totalSize = 0;
      const evidencePaths: string[] = [];

      // Process each scenario
      for (const scenario of report.scenarios) {
        const scenarioDir = path.join(reportBaseDir, scenario.scenarioId);
        this.ensureDirectoryExists(scenarioDir);

        // Process each test case
        for (const testCase of scenario.testCases) {
          const testCaseDir = path.join(scenarioDir, testCase.id);
          this.ensureDirectoryExists(testCaseDir);

          // Create test-evidence subdirectory and copy screenshots
          const evidenceDir = path.join(testCaseDir, 'test-evidence');
          this.ensureDirectoryExists(evidenceDir);

          // Copy evidence files from test-results directory
          for (const evidence of testCase.evidence) {
            if (evidence.type === 'screenshot' && evidence.url) {
              // Extract filename from evidence URL
              const filename = path.basename(evidence.url);
              const sourceFile = path.join(testResultsDir, scenario.scenarioId, testCase.id, filename);

              if (fs.existsSync(sourceFile)) {
                const destFile = path.join(evidenceDir, filename);
                fs.copyFileSync(sourceFile, destFile);
                totalFilesCreated++;
                totalSize += fs.statSync(destFile).size;
                evidencePaths.push(destFile);

                logger.debug(`Copied evidence file: ${filename}`, {
                  source: sourceFile,
                  destination: destFile,
                });
              } else {
                logger.warn(`Evidence file not found: ${sourceFile}`, {
                  expectedFile: sourceFile,
                });
              }
            }
          }
        }
      }

      // Write the main report JSON file
      const reportFilePath = path.join(reportBaseDir, 'run-results.json');
      const reportJson = JSON.stringify(report, null, 2);
      fs.writeFileSync(reportFilePath, reportJson, 'utf-8');

      totalFilesCreated++;
      totalSize += Buffer.byteLength(reportJson, 'utf-8');

      logger.info(`Report written successfully: ${reportFilePath}`, {
        testRunId: report.testRunId,
        scenarios: report.scenarios.length,
        testCases: report.scenarios.reduce((sum, s) => sum + s.testCases.length, 0),
        evidence: evidencePaths.length,
      });

      return {
        reportPath: reportFilePath,
        evidencePaths,
        filesCreated: totalFilesCreated,
        totalSize,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to write report', {
        error: errorMsg,
        testRunId: report.testRunId,
      });
      throw error;
    }
  }

  /**
   * Creates a directory if it doesn't already exist
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Writes an HTML report to disk
   * Creates file: {baseDir}/{testRunId}/run-{testRunId}.html
   */
  async writeHtmlReport(report: Report): Promise<WriteHtmlReportResult> {
    try {
      const testRunId = report.testRunId;
      const reportBaseDir = path.join(this.baseDir, testRunId);

      // Ensure directory exists
      this.ensureDirectoryExists(reportBaseDir);

      // Generate HTML content
      const htmlContent = HtmlReportGenerator.generateHtml(report, testRunId);

      // Write HTML file
      const htmlFilePath = path.join(reportBaseDir, `run-${testRunId}.html`);
      fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');

      const fileSize = Buffer.byteLength(htmlContent, 'utf-8');

      logger.info(`HTML report written successfully: ${htmlFilePath}`, {
        testRunId,
        size: fileSize,
      });

      return {
        htmlPath: htmlFilePath,
        size: fileSize,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to write HTML report', {
        error: errorMsg,
        testRunId: report.testRunId,
      });
      throw error;
    }
  }

  /**
   * Gets the base reports directory
   */
  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Sets a new base reports directory
   */
  setBaseDir(dirPath: string): void {
    this.baseDir = dirPath;
  }
}
