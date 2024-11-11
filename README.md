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


# Publish

## Development

### Update Version for Publishing

To streamline the app versioning process for development:

1. Update the version in the **package.json** file.

2. Execute the following command to apply the version upgrade and build the app:
```bash
make upgrade_version_dev
```

### Building the App for Development

To build the app for a development environment:

```bash
make package_dev
```

### macOS (ARM64) Building for Development 
For macOS users with ARM64 architecture, run the following command:
```bash
make package_dev_mac_arm64
```
For more details see the following [issue](https://github.com/microsoft/tfs-cli/issues/414).


### Publish the App to Development

1. Generate a publishing token. For instructions on how to generate the token, refer to [Publish from the Command Line](https://learn.microsoft.com/en-us/azure/devops/extend/publish/command-line?view=azure-devops).

2. Publish the app using the following command:
```
tfx extension publish --manifest-globs vss-extension-dev.json --publisher SCANOSS --token $MSFT_PERSONAL_ACCESS_TOKEN
```


## Production

### Update Version for Publishing

1. Ensure that the version in the **package.json** file is updated.

2. Build the app with the following command:
```bash
make upgrade_version
```

### Build the App for Production

To build the app for the production environment, run:
```bash
make package
```

### Publish the App to Production

1. Generate a publishing token. For instructions on how to generate the token, refer to [Publish from the Command Line](https://learn.microsoft.com/en-us/azure/devops/extend/publish/command-line?view=azure-devops).

2. Publish the app using the following command:
```
tfx extension publish --manifest-globs vss-extension.json vss-extension-release.json --publisher SCANOSS --token $MSFT_PERSONAL_ACCESS_TOKEN
```
