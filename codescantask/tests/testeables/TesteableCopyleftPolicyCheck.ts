import { CopyleftPolicyCheck } from '../../policies/copyleft-policy-check';
import { PR_STATUS } from '../../policies/policy-check';
import * as tl from 'azure-pipelines-task-lib';
import { POLICIES_HALT_ON_FAILURE } from '../../app.input';

export class TesteableCopyleftPolicyCheck extends CopyleftPolicyCheck{


    public buildCopyleftCommandTesteable(): string {
        return this['buildCopyleftCommand']();
    }

    public buildCommandTesteable(): string {
        return this['buildCommand']();
    }


}