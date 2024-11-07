import { ScanService } from '../services/scan.service';
import assert from 'assert';


describe('ScanService', function () {
    it('should correctly return the dependency scope command', function () {
        const service = new ScanService({
            outputFilepath: '',
            inputFilepath: '',
            runtimeContainer: '',
            dependencyScope: 'prod',
            dependencyScopeInclude: '',
            dependencyScopeExclude: '',
            scanFiles: true,
            skipSnippets: false,
        });

        // Accessing the private method by bypassing TypeScript type checks
        const command = (service as any).dependencyScopeCommand();
        assert.equal(command,'--dep-scope prod')

    });
});