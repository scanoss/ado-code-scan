# SCANOSS Code Scan Task
The SCANOSS Code Scan task enhances your software development process by automatically scanning your code for security vulnerabilities and license compliance with configurable policies.

## Usage

To begin using this task, you'll need to set up a basic Pipeline and define a task within it:

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
Before creating a new package, ensure to update the version in the package.json file. Then, run the following command to build the app:

``` bash
make build
```
