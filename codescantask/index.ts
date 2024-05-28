import tl = require('azure-pipelines-task-lib/task');
import { ScanService } from './services/scan.service';
import { policyManager } from './policies/policy.manager';



async function run() {
    try {
            console.log("Starting scan");
            const scanService = new ScanService();
            const results  = await scanService.scan();
            const policies = policyManager.getPolicies();

        // run policies
        for (const policy of policies) {
            await policy.run(results);
        }

    }
    catch (err:any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}




run();