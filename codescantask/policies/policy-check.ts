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
import { ScannerResults } from '../services/result.interface';
import { POLICIES_HALT_ON_FAILURE } from '../app.input';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export enum PR_STATUS {
    succeeded = 'succeeded',
    failed = 'failed',
    pending = 'pending',
}

export abstract class PolicyCheck {
    protected checkName: string;
    private readonly accessToken: string | undefined;
    private readonly orgUrl: string | undefined;
    private readonly project:string | undefined;
    private readonly repositoryId:string | undefined;
    private readonly pullRequestId:string | undefined;
    constructor(checkName: string) {
        this.checkName = checkName;
        this.accessToken = tl.getVariable('System.AccessToken');
        this.orgUrl = tl.getVariable('System.TeamFoundationCollectionUri') || '';
        this.project = tl.getVariable('System.TeamProjectId') || '';
        this.repositoryId = tl.getVariable('Build.Repository.Id') || '';
        this.pullRequestId = tl.getVariable('System.PullRequest.PullRequestId') || '';
    }

    public abstract run(scanResults: ScannerResults): Promise<void>;

    public async start():Promise<void> {
        await this.updatePRStatus(PR_STATUS.pending,`SCANOSS Policy Check: ${this.checkName}`);
    }

    protected async success(summary: string, text?: string): Promise<void> {
        tl.debug(`[${this.checkName}]: SUMMARY: ${summary}, ${text? text : ''} `);
        await this.updatePRStatus(PR_STATUS.succeeded, `SCANOSS Policy Check: ${this.checkName}`)
    }

    protected async reject(summary: string, text?: string): Promise<void> {
        let status = tl.TaskResult.SucceededWithIssues;
        if (POLICIES_HALT_ON_FAILURE)  status = tl.TaskResult.Failed;
        tl.setResult(status, `[${this.checkName}], SUMMARY: ${summary}, DETAILS: ${text? text: ''} `);
        await this.updatePRStatus(PR_STATUS.failed, `SCANOSS Policy Check: ${this.checkName}`);
        if(text) {
            await this.addCommentToPR(`${this.checkName} Check Results`, text);
        }
    }

    protected async updatePRStatus(state: PR_STATUS, description: string){
        try {
                if (!this.accessToken || !this.orgUrl || !this.project || !this.repositoryId || !this.pullRequestId) {
                throw new Error('Missing necessary environment variables.');
            }

            const status = {
                state: state, // succeeded, failed, pending
                description: description,
                context: {
                    name: this.checkName,
                    genre: 'SCANOSS'
                },
            };

            // Post the status to the PR
            const apiUrl = `${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/statuses?api-version=6.0-preview.1`;
            await axios.post(apiUrl, status, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
        } catch (err:any) {
            tl.setResult(tl.TaskResult.SucceededWithIssues, `Failed to add status to PR: ${err.message}`);
             await this.updatePRStatus(PR_STATUS.failed, '');
        }
    }

    private async addCommentToPR(title: string, content: string) {
        try {
            const apiUrl =`${this.orgUrl}${this.project}/_apis/git/repositories/${this.repositoryId}/pullRequests/${this.pullRequestId}/threads?api-version=6.0`;

            const payload = {
                comments: [{
                    parentCommentId: 0,
                    content: `## ${title}\n${content}`
                }]
            };

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            tl.debug(`Comment added successfully: ${response.data}`);
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
 
}