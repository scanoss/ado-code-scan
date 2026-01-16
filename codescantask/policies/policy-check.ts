// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2024, SCANOSS

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
import {PAT, POLICIES_HALT_ON_FAILURE } from '../app.input';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export enum PR_STATUS {
    succeeded = 'succeeded',
    failed = 'failed',
    pending = 'pending',
}

/**
 * @See: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/update?view=azure-devops-rest-7.1#commentthreadstatus
 * */
export enum THREAD_STATUS {
    active = 'active',
    pending = 'pending',
    fixed = 'fixed',
    wontFix = 'wontFix',
    closed = 'closed',
    byDesign = 'byDesign',
    unknown = 'unknown'
}

export abstract class PolicyCheck {
    protected checkName: string;
    private readonly accessToken: string | undefined;
    private readonly orgUrl: string | undefined;
    private readonly project:string | undefined;
    private readonly repositoryId:string | undefined;
    private readonly pullRequestId:string | undefined;
    private readonly buildReason: string | undefined;
    constructor(checkName: string) {
        this.checkName = checkName;
        this.accessToken = PAT ? PAT : tl.getVariable('System.AccessToken');
        this.orgUrl = tl.getVariable('System.TeamFoundationCollectionUri') || '';
        this.project = tl.getVariable('System.TeamProjectId') || '';
        this.repositoryId = tl.getVariable('Build.Repository.Id') || '';
        this.pullRequestId = tl.getVariable('System.PullRequest.PullRequestId') || '';
        this.buildReason = tl.getVariable('Build.Reason');
    }

    public abstract run(): Promise<void>;

    public async start():Promise<void> {
        await this.updatePRStatus(PR_STATUS.pending, `SCANOSS Policy Check: ${this.checkName}`);
    }

    protected async success(summary: string, text?: string): Promise<void> {
        tl.debug(`[${this.checkName}]: SUMMARY: ${summary}, ${text? text : ''} `);
        let status = tl.TaskResult.Succeeded
        tl.setResult(status, `[${this.checkName}]`);
        await this.updatePRStatus(PR_STATUS.succeeded, `SCANOSS Policy Check: ${this.checkName}`);
    }

    protected async reject(summary: string, text?: string): Promise<void> {
        let status = tl.TaskResult.SucceededWithIssues;
        if (POLICIES_HALT_ON_FAILURE)  status = tl.TaskResult.Failed;
        tl.setResult(status, `[${this.checkName}], SUMMARY: ${summary}, DETAILS: ${text? text: ''} `);
        await this.updatePRStatus(PR_STATUS.failed, `SCANOSS Policy Check: ${this.checkName}`);
        if (text) {
            await this.addCommentToPR(`${this.checkName} Results`, text);
        }
    }

    protected async updatePRStatus(state: PR_STATUS, description: string){
        if (this.buildReason && this.buildReason !== 'PullRequest') return;
        try {
            const commitId = tl.getVariable('System.PullRequest.SourceCommitId');

            if (!this.accessToken || !this.orgUrl || !this.project || !this.repositoryId || !commitId) {
                tl.setResult(tl.TaskResult.SucceededWithIssues, `Missing necessary environment variables.\n
                        Access Token: ${this.accessToken}\n
                        Organization url: ${this.orgUrl}\n
                        Project: ${this.project}\n
                        Repository ID: ${this.repositoryId}\n
                        Commit ID: ${commitId}
                `);
                return;
            }

            const status = {
                state: state, // succeeded, failed, pending
                description: description,
                context: {
                    name: this.checkName,
                    genre: 'SCANOSS'
                },
            };

            // Post the status to the commit
            const apiUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/commits/${commitId}/statuses?api-version=7.1`;
            await axios.post(apiUrl, status, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
        } catch (err:any) {
            tl.setResult(tl.TaskResult.SucceededWithIssues, `Failed to add status to commit: ${err.message}`);
       }
    }

    protected async getPreviousThreads(): Promise<any[]> {
        if (this.buildReason && this.buildReason !== 'PullRequest') return [];
            try {
                const apiUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads?api-version=6.0`;
                const response = await axios.get(apiUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                return response.data.value || [];
            }
            catch (error: any) {
                tl.error(`Failed to get previous threads: ${error.message}`);
                return [];
            }
    }

    /**
     * Deletes existing SCANOSS comments for this check type from the PR
     * Identifies comments by the SCANOSS marker and check name in the content
     */
    private async deletePreviousComments(title: string):Promise<void> {
        try{
            const threads = await this.getPreviousThreads();
            const scanossMarker = `SCANOSS - ${title}`;
            tl.debug(`Looking for threads with marker: ${scanossMarker}`);
            for (const thread of threads) {
                if (thread.comments && thread.comments.length > 0) {
                    const firstComment = thread.comments[0];
                    tl.debug(`Thread ${thread.id} - First comment content: ${firstComment.content?.substring(0, 100)}...`);

                    // Check if this is a SCANOSS comment for this check type
                    if (firstComment.content && firstComment.content.includes(scanossMarker)) {
                        tl.debug(`Found SCANOSS comment thread ${thread.id}, deleting all comments`);
                        // Delete all comments in this thread
                        for (const comment of thread.comments) {
                            const deleteUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads/${thread.id}/comments/${comment.id}?api-version=7.1`;
                            await axios.delete(deleteUrl, {
                                headers: {
                                    'Authorization': `Bearer ${this.accessToken}`
                                }
                            });
                            tl.debug(`Deleted comment ${comment.id} from thread ${thread.id}`);
                        }
                    }
                }
            }
        } catch (error: any) {
            tl.warning(`Failed to delete previous comments: ${error.message}`);
        }
    }

    protected async addCommentToPR(title: string, content: string, threadStatus: THREAD_STATUS = THREAD_STATUS.pending) {
        if (this.buildReason && this.buildReason !== 'PullRequest') return;
        try {
            // Delete previous comments for this check type
            await this.deletePreviousComments(title);

            const apiUrl =`${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads?api-version=6.0`;

            // Add a hidden marker to identify SCANOSS comments and the check type
            const scanossMarker = `SCANOSS - ${title}`;
            const payload = {
                comments: [{
                    parentCommentId: 0,
                    content: `##${scanossMarker}\n\n${content}`
                }],
                status: threadStatus  // Set thread status: active, pending, fixed, wontFix, closed, byDesign, unknown
            };

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            tl.debug(`Comment added successfully: ${response.data}`);

            // Update the thread status using PATCH endpoint
            const threadId = response.data.id;
            if (threadId) {
                await this.updateThreadStatus(threadId, threadStatus);
                tl.debug(`Thread ${threadId} status updated to: ${threadStatus}`);
            }
        } catch (error: any) {
            tl.error('Failed to add comment:', error.response.data);
        }
    }

    protected async uploadArtifact(name: string, content: string) {

    const artifactName = `scanoss`;
    // Create a temporary directory and file path
    const tempDir = tl.getVariable('Agent.TempDirectory') || '.';
    const tempFilePath = path.join(tempDir, name);

    // Write the in-memory content to the temporary file
    await fs.promises.writeFile(tempFilePath, content);

    tl.command('artifact.upload', { artifactname: artifactName }, tempFilePath);
    }

    /**
     * Updates the status of a pull request thread.
     *
     * @param threadId - The ID of the thread to update
     * @param threadStatus - The new status to set (e.g., closed, active)
     * @see https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/update?view=azure-devops-rest-7.1
     */
    protected async updateThreadStatus(threadId: string, threadStatus: THREAD_STATUS) {
        const patchUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads/${threadId}?api-version=7.1`;
        await axios.patch(patchUrl, {
            status: threadStatus
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        tl.debug(`Thread ${threadId} status updated to: ${threadStatus}`);
    }

    /**
     * Resolve previous SCANOSS policy threads when the policy check passes.
     *
     * Searches through all PR threads for comments containing the SCANOSS marker
     * for this check type. When found, marks the thread as fixed to indicate the
     * policy violation has been resolved.
     */
    protected async resolvePolicyThreads(): Promise<void> {
        const threads = await this.getPreviousThreads();
        const scanossMarker = `SCANOSS - ${this.checkName}`;
        for (const thread of threads) {
            if (thread.comments && thread.comments.length > 0) {
                for (const comment of thread.comments) {
                    if (comment.content && comment.content.includes(scanossMarker)) {
                        try {
                            await this.updateThreadStatus(thread.id, THREAD_STATUS.fixed);
                        } catch (error: any) {
                            tl.warning(`Failed to resolve thread ${thread.id}: ${error.message}`);
                        }
                        break;
                    }
                }
            }
        }
    }
}