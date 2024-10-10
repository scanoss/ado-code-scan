import { TesteableCopyleftPolicyCheck } from './testeables/TesteableCopyleftPolicyCheck';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as sinon from 'sinon';
import * as tl from 'azure-pipelines-task-lib/task';
import { TesteableUndeclaredPolicyCheck } from './testeables/TesteableUndeclaredPolicyCheck';
import { SBOM_FILEPATH } from '../app.input';




describe('Undeclared Policy Check Suite', () => {
    const originalFilepath = SBOM_FILEPATH;
    let getInputStub: sinon.SinonStub;
    const normalize = (str:string) => str.trim().replace(/\s+/g, ' ');

    beforeEach(function() {
        // Create a stub for tl.getInput
        getInputStub = sinon.stub(tl, 'getInput');

    });

    afterEach(function() {
        // Restore the original function
        getInputStub.restore();
        (SBOM_FILEPATH as any) = originalFilepath;
    });

    it('Undeclared Policy fail', async function() {

        getInputStub.withArgs('sbomFilepath').returns(path.join(__dirname,'data','SBOM.json'));
        const undeclaredPolicyCheck =  new TesteableUndeclaredPolicyCheck();
        const results = await fs.promises.readFile(path.join(__dirname,'data','results-copyleft.json'), 'utf-8' );

        await undeclaredPolicyCheck.run(JSON.parse(results));

        const details = undeclaredPolicyCheck.details();
        const description = undeclaredPolicyCheck.getDescription();

        if(!description  || !details) assert.fail();

        assert.equal(normalize(`### :x: Policy Fail #### 3 undeclared component(s) were found. See details for more information.`),normalize(description));
        assert.equal(normalize(`### Undeclared components | Component | Version | License | | - | - | - | | pkg:github/scanoss/wfp | 6afc1f6 | Zlib - GPL-2.0-only | | pkg:github/scanoss/scanner.c | 1.3.3 | BSD-2-Clause | | pkg:github/scanoss/engine | 4.0.4 | GPL-2.0-or-later - GPL-1.0-or-later - GPL-2.0-only | #### Add the following snippet into your \`sbom.json\` file \`\`\`json { "components": [ { "purl": "pkg:github/scanoss/wfp" }, { "purl": "pkg:github/scanoss/scanner.c" }, { "purl": "pkg:github/scanoss/engine" } ] } \`\`\``), normalize(details));

    });

    it('Undeclared Policy success', async function() {

        (SBOM_FILEPATH as any) = path.join(__dirname,'data','declared-components.json');
        const undeclaredPolicyCheck =  new TesteableUndeclaredPolicyCheck();
        const results = await fs.promises.readFile(path.join(__dirname,'data','results-copyleft.json'), 'utf-8' );

        await undeclaredPolicyCheck.run(JSON.parse(results));

        const details = undeclaredPolicyCheck.details();
        const description = undeclaredPolicyCheck.getDescription();

        assert.equal(details,undefined);
        assert.notEqual(description,undefined);

    });
});