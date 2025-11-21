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

import * as tl from 'azure-pipelines-task-lib';
import axios from 'axios';
import { PR_STATUS } from '../policies/policy-check';

export interface DependencyTrackUploadResult {
    success: boolean;
    enabled: boolean;
    error?: string;
    projectId?: string;
    uploadToken?: string;
    projectName?: string;
    projectVersion?: string;
    fileSize?: number;
    componentsCount?: number;
    uploadTime?: number;
}

/**
 * Service for reporting Dependency Track upload status as an Azure DevOps PR status check
 */
export class DependencyTrackStatusService {
    private readonly checkName = 'Dependency Track Upload';
    private readonly accessToken: string | undefined;
    private readonly orgUrl: string | undefined;
    private readonly project: string | undefined;
    private readonly repositoryId: string | undefined;
    private readonly pullRequestId: string | undefined;
    private readonly buildReason: string | undefined;

    constructor() {
        this.accessToken = tl.getVariable('System.AccessToken');
        this.orgUrl = tl.getVariable('System.TeamFoundationCollectionUri') || '';
        this.project = tl.getVariable('System.TeamProjectId') || '';
        this.repositoryId = tl.getVariable('Build.Repository.Id') || '';
        this.pullRequestId = tl.getVariable('System.PullRequest.PullRequestId') || '';
        this.buildReason = tl.getVariable('Build.Reason');
    }

    /**
     * Reports the Dependency Track upload status as an Azure DevOps PR status check
     */
    async reportUploadStatus(result: DependencyTrackUploadResult): Promise<void> {
        if (!result.enabled) {
            return;
        }
        try {
            const state = result.success ? PR_STATUS.succeeded : PR_STATUS.failed;
            const description = this.createDescription(result);
            await this.updatePRStatus(state, description);
            // Also add a PR comment with more details for better visibility
            if (result.success) {
                const detailedComment = this.createSuccessComment(result);
                await this.addCommentToPR('Dependency Track Upload', detailedComment);
            } else {
                const errorComment = this.createFailureComment(result);
                await this.addCommentToPR('Dependency Track Upload Failed', errorComment);
            }
        } catch (error: any) {
            tl.warning(`Failed to report Dependency Track upload status: ${error.message}`);
        }
    }

    /**
     * Creates a short description for the PR status
     */
    private createDescription(result: DependencyTrackUploadResult): string {
        if (result.success) {
            const componentInfo = result.componentsCount ? ` (${result.componentsCount} components)` : '';
            return `Dependency Track Upload: SBOM uploaded successfully${componentInfo}`;
        } else {
            return `Dependency Track Upload Failed: ${result.error || 'Unknown error'}`;
        }
    }

    /**
     * Creates detailed success comment for PR
     */
    private createSuccessComment(result: DependencyTrackUploadResult): string {
        const details: string[] = [
            '✅ **SBOM successfully uploaded to Dependency Track**',
            '',
            '**Upload Details:**'
        ];
        if (result.projectName) {
            details.push(`- Project Name: ${result.projectName}`);
        }
        if (result.projectVersion) {
            details.push(`- Project Version: ${result.projectVersion}`);
        }
        if (result.projectId) {
            details.push(`- Project ID: \`${result.projectId}\``);
        }
        if (result.fileSize) {
            const fileSizeKB = (result.fileSize / 1024).toFixed(1);
            details.push(`- File Size: ${fileSizeKB} KB`);
        }
        if (result.componentsCount) {
            details.push(`- Components: ${result.componentsCount}`);
        }
        if (result.uploadTime) {
            details.push(`- Upload Time: ${result.uploadTime.toFixed(1)}s`);
        }
        // Add link to Dependency Track project if we have the project ID and URL
        const dtUrl = tl.getInput('deptrackurl');
        if (result.projectId && dtUrl) {
            details.push('');
            details.push(`[View project in Dependency Track](${dtUrl}/projects/${result.projectId})`);
        }
        return details.join('\n');
    }

    /**
     * Creates detailed failure comment for PR
     */
    private createFailureComment(result: DependencyTrackUploadResult): string {
        const details: string[] = [
            '❌ **Failed to upload SBOM to Dependency Track**',
            ''
        ];
        if (result.error) {
            details.push('**Error:**');
            details.push('```');
            details.push(result.error);
            details.push('```');
        }
        const dtUrl = tl.getInput('deptrackurl');
        if (dtUrl) {
            details.push('');
            details.push(`**Server:** ${dtUrl}`);
        }
        details.push('');
        details.push('**Troubleshooting:**');
        details.push('- Verify Dependency Track server is accessible');
        details.push('- Check API key permissions');
        details.push('- Verify project configuration');
        return details.join('\n');
    }

    /**
     * Updates the PR status check (copied from PolicyCheck pattern)
     */
    private async updatePRStatus(state: PR_STATUS, description: string): Promise<void> {
        // Only update PR status if this is a pull request build
        if (this.buildReason && this.buildReason !== 'PullRequest') {
            tl.debug('Not a pull request build, skipping PR status update');
            return;
        }
        try {
            if (!this.accessToken || !this.orgUrl || !this.project || !this.repositoryId || !this.pullRequestId) {
                tl.warning(
                    `Missing necessary environment variables for PR status update.\n` +
                    `Access Token: ${this.accessToken ? 'Present' : 'Missing'}\n` +
                    `Organization URL: ${this.orgUrl || 'Missing'}\n` +
                    `Project: ${this.project || 'Missing'}\n` +
                    `Repository ID: ${this.repositoryId || 'Missing'}\n` +
                    `Pull Request ID: ${this.pullRequestId || 'Missing'}`
                );
                return;
            }
            const status = {
                state: state, // succeeded, failed, pending
                description: description,
                context: {
                    name: this.checkName,
                    genre: 'SCANOSS'
                }
            };
            // Post the status to the PR using Azure DevOps REST API
            const apiUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/statuses?api-version=6.0-preview.1`;
            await axios.post(apiUrl, status, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            tl.debug(`PR status updated: ${state} - ${description}`);
        } catch (err: any) {
            tl.warning(`Failed to add status to PR: ${err.message}`);
        }
    }

    /**
     * Adds a comment to the pull request (copied from PolicyCheck pattern)
     */
    private async addCommentToPR(title: string, content: string): Promise<void> {
        // Only add comment if this is a pull request build
        if (this.buildReason && this.buildReason !== 'PullRequest') {
            tl.debug('Not a pull request build, skipping PR comment');
            return;
        }
        try {
            if (!this.accessToken || !this.orgUrl || !this.project || !this.repositoryId || !this.pullRequestId) {
                tl.debug('Missing environment variables for PR comment, skipping');
                return;
            }
            const apiUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads?api-version=6.0`;
            const payload = {
                comments: [{
                    parentCommentId: 0,
                    content: `## ${title}\n${content}`,
                    commentType: 1
                }],
                status: 1 // Active
            };
            await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            tl.debug(`PR comment added: ${title}`);
        } catch (error: any) {
            tl.warning(`Failed to add comment to PR: ${error.message}`);
        }
    }
}


export const dependencyTrackStatusService = new DependencyTrackStatusService();