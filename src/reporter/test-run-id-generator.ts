/**
 * Test Run ID Generator
 * Generates unique test run IDs and report IDs using timestamp format
 */

/**
 * Formats a date to the timestamp format used in test run IDs
 * Format: YYYYMMDD-HHmmss (e.g., 20260126-143215)
 */
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Generates a unique test run ID based on current timestamp
 * Format: run-{YYYYMMDD-HHmmss}
 * Example: run-20260126-143215
 */
export function generateTestRunId(baseDate?: Date): string {
  const timestamp = formatTimestamp(baseDate || new Date());
  return `run-${timestamp}`;
}

/**
 * Generates a unique report ID based on current timestamp
 * Format: report-{YYYYMMDD-HHmmss}
 * Example: report-20260126-143215
 */
export function generateReportId(baseDate?: Date): string {
  const timestamp = formatTimestamp(baseDate || new Date());
  return `report-${timestamp}`;
}

/**
 * Formats execution duration in human-readable format
 * Example: "13m 17.8s" from milliseconds
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = durationMs % 1000;

  if (minutes > 0) {
    const secondsWithMs = seconds + milliseconds / 1000;
    return `${minutes}m ${secondsWithMs.toFixed(1)}s`;
  } else {
    const secondsWithMs = seconds + milliseconds / 1000;
    return `${secondsWithMs.toFixed(1)}s`;
  }
}

/**
 * Converts ISO string to Date object
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
