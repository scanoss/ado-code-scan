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

import { TesteableCopyleftPolicyCheck } from './testeables/TesteableCopyleftPolicyCheck';
import assert from 'assert';
import {
    COPYLEFT_LICENSE_EXCLUDE,
    COPYLEFT_LICENSE_EXPLICIT,
    COPYLEFT_LICENSE_INCLUDE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER,
} from "../app.input";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib";
import path from "path";

const sanitize = (input: string):string => {
    return input.replace(/[ \n\r]/g, '');
}

describe('CopyleftPolicyCheck', () => {

    const defaultCopyleftLicenseExplicit = COPYLEFT_LICENSE_EXPLICIT;
    const defaultCopyleftLicenseExclude = COPYLEFT_LICENSE_EXCLUDE;
    const defaultCopyleftLicenseInclude = COPYLEFT_LICENSE_INCLUDE;

    let getInputStub: sinon.SinonStub;

    before(async function() {
        // Increase timeout if needed
        this.timeout(30000);

        try {
            console.log("PULLING DOCKER IMAGE");
            await tl.execAsync('docker',['pull',RUNTIME_CONTAINER]);
        } catch (error) {
            console.error('Failed to pull Docker image:', error);
            throw error;
        }
    });

    beforeEach(function() {
        // Create a stub for tl.getInput
        getInputStub = sinon.stub(tl, 'getInput');

    });

    afterEach(function() {
        // Restore the original function
        getInputStub.restore();
        (COPYLEFT_LICENSE_EXPLICIT as any) = defaultCopyleftLicenseExplicit;
        (COPYLEFT_LICENSE_EXCLUDE as any) = defaultCopyleftLicenseExclude;
        (COPYLEFT_LICENSE_INCLUDE as any) = defaultCopyleftLicenseInclude;
    });

    it('Copyleft explicit test', async function() {
        getInputStub.withArgs('licensesCopyleftExplicit').returns('MIT,Apache-2.0');
        (COPYLEFT_LICENSE_EXPLICIT as any) = 'MIT,Apache-2.0';
        (COPYLEFT_LICENSE_EXCLUDE as any) = 'MIT,Apache-2.0';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftArgsTesteable();
        assert.deepStrictEqual(cmd,[ '--explicit', 'MIT,Apache-2.0' ]);
    });

    it('Copyleft exclude test', async function() {
        (COPYLEFT_LICENSE_EXCLUDE as any) = 'MIT,Apache-2.0';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftArgsTesteable();
        assert.deepStrictEqual(cmd,[ '--exclude', 'MIT,Apache-2.0' ]);
    });

    it('Copyleft include test', async function() {
        (COPYLEFT_LICENSE_INCLUDE as any) = 'MIT,Apache-2.0,LGPL-3.0-only';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftArgsTesteable();
        assert.deepStrictEqual(cmd,[ '--include', 'MIT,Apache-2.0,LGPL-3.0-only' ]);
    });

    it('Copyleft empty parameters test', async function() {
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftArgsTesteable();
        assert.deepStrictEqual(cmd,[]);
    });

    it('Copyleft empty parameters test', async function() {
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftArgsTesteable();
        assert.equal(cmd,'');
    });

    it('Build Command test', async function() {
        (REPO_DIR as any) = 'repodir';
        (OUTPUT_FILEPATH as any) = 'results.json';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildArgsTesteable();
        assert.deepStrictEqual(cmd,[
            'run',
            '-v',
            'repodir:/scanoss',
            RUNTIME_CONTAINER,
            'inspect',
            'copyleft',
            '--input',
            'results.json',
            '--format',
            'md'
        ]);
    });

    it('Copyleft policy check fail', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();

        await copyleftPolicyCheck.run();

        const details = copyleftPolicyCheck.details();
        const summary = copyleftPolicyCheck.getDescription();

        assert(details !== undefined, 'Details should not be undefined');
        assert(summary !== undefined, 'Summary should not be undefined');

        assert.equal(sanitize(details),sanitize(`### Copyleft licenses
         | Component | Version | License | URL | Copyleft | 
         | - | :-: | - | - | :-: | 
         | pkg:github/scanoss/wfp | 6afc1f6 | GPL-2.0-only | https://spdx.org/licenses/GPL-2.0-only.html | YES | 
         | pkg:github/scanoss/scanner.c | 1.3.3 | GPL-2.0-only | https://spdx.org/licenses/GPL-2.0-only.html | YES | 
        `));
        // Add your assertions here
        assert.equal(sanitize(summary),sanitize(`2 component(s) with copyleft licenses were found.`));
    });


    it('Copyleft policy empty results', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;
        (COPYLEFT_LICENSE_EXCLUDE as any) = 'GPL-2.0-only';

        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();

        await copyleftPolicyCheck.run();

        const details = copyleftPolicyCheck.details();
        const summary = copyleftPolicyCheck.getDescription();


        assert.equal(details,undefined);

        assert(summary !== undefined, 'Summary should not be undefined');
        // Add your assertions here
        assert.equal(sanitize(summary),sanitize(`### :white_check_mark: Policy Pass 
        #### Not copyleft Licenses were found`));
    });

    it('Copyleft policy explicit licenses', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;
        (COPYLEFT_LICENSE_EXPLICIT as any) = 'MIT,Apache-2.0';

        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();

        await copyleftPolicyCheck.run();

        const details = copyleftPolicyCheck.details();
        const summary = copyleftPolicyCheck.getDescription();

        assert(summary !== undefined, 'Summary should not be undefined');
        assert(details !== undefined, 'Details should not be undefined');

        assert.equal(sanitize(details),sanitize(`### Copyleft licenses
          | Component | Version | License | URL | Copyleft | 
          | - | :-: | - | - | :-: | 
          | pkg:npm/%40grpc/grpc-js | 1.12.2 | Apache-2.0 | https://spdx.org/licenses/Apache-2.0.html | YES | 
          | pkg:npm/abort-controller | 3.0.0 | MIT | https://spdx.org/licenses/MIT.html | YES | 
          | pkg:npm/adm-zip | 0.5.16 | MIT | https://spdx.org/licenses/MIT.html | YES |
        `));
        // Add your assertions here
        assert.equal(sanitize(summary),sanitize(`3 component(s) with copyleft licenses were found.`));
    });
});