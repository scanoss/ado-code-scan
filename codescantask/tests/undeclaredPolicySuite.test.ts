import assert from 'assert';
import * as sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';
import { TesteableUndeclaredPolicyCheck } from './testeables/TesteableUndeclaredPolicyCheck';
import {OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER, SBOM_FILEPATH} from '../app.input';

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
});