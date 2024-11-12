import { UndeclaredPolicyCheck } from '../../policies/undeclared-policy-check';
import { PR_STATUS } from '../../policies/policy-check';

export class TesteableUndeclaredPolicyCheck extends UndeclaredPolicyCheck {

   public buildCommandTestable(): string {
      return this['buildCommand']();
   }
}