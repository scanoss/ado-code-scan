# Azure DevOps Code Scan Task
The SCANOSS Code Scan task enhances your software development process by automatically scanning your code for security vulnerabilities and license compliance with configurable policies.

# Usage

### Installation Instructions
To install the SCANOSS Code Scan task, please consult the Visual Studio Marketplace guide [here](INSERT_LINK_TO_AZURE_MARKETPLACE_DEV_OPS).  

### Detailed Information
For more detailed usage instructions, please refer to the [OVERVIEW.md](OVERVIEW.md) document.

# Development Guide

This guide provides step-by-step instructions for deploying a new package for your project. Ensure all steps are followed to maintain version consistency and successful deployment.

### Prerequisites

- **Node.js**: Ensure Node.js and npm are installed.
- **Azure DevOps Extension Tool (tfx)**: Install the TFS cross-platform command-line interface (`tfx`).
- **jq**: Install `jq` for JSON processing.

### Installation
Run the following command to install the project dependencies:

``` bash
make install
```



### Tests
Before building the app, run test suites.
``` bash
make test
```

### Upgrade App version

A script file is provided to simply the app versioning process.

1. Ensure to update the version in the **package.json** file.

2. Then, run the following command to build the app:
``` bash
make upgrade_version
```

### Build the App
Run the following command to build the app:

``` bash
make build
```
