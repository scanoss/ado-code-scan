import * as tl from 'azure-pipelines-task-lib';
import { ScannerResults } from '../services/result.interface';
import { POLICIES_HALT_ON_FAILURE } from '../app.input';
import axios from 'axios';

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
        await this.updatePRStatus(PR_STATUS.failed, `SCANOSS Policy Check: ${this.checkName}`)
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
        }
    }

 
}