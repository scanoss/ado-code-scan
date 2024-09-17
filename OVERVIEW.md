# SCANOSS Code Scan Task
The SCANOSS Code Scan task enhances your software development process by automatically scanning your code for security vulnerabilities and license compliance with configurable policies.

## Usage
Before using the SCANOSS Code Scan Task, you need to install it from the Azure Marketplace. You can find it [here](https://marketplace.visualstudio.com/items?itemName=SCANOSS.scanoss-code-scan).

### Set Up

The SCANOSS Code Scan Task uses the Azure API to create Checks and Comments on Pull Requests. Once the pipeline is available upstream, ensure you have the correct permissions set up on your repository: 

Open the repository settings section:
  1. Project Settings
  2. Repositories
  3. Select the repository

![Ado-setup-repository-settings](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/ADO-setup-1.png?raw=true)

A) Allow Pull Request Contribute Access:
  1. Open the 'Security' tab.
  2. Select the repository Build Service account under the 'Users' group.
  3. Allow "Contribute to pull requests".

![Ado-setup-pull-request-contribution-access](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/ADO-setup-2.png?raw=true)


B) Add Build Validation Policy to the integration branch:
  1. Open the 'Policies' tab.
  2. Select the integration branch under 'Branch Policies'.
  3. Add a new Build Validation Policy, configure the options, and save:
      1. Build Pipeline: Select your pipeline.
      2. Trigger: Automatic.
      3. Policy Requirement: Select your option.
      4. Build Expiration: Select your option.
      5. Set a display name.

![Ado-setup-build-validation-policy](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/ADO-setup-3.png?raw=true)




## Pipeline
A basic pipeline should be set and the SCANOSS task should be included within it:

```yaml
trigger: none

pr:
  - main

pool:
  vmImage: ubuntu-latest

##schedules:
##  - cron: "*/5 * * * *"  # Every 5 minutes
##    displayName: "Run every 5 minutes"
##    always: true         # Ensures the pipeline runs even if there are no code changes
##    branches:
##      include:
##        - main           # Specify the branch(es) to trigger the schedule on  
  
variables:
  HTTP_PROXY: $(HTTP_PROXY_URL)
  HTTPS_PROXY: $(HTTPS_PROXY_URL)   

steps:
  - checkout: self
    persistCredentials: true

  - task: scanoss@0
    displayName: "SCANOSS Code Scan"
    inputs:
     # apiKey: $(APIKEY)
     # apiUrl: 'https://api.scanoss.com/scan/direct'
      sbomFilepath: SBOM.json
      policies: copyleft,undeclared
      policiesHaltOnFailure: false
```

**NOTE**:  
Minor versions can be set by specifying the full version number of a task after the @ sign (example: scanoss@0.1.1). For further details, please refer to the [task version](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/tasks?view=azure-devops&tabs=yaml#task-versions).

### Proxy Settings
If a proxy is required for internet access in your environment, the ***HTTP_PROXY*** and ***HTTPS_PROXY*** variables can be set in the pipeline to the appropriate proxy URLs. This will ensure that all network requests made during the pipeline execution are routed through the specified proxies.

### Pipeline Triggers
In addition to being triggered by pull requests (PRs), pipelines can also be run manually and scheduled to execute at regular intervals.
When the pipeline is manually triggered or runs on a schedule, the results are uploaded only to the run artifacts.

### Action Input Parameters

| **Parameter**            | **Description**                                                                                      | **Required** | **Default**                          | 
|--------------------------|------------------------------------------------------------------------------------------------------|--------------|--------------------------------------|
| outputFilepath           | Scan output file name.                                                                               | Optional     | `results.json`                       |
| sbomEnabled              | Enable or disable scanning based on the SBOM file                                                    | Optional     | `true`                               |
| sbomFilepath             | Filepath of the SBOM file to be used for scanning                                                    | Optional     | `sbom.json`                          |
| sbomType                 | Type of SBOM operation: either 'identify' or 'ignore                                                 | Optional     | `identify`                           |
| dependenciesEnabled      | Option to enable or disable scanning of dependencies.                                                | Optional     | `false`                              |
| dependenciesScope        | Gets development or production dependencies (scopes: dev - prod )                                    | Optional     | -                                    |                       |
| dependenciesScopeInclude | Custom list of dependency scopes to be included. Provide scopes as a comma-separated list.           | Optional     | -                                    |
| dependenciesScopeExclude | Custom list of dependency scopes to be excluded. Provide scopes as a comma-separated list.           | Optional     | -                                    |
| policies                 | List of policies separated by commas, options available are: copyleft, undeclared.                   | Optional     | -                                    |
| policiesHaltOnFailure    | Halt check on policy failure. If set to false checks will not fail.                                  | Optional     | `true`                               |
| apiUrl                   | SCANOSS API URL                                                                                      | Optional     | `https://api.osskb.org/scan/direct`  |
| apiKey                   | SCANOSS API Key                                                                                      | Optional     | -                                    |
| runtimeContainer         | Runtime URL                                                                                          | Optional     | `ghcr.io/scanoss/scanoss-py:v1.15.0` |
| licensesCopyleftInclude  | List of Copyleft licenses to append to the default list. Provide licenses as a comma-separated list. | Optional     | -                                    |
| licensesCopyleftExclude  | List of Copyleft licenses to remove from default list. Provide licenses as a comma-separated list.   | Optional     | -                                    |
| licensesCopyleftExplicit | Explicit list of Copyleft licenses to consider. Provide licenses as a comma-separated list.          | Optional     | -                                    |


## Policy Checks
The SCANOSS Code Scan Task includes two configurable policies:

1. Copyleft: This policy checks if any component or code snippet is associated with a copyleft license. If such a
   license is detected, the pull request (PR) is rejected. The default list of Copyleft licenses is defined in the following [file](https://github.com/scanoss/ado-code-scan/blob/main/src/utils/license.utils.ts).

2. Undeclared: This policy compares the components detected in the repository against those declared in the sbom.json
   file (customizable through the sbom.filepath parameter). If there are undeclared components, the PR is rejected.

Additionally, if it is a Pull Request, a comment with a summary of the report will be automatically generated.

![Comments on PR Undeclared Components](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/pr_comment_undeclared_components.png?raw=true)


![Comments on PR Copyleft licenses](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/pr_comment_copyleft.png?raw=true)


## Artifacts
The scan results and policy check outcomes are uploaded to the artifacts folder of the specific run of the pipeline.

![Artifacts](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/results_artifact.png?raw=true)


## Example Repository
An example use case can be found at the following [link](https://dev.azure.com/scanoss/scanoss-ado-integration-demo).