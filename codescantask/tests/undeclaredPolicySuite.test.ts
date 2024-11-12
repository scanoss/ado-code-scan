import assert from 'assert';
import * as sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';
import { TesteableUndeclaredPolicyCheck } from './testeables/TesteableUndeclaredPolicyCheck';
import {COPYLEFT_LICENSE_EXPLICIT, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER, SBOM_FILEPATH} from '../app.input';
import path from "path";
import {TesteableCopyleftPolicyCheck} from "./testeables/TesteableCopyleftPolicyCheck";

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
        (RUNTIME_CONTAINER as any) = 'ghcr.io/scanoss/scanoss-py:v1.17.5';
        (OUTPUT_FILEPATH as any) = 'results.json';
        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();
        const cmd = undeclaredPolicyCheck.buildCommandTestable();
        assert.equal(cmd,'docker run -v "repodir:/scanoss" ghcr.io/scanoss/scanoss-py:v1.17.5 inspect undeclared --input results.json  --format md');
    });


    it('Undeclared component policy fail', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (RUNTIME_CONTAINER as any) = 'ghcr.io/scanoss/scanoss-py:v1.17.5';
        (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

        const undeclaredPolicyCheck = new TesteableUndeclaredPolicyCheck();

        await undeclaredPolicyCheck.run();


        const details = undeclaredPolicyCheck.details();
        const summary = undeclaredPolicyCheck.getDescription();

        assert(summary !== undefined, 'Summary should not be undefined');
        assert(details !== undefined, 'Details should not be undefined');

        assert.equal(sanitize(details),sanitize(`### Undeclared components
         | Component | Version | License | 
         | - | - | - | 
         | pkg:github/scanoss/wfp | 6afc1f6 | Zlib - GPL-2.0-only | 
         | pkg:github/scanoss/scanner.c | 1.3.3 | BSD-2-Clause - GPL-2.0-only | 
         | pkg:npm/%40grpc/grpc-js | 1.12.2 | Apache-2.0 | 
         | pkg:npm/abort-controller | 3.0.0 | MIT | 
         | pkg:npm/adm-zip | 0.5.16 | MIT | 5 undeclared component(s) were found.
        Add the following snippet into your \`sbom.json\` file
        
        \`\`\`json
        {
          "components": [
            {
              "purl": "pkg:github/scanoss/wfp"
            },
            {
              "purl": "pkg:github/scanoss/scanner.c"
            },
            {
              "purl": "pkg:npm/%40grpc/grpc-js"
            },
            {
              "purl": "pkg:npm/abort-controller"
            },
            {
              "purl": "pkg:npm/adm-zip"
            }
          ]
        }
        \`\`\``));
    });

    it('Undeclared component policy success', async function () {
        this.timeout(30000);
        const TEST_DIR = __dirname;
        const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
        const TEST_RESULTS_FILE = 'empty-results.json';

        // Set the required environment variables
        (REPO_DIR as any) = TEST_REPO_DIR;
        (RUNTIME_CONTAINER as any) = 'ghcr.io/scanoss/scanoss-py:v1.17.5';
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