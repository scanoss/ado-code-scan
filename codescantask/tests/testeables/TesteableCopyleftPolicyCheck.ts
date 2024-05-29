import { CopyleftPolicyCheck } from '../../policies/copyleft-policy-check';
import { PR_STATUS } from '../../policies/policy-check';
import * as tl from 'azure-pipelines-task-lib';
import { POLICIES_HALT_ON_FAILURE } from '../../app.input';

export class TesteableCopyleftPolicyCheck extends CopyleftPolicyCheck{

    private summary: string | undefined;
    private text: string | undefined;
    public async updatePRStatus(state: PR_STATUS, description: string) {
        return;
    }

    protected async success(summary: string, text?: string): Promise<void> {
        this.text = text;
        this.summary = summary;
    }

    protected async reject(summary: string, text?: string): Promise<void> {
        this.text = text;
        this.summary = summary;
    }

    public getDescription(){
        return this.summary;
    }

    public details(){
        return this.text;
    }

}