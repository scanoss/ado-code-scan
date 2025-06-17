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

import assert from 'assert';
import * as sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';
import { TesteableUndeclaredPolicyCheck } from './testeables/TesteableUndeclaredPolicyCheck';
import {OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER, SBOM_FILEPATH, SCANOSS_SETTINGS} from '../app.input';
import path from "path";

const sanitize = (input: string):string => {
    return input.replace(/[ \n\r]/g, '');
}

describe('Undeclared Policy Check Suite', () => {
    const originalFilepath = SBOM_FILEPATH;
    let getInputStub: sinon.SinonStub;

    beforeEach(function() {
        // Create a stub for tl.getInput
        getInputStub = sinon.stub(tl, 'getInput');

    });

    afterEach(function() {
        // Restore the original function
        getInputStub.restore();
        (SBOM_FILEPATH as any) = originalFilepath;
    });

    it('Build Command test', function() {
        (REPO_DIR as any) = 'repodir';
        (OUTPUT_FILEPATH as any) = 'results.json';
        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();
        const cmd = undeclaredPolicyCheck.buildArgsTestable();
        assert.deepStrictEqual(cmd, [
            'run',
            '-v',
            'repodir:/scanoss',
            RUNTIME_CONTAINER,
            'inspect',
            'undeclared',
            '--input',
            'results.json',
            '--format',
            'md',
            '--sbom-format',
            'legacy'
        ]);
    });

    it('Build Command style scanoss.json', function() {
        (REPO_DIR as any) = 'repodir';
        (OUTPUT_FILEPATH as any) = 'results.json';
        (SCANOSS_SETTINGS as any) = true;
        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();
        const cmd = undeclaredPolicyCheck.buildArgsTestable();
        assert.deepStrictEqual(cmd, [
            'run',
            '-v',
            'repodir:/scanoss',
            RUNTIME_CONTAINER,
            'inspect',
            'undeclared',
            '--input',
            'results.json',
            '--format',
            'md',
        ]);
    });


    it('Undeclared component policy fail', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();

        await undeclaredPolicyCheck.run();


        const details = undeclaredPolicyCheck.details();
        const summary = undeclaredPolicyCheck.getDescription();

        assert(summary !== undefined, 'Summary should not be undefined');
        assert(details !== undefined, 'Details should not be undefined');

        console.log(details);

        assert.equal(sanitize(details),sanitize(`###Undeclaredcomponents|Component|Version|License||-|-|-||pkg:github/scanoss/wfp|6afc1f6|Zlib-GPL-2.0-only||pkg:github/scanoss/scanner.c|1.3.3|BSD-2-Clause-GPL-2.0-only|2undeclaredcomponent(s)werefound.Addthefollowingsnippetintoyour\`scanoss.json\`file\`\`\`json{"bom":{"include":[{"purl":"pkg:github/scanoss/wfp"},{"purl":"pkg:github/scanoss/scanner.c"}]}}\`\`\``));
    });

    it('Undeclared component policy success', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'empty-results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();

        await undeclaredPolicyCheck.run();

        const details = undeclaredPolicyCheck.details();
        const summary = undeclaredPolicyCheck.getDescription();

        assert.equal(details,undefined);

        assert(summary !== undefined, 'Summary should not be undefined');

        assert.equal(sanitize(summary),sanitize(`### :white_check_mark: Policy Pass 
        #### Not undeclared components were found`));
    });
});