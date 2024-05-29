import { TesteableCopyleftPolicyCheck } from './testeables/TesteableCopyleftPolicyCheck';
import assert from 'assert';
import fs from 'fs';
import path from 'path';


describe('CopyleftPolicyCheck', () => {
    const normalize = (str:string) => str.trim().replace(/\s+/g, ' ');

    it('Copyleft policy fail', async function() {

            const copyleftPolicyCheck =  new TesteableCopyleftPolicyCheck();
            const results = await fs.promises.readFile(path.join(__dirname,'data','results-copyleft.json'), 'utf-8' );

            await copyleftPolicyCheck.run(JSON.parse(results));

            const details = copyleftPolicyCheck.details();
            const description = copyleftPolicyCheck.getDescription();
            if(!details || !description) assert.fail();
            assert.equal(normalize(details),normalize( '   |  Component | Version | License | URL | Copyleft  |\n' +
                '   | - | - | - | - | - |       \n' +
                '   | pkg:github/scanoss/wfp | 6afc1f6 | Zlib | https://spdx.org/licenses/Zlib.html |   | \n' +
                ' | pkg:github/scanoss/wfp | 6afc1f6 | GPL-2.0-only | https://spdx.org/licenses/GPL-2.0-only.html | :x: | \n' +
                ' | pkg:github/scanoss/scanner.c | 1.3.3 | BSD-2-Clause | https://spdx.org/licenses/BSD-2-Clause.html |   | \n' +
                ' | pkg:github/scanoss/scanner.c | 1.3.3 | GPL-2.0-only | https://spdx.org/licenses/GPL-2.0-only.html | :x: | \n' +
                ' | pkg:github/scanoss/engine | 4.0.4 | GPL-2.0-or-later | https://spdx.org/licenses/GPL-2.0-or-later.html | :x: | \n' +
                ' | pkg:github/scanoss/engine | 4.0.4 | GPL-1.0-or-later | https://spdx.org/licenses/GPL-1.0-or-later.html | :x: | \n' +
                ' | pkg:github/scanoss/engine | 4.0.4 | GPL-2.0-only | https://spdx.org/licenses/GPL-2.0-only.html | :x: | '));
            assert.equal(normalize(description),normalize('### :x: Policy Fail \n' +
                ' #### 3 component(s) with copyleft licenses were found.  See details for more information.\n'));
    });

    it('Copyleft Policy Success', async function() {
        const copyleftPolicyCheck = new TesteableCopyleftPolicyCheck();
        const results = await fs.promises.readFile(path.join(__dirname, 'data', 'results-non-copyleft.json'), 'utf-8');

        await copyleftPolicyCheck.run(JSON.parse(results));

        const details = copyleftPolicyCheck.details();
        const description = copyleftPolicyCheck.getDescription();

        assert.equal(details,undefined);
        assert.notEqual(description,undefined);
    });



});