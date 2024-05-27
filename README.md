# SCANOSS Code Scan Task
The SCANOSS Code Scan Action enhances your software development process by automatically scanning your code for security vulnerabilities and license compliance with configurable policies.

## Usage

To begin using this action, you'll need to set up a basic Pipeline and define a task within it:

```yaml
trigger:
  - master

pool:
  vmImage: ubuntu-latest

steps:

  - task: scanoss@0
    displayName: "SCANOSS Code Scan"
```


# Deployment Guide

This guide provides step-by-step instructions for deploying a new package for your project. Ensure all steps are followed to maintain version consistency and successful deployment.

## Prerequisites

- **Node.js**: Ensure Node.js and npm are installed.
- **Azure DevOps Extension Tool (tfx)**: Install the TFS cross-platform command-line interface (`tfx`).
- **jq**: Install `jq` for JSON processing.

## Build the App

Before deploying a new package, build the application to ensure that all changes are compiled.

1. Navigate to the `codescantask` directory.
2. Run the build script.

    ```bash
    cd codescantask && npm run build
    ```

## Update Version

Before creating a new package, update the version in the `task.json` file. This version will then be synchronized with `package.json` and `vss-extension.json` using the provided script.

1. Update the `version` field in `task.json`:

    ```
    "version" {
        "Major": 1,
        "Minor": 0,
        "Patch": 0
    }
    ```

2. Run the version synchronization script:

    ```bash
    ./version.sh
    ```

## Create the Package

Create a new package using the updated `vss-extension.json` file.

1. Ensure you are in the root directory of your project.
2. Run the following command to create the package:

    ```bash
    tfx extension create --manifest-globs vss-extension.json
    ```
