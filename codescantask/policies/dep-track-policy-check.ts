// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2025, SCANOSS

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 */

import { PolicyCheck, PR_STATUS } from './policy-check';
import * as tl from 'azure-pipelines-task-lib';
import * as inputs from '../app.input';

/**
 * This class performs policy checks using Dependency Track integration.
 * It uploads SBOM (Software Bill of Materials) data to a Dependency Track server
 * and checks for policy violations including security vulnerabilities, license violations,
 * and other compliance issues as configured in the Dependency Track policies.
 * It then generates a summary and detailed report of any violations found.
 */
export class DepTrackPolicyCheck extends PolicyCheck {
    static policyName = 'Dependency Track';
    private policyCheckResultName = 'dep-track-policy-check-results.md';
    private uploadAttempted = false;

    constructor() {
        super(`${DepTrackPolicyCheck.policyName} Policy`);
    }

    /**
     * Sets whether the upload to Dependency Track was attempted
     */
    setUploadAttempted(attempted: boolean): void {
        this.uploadAttempted = attempted;
    }

    /**
     * Parse policy check error and return appropriate error message
     */
    private parseError(stderr: string): string {
        const lowerStderr = stderr.toLowerCase();
        // Determine error type based on stderr content
        const getErrorType = (): string => {
            if (lowerStderr.includes('connection refused') || lowerStderr.includes('no route to host')) {
                return 'CONNECTION_ERROR';
            }
            if (lowerStderr.includes('401') || lowerStderr.includes('unauthorized')) {
                return 'AUTH_ERROR';
            }
            if (lowerStderr.includes('project') && lowerStderr.includes('not found')) {
                return 'PROJECT_NOT_FOUND';
            }
            if (lowerStderr.includes('404') || lowerStderr.includes('not found')) {
                return 'NOT_FOUND_ERROR';
            }
            if (lowerStderr.includes('timeout')) {
                return 'TIMEOUT_ERROR';
            }
            return 'GENERIC_ERROR';
        };
        switch (getErrorType()) {
            case 'CONNECTION_ERROR':
                return (
                    `Cannot connect to Dependency Track server\n` +
                    `Connection failed to: ${inputs.DEPENDENCY_TRACK_URL}\n` +
                    `• Server may not be running\n` +
                    `• URL may be incorrect\n` +
                    `• Network connectivity issues`
                );
            case 'AUTH_ERROR':
                return (
                    `Authentication failed with Dependency Track\n` +
                    `Authentication error for: ${inputs.DEPENDENCY_TRACK_URL}\n` +
                    `• API key may be invalid\n` +
                    `• API key may be expired\n` +
                    `• Check user permissions`
                );
            case 'NOT_FOUND_ERROR':
                return (
                    `Dependency Track endpoint not found\n` +
                    `Endpoint not found: ${inputs.DEPENDENCY_TRACK_URL}\n` +
                    `• URL may be incorrect\n` +
                    `• API endpoint may not exist\n` +
                    `• Check Dependency Track version`
                );
            case 'PROJECT_NOT_FOUND':
                return (
                    `Project not found in Dependency Track\n` +
                    `Project not found:\n` +
                    `• Project ID: ${inputs.DEPENDENCY_TRACK_PROJECT_ID || 'Not specified'}\n` +
                    `• Project Name: ${inputs.DEPENDENCY_TRACK_PROJECT_NAME || 'Not specified'}\n` +
                    `• Upload Token: ${inputs.DEPENDENCY_TRACK_UPLOAD_TOKEN ? 'Present' : 'Not specified'}\n` +
                    `Solutions: Create project in Dependency Track first`
                );
            case 'TIMEOUT_ERROR':
                return (
                    `Dependency Track server timeout\n` +
                    `Server timeout for: ${inputs.DEPENDENCY_TRACK_URL}\n` +
                    `• Server may be overloaded\n` +
                    `• Network latency issues\n` +
                    `• Try again later`
                );
            default:
                return `Unable to complete Dependency Track policy check\nError details: ${stderr}`;
        }
    }

    /**
     * Check if stderr message is informational rather than a real error
     */
    private isInformationalMessage(stderr: string): boolean {
        const lowerStderr = stderr.toLowerCase();
        return (
            lowerStderr.includes('policy violations were found') || // Status message, not error
            lowerStderr.includes('policy violations detected') || // Status message, not error
            lowerStderr.includes('no violations found') || // Status message, not error
            lowerStderr.includes('violations detected') || // General status message
            lowerStderr.includes('policy check') || // General policy status
            lowerStderr.includes('error details') // Generic error placeholder
        );
    }

    /**
     * Validates Dependency Track policy check configuration
     */
    private validatePolicyConfiguration(): void {
        const MINIMUM_API_KEY_LENGTH = 10;
        const missingParams: string[] = [];
        const invalidParams: string[] = [];
        // Check required parameters from app.input
        if (!inputs.DEPENDENCY_TRACK_URL) {
            missingParams.push('depTrackUrl');
        } else {
            // Validate URL format
            try {
                const url = new URL(inputs.DEPENDENCY_TRACK_URL);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    invalidParams.push('depTrackUrl (must use http:// or https://)');
                }
            } catch (error) {
                invalidParams.push('depTrackUrl (invalid URL format)');
            }
        }
        if (!inputs.DEPENDENCY_TRACK_API_KEY) {
            missingParams.push('depTrackApikey');
        } else if (inputs.DEPENDENCY_TRACK_API_KEY.length < MINIMUM_API_KEY_LENGTH) {
            invalidParams.push('depTrackApikey (appears to be too short)');
        }
        // Check project identification
        if (!inputs.DEPENDENCY_TRACK_PROJECT_ID && !inputs.DEPENDENCY_TRACK_UPLOAD_TOKEN) {
            const missingProjectParams: string[] = [];
            if (!inputs.DEPENDENCY_TRACK_PROJECT_NAME && !inputs.DEPENDENCY_TRACK_PROJECT_VERSION) {
                missingProjectParams.push('Either depTrackProjectId or BOTH depTrackProjectName AND depTrackProjectVersion');
            } else if (!inputs.DEPENDENCY_TRACK_PROJECT_NAME) {
                missingProjectParams.push('depTrackProjectName');
            } else if (!inputs.DEPENDENCY_TRACK_PROJECT_VERSION) {
                missingProjectParams.push('depTrackProjectVersion');
            }
            if (missingProjectParams.length > 0) {
                missingParams.push(...missingProjectParams);
            }
        }
        if (missingParams.length > 0) {
            throw new Error(
                `Dependency Track Policy Check Failed: Required parameters are missing.\n` +
                `Missing: ${missingParams.join(', ')}\n` +
                `Please set these parameters in your pipeline configuration.`
            );
        }
        if (invalidParams.length > 0) {
            throw new Error(
                `Dependency Track Policy Check Failed: Invalid parameter values.\n` +
                `Invalid: ${invalidParams.join(', ')}\n` +
                `Please check your parameter values and try again.`
            );
        }
    }

    /**
     * Build Docker arguments for policy violation inspection
     */
    private buildArgs(): Array<string> {
        const args = [
            'run',
            '-v',
            `${inputs.REPO_DIR}:/scanoss`,
            inputs.RUNTIME_CONTAINER,
            'inspect',
            'dt',
            'pv',
            '--url',
            inputs.DEPENDENCY_TRACK_URL || '',
            '--apikey',
            inputs.DEPENDENCY_TRACK_API_KEY || '',
            '--format',
            'md'
        ];
        // Add project identification
        if (inputs.DEPENDENCY_TRACK_PROJECT_ID) {
            args.push('--project-id', inputs.DEPENDENCY_TRACK_PROJECT_ID);
        }
        if (inputs.DEPENDENCY_TRACK_UPLOAD_TOKEN) {
            args.push('--upload-token', inputs.DEPENDENCY_TRACK_UPLOAD_TOKEN);
        }
        if (inputs.DEPENDENCY_TRACK_PROJECT_NAME) {
            args.push('--project-name', inputs.DEPENDENCY_TRACK_PROJECT_NAME);
        }
        if (inputs.DEPENDENCY_TRACK_PROJECT_VERSION) {
            args.push('--project-version', inputs.DEPENDENCY_TRACK_PROJECT_VERSION);
        }
        if (inputs.DEBUG) {
            args.push('--debug');
        }
        return args;
    }

    /**
     * Executes the Dependency Track policy check.
     */
    async run(): Promise<void> {
        try {
            await this.start();
            console.log(`Checking Dependency Track for Project Violations...`);
            // Validate configuration before running
            this.validatePolicyConfiguration();
            const args = this.buildArgs();
            tl.debug(`Executing Docker command: ${args.join(' ')}`);
            const results = tl.execSync(inputs.EXECUTABLE, args);
            // Only display stderr if it's a real error, not informational messages
            if (results.stderr && !this.isInformationalMessage(results.stderr)) {
                tl.error(results.stderr); // Display real errors to user
            }
            let summary = results.stdout;
            if (results.code === 0) {
                let successMessage = '### :white_check_mark: Policy Pass \n #### No policy violations were found';
                if (!this.uploadAttempted) {
                    tl.warning(
                        'No policy violations found, but SBOM upload to Dependency Track was not attempted - may have missed new issues'
                    );
                    successMessage +=
                        '\n\n:warning: **Warning**: SBOM upload to Dependency Track was not attempted. Results may not reflect latest changes.';
                    successMessage += this.getUploadConfigurationHelp();
                }
                await this.success(successMessage, undefined);
                return;
            }
            if (results.code === 1) {
                // Technical error occurred - parse for better error messages
                let errorMessage = 'Unable to complete Dependency Track policy check';
                let errorDetails = `Error details: ${results.stderr}`;
                if (results.stderr) {
                    errorMessage = this.parseError(results.stderr);
                    errorDetails = errorMessage;
                }
                tl.warning(`Dependency Track policy check encountered an error: ${errorMessage}`);
                const errorSummary = `### :warning: Policy Check Error \n #### ${errorMessage}`;
                // For technical errors, we don't fail the build by default
                tl.setResult(tl.TaskResult.SucceededWithIssues, errorSummary);
                await this.updatePRStatus(PR_STATUS.failed, `SCANOSS Policy Check: ${this.checkName}`);
                if (errorDetails) {
                    await this.addCommentToPR(`${this.checkName} Check Error`, errorDetails);
                }
                return;
            }
            // results.code === 2 means policy violations found

            // Build detailed PR comment with violations table
            // Note: summary from stdout already contains the violations table and link to DT project
            let prCommentDetails = summary || '';

            // Add warning if upload wasn't attempted
            if (!this.uploadAttempted) {
                tl.warning(
                    'Policy violations found, but SBOM upload to Dependency Track was not attempted - results may be outdated'
                );
                prCommentDetails +=
                    '\n\n:warning: **Warning**: SBOM upload to Dependency Track was not attempted. These policy violations may be based on outdated data.\n';
                prCommentDetails += this.getUploadConfigurationHelp();
            }

            // Upload artifact and reject with detailed comment
            await this.uploadArtifact(this.policyCheckResultName, summary);
            await this.reject(summary, prCommentDetails);
        } catch (validationError: any) {
            // Handle validation errors
            tl.warning(`Dependency Track policy check configuration error: ${validationError.message}`);
            const errorSummary = '### :warning: Configuration Error \n #### Dependency Track policy check misconfigured';

            tl.setResult(tl.TaskResult.SucceededWithIssues, errorSummary);
            await this.updatePRStatus(PR_STATUS.failed, `SCANOSS Policy Check: ${this.checkName}`);
            await this.addCommentToPR(`${this.checkName} Configuration Error`, validationError.message);
        }
    }

    /**
     * Returns upload configuration instructions for when upload is disabled
     */
    private getUploadConfigurationHelp(): string {
        return [
            '',
            '**To enable Dependency Track upload:**',
            '• Set `deptrackenabled: true` in your pipeline',
            '• Configure required parameters:',
            '  - `depTrackUrl`',
            '  - `depTrackApikey`',
            '  - `depTrackProjectId` OR (`depTrackProjectName` + `depTrackProjectVersion`)'
        ].join('\n');
    }
}