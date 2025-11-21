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

import { PolicyCheck } from './policy-check';
import * as tl from "azure-pipelines-task-lib";
import {
    COPYLEFT_LICENSE_EXCLUDE, COPYLEFT_LICENSE_EXPLICIT,
    COPYLEFT_LICENSE_INCLUDE, DEBUG, EXECUTABLE,
    OUTPUT_FILEPATH,
    REPO_DIR,
    RUNTIME_CONTAINER
} from "../app.input";

/**
 * This class checks if any of the components identified in the scanner results are subject to copyleft licenses.
 * It filters components based on their licenses and looks for those with copyleft obligations.
 * It then generates a summary and detailed report of the findings.
 */
export class CopyleftPolicyCheck extends PolicyCheck {
    private policyCheckResultName = 'policy-check-copyleft-results.md'
    constructor() {
        super(`Copyleft Policy`);
    }

    private buildCopyleftArgs(): Array<string>{
        if (COPYLEFT_LICENSE_EXPLICIT) {
            tl.debug(`Explicit copyleft licenses: ${COPYLEFT_LICENSE_EXPLICIT}`);
            return ['--explicit', COPYLEFT_LICENSE_EXPLICIT];
        }

        if (COPYLEFT_LICENSE_INCLUDE) {
            tl.debug(`Included copyleft licenses: ${COPYLEFT_LICENSE_INCLUDE}`);
            return ['--include', COPYLEFT_LICENSE_INCLUDE];
        }

        if (COPYLEFT_LICENSE_EXCLUDE) {
            tl.debug(`Excluded copyleft licenses: ${COPYLEFT_LICENSE_EXCLUDE}`);
            return ['--exclude', COPYLEFT_LICENSE_EXCLUDE];
        }

        return [];
    }

    private buildArgs(): Array<string> {
        return ['run', '-v', `${REPO_DIR}:/scanoss`, RUNTIME_CONTAINER, 'inspect', 'copyleft', '--input',
            OUTPUT_FILEPATH,
            '--format',
            'md',
            ...this.buildCopyleftArgs(),
            ...(DEBUG ? ['--debug'] : [])
        ];
    }

    async run(): Promise<void> {
        await this.start();

        const args = this.buildArgs();

        tl.debug(`Executing Docker command: ${args}`);
        const results = tl.execSync(EXECUTABLE, args);

        if (results.code === 0) {
            await this.success('### :white_check_mark: Policy Pass \n #### Not copyleft Licenses were found', undefined);
            return;
        }

        // Another exit error is not related to copyleft licenses
        if(results.code === 1) {
            tl.setResult(tl.TaskResult.Failed, "Copyleft policy failed: See logs for more details.");
            return;
        }

        await this.uploadArtifact(this.policyCheckResultName, results.stdout);
        await this.reject(results.stderr, results.stdout);

    }

}