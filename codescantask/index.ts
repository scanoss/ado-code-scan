import tl = require('azure-pipelines-task-lib/task');
import { ScanService } from './services/scan.service';

async function run() {
    try {
            console.log("Starting scan");
            const scanService = new ScanService();
            await scanService.scan();
    }
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();