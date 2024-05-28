import * as tl from 'azure-pipelines-task-lib';
import { ScannerResults } from '../services/result.interface';
import { POLICIES_HALT_ON_FAILURE } from '../app.input';

export abstract class PolicyCheck {
    protected checkName: string;
    constructor(checkName: string) {
        this.checkName = checkName;
    }

    public abstract run(scanner: ScannerResults):Promise<void>;

    protected async success(summary: string, text?: string): Promise<void> {
        tl.debug(`[${this.checkName}]: SUMMARY: ${summary}, ${text? text : ''} `);
    }

    protected async reject(summary: string, text?: string): Promise<void> {
        let status = tl.TaskResult.SucceededWithIssues;
        if (POLICIES_HALT_ON_FAILURE)  status = tl.TaskResult.Failed;
        tl.setResult(status, `[${this.checkName}], SUMMARY: ${summary}, DETAILS: ${text? text: ''} `);
    }
}