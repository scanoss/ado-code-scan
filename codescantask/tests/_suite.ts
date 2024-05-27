import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('Sample task tests', function () {

    before( function() {

    });

    after(() => {

    });

    it('should succeed with simple inputs', function(done: Mocha.Done) {
        this.timeout(20000); // Increase timeout to 5 seconds

        let tp: string = path.join(__dirname, 'success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);


    });


});