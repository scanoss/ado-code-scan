import { TesteableCopyleftPolicyCheck } from './testeables/TesteableCopyleftPolicyCheck';
import assert from 'assert';
import {
    COPYLEFT_LICENSE_EXCLUDE,
    COPYLEFT_LICENSE_EXPLICIT,
    COPYLEFT_LICENSE_INCLUDE, OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER,
} from "../app.input";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib";

describe('CopyleftPolicyCheck', () => {

    const defaultCopyleftLicenseExplicit = COPYLEFT_LICENSE_EXPLICIT;
    const defaultCopyleftLicenseExclude = COPYLEFT_LICENSE_EXCLUDE;
    const defaultCopyleftLicenseInclude = COPYLEFT_LICENSE_INCLUDE;

    let getInputStub: sinon.SinonStub;


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
        const cmd = copyleftPolicyCheck.buildCopyleftCommandTesteable();
        assert.equal(cmd,'--explicit MIT,Apache-2.0');
    });

    it('Copyleft exclude test', async function() {
        (COPYLEFT_LICENSE_EXCLUDE as any) = 'MIT,Apache-2.0';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftCommandTesteable();
        assert.equal(cmd,'--exclude MIT,Apache-2.0');
    });

    it('Copyleft include test', async function() {
        (COPYLEFT_LICENSE_INCLUDE as any) = 'MIT,Apache-2.0,LGPL-3.0-only';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftCommandTesteable();
        assert.equal(cmd,'--include MIT,Apache-2.0,LGPL-3.0-only');
    });

    it('Copyleft empty parameters test', async function() {
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftCommandTesteable();
        assert.equal(cmd,'');
    });

    it('Copyleft empty parameters test', async function() {
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCopyleftCommandTesteable();
        assert.equal(cmd,'');
    });

    it('Build Command test', async function() {
        (REPO_DIR as any) = 'repodir';
        (RUNTIME_CONTAINER as any) = 'ghcr.io/scanoss/scanoss-py:v1.17.5';
        (OUTPUT_FILEPATH as any) = 'results.json';
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const cmd = copyleftPolicyCheck.buildCommandTesteable()
        console.log(cmd);
        assert.equal(cmd,'docker run -v "repodir:/scanoss" ghcr.io/scanoss/scanoss-py:v1.17.5 inspect copyleft --input results.json  --format md');
    });


});