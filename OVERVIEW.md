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

A) Allow Pull Request Contribute Access:
  1. Open the 'Security' tab.
  2. Select the repository Build Service account under the 'Users' group.
  3. Allow "Contribute to pull requests".

B) Add Build Validation Policy to the integration branch:
  1. Open the 'Policies' tab.
  2. Select the integration branch under 'Branch Policies'.
  3. Add a new Build Validation Policy, configure the options, and save:
      1. Build Pipeline: Select your pipeline.
      2. Trigger: Automatic.
      3. Policy Requirement: Select your option.
      4. Build Expiration: Select your option.
      5. Set a display name.

### Pipeline
To begin using this task, you'll need to set up a basic Pipeline and define a task within it:

```yaml
trigger: none

pr:
  - main

pool:
  vmImage: ubuntu-latest

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

### Action Input Parameters

| **Parameter**         | **Description**                                                                    | **Required** | **Default**                             | 
|-----------------------|------------------------------------------------------------------------------------|--------------|-----------------------------------------|
| outputFilepath        | Scan output file name.                                                             | Optional     | `results.json`                          |
| sbomEnabled           | Enable or disable scanning based on the SBOM file                                  | Optional     | `true`                                  |
| sbomFilepath          | Filepath of the SBOM file to be used for scanning                                  | Optional     | `sbom.json`                             |
| sbomType              | Type of SBOM operation: either 'identify' or 'ignore                               | Optional     | `identify`                              |
| dependenciesEnabled   | Option to enable or disable scanning of dependencies.                              | Optional     | `false`                                 |
| policies              | List of policies separated by commas, options available are: copyleft, undeclared. | Optional     | -                                       |
| policiesHaltOnFailure | Halt check on policy failure. If set to false checks will not fail.                | Optional     | `true`                                  |
| apiUrl                | SCANOSS API URL                                                                    | Optional     | `https://api.osskb.org/scan/direct` |
| apiKey                | SCANOSS API Key                                                                    | Optional     | -                                       |


## Policy Checks
The SCANOSS Code Scan Task includes two configurable policies:

1. Copyleft: This policy checks if any component or code snippet is associated with a copyleft license. If such a
   license is detected, the pull request (PR) is rejected.

2. Undeclared: This policy compares the components detected in the repository against those declared in an sbom.json
   file (customizable through the sbom.filepath parameter). If there are undeclared components, the PR is rejected.

In this scenario, a classic policy is executed that will fail if copyleft licenses are found within the results:

![Azure DevOps Checks](https://github.com/scanoss/integration-azure-DevOps/blob/1637ab09e9f4834a419a5277f563b4035cf98d35/.github/assets/pr_comment_undeclared_components.png?raw=true)

Additionally, if it is a Pull Request, a comment with a summary of the report will be automatically generated.

![Comments on PR Undeclared Components](https://github.com/scanoss/integration-azure-DevOps/blob/1637ab09e9f4834a419a5277f563b4035cf98d35/.github/assets/pr_comment_undeclared_components.png?raw=true)

![Comments on PR Copyleft licenses](https://github.com/scanoss/integration-azure-DevOps/blob/main/.github/assets/pr_comment_copyleft.png?raw=true)