# SCANOSS Code Scan Azure DevOps Extension: Client Help Guide

## Introduction

This document provides guidance and troubleshooting tips for clients using the SCANOSS Code Scan plugin in Azure DevOps (ADO). It addresses common issues encountered during installation and usage, offering solutions and best practices to ensure smooth operation of the plugin.

## Common Issues and Solutions

### 1. Docker Image Pull Failure

**Issue:** Unable to pull the *scanoss-py* Docker image.

**Error message:**
```
Unable to find image 'ghcr.io/scanoss/scanoss-py:v1.9.0' locally
docker: Error response from daemon: failed to resolve reference "ghcr.io/scanoss/scanoss-py:v1.9.0": failed to do request: Head "https://ghcr.io/v2/scanoss/scanoss-py/manifests/v1.9.0": EOF.
```

**Solution:**
1. Ensure that the host running the Azure pipeline has access to https://ghcr.io.
2. If behind a corporate firewall, request IT support to allow access to https://ghcr.io.

### 2. Using Self-Hosted Docker Registry

If your network has its own self-hosted Docker image registry, configure the SCANOSS ADO plugin to pull the scanoss-py Docker image from there.

**Example pipeline YAML configuration:**

```yaml
trigger: none

pr:
- master
    
pool:
  vmImage: ubuntu-latest

steps:
- checkout: self
  persistCredentials: true
  
- task: scanoss@1.3.0
  displayName: "SCANOSS Code Scan"
  inputs:
    apiKey: $(APIKEY)
    apiUrl: 'https://api.scanoss.com/scan/direct'
    sbomFilepath: SBOM.json
    policies: copyleft,undeclared
    policiesHaltOnFailure: false
    runtimeContainer: '<self_hosted_registry>/scanoss-py:v1.15.0'
```

Replace `<self_hosted_registry>` with the address of your internal Docker registry.

### 3. Proxy Configuration

If your pipeline is running behind a proxy, configure the proxy settings for the SCANOSS ADO plugin:

```yaml
variables:
  HTTP_PROXY: http://your-proxy:8080
  HTTPS_PROXY: http://your-proxy:8080
```

### 4. Failed to add status to PR

**Issue:** Pipeline fails with a "Maximum call stack size exceeded" error.

**Error message:**
```
Writing results to ./results.json...
Searching . for files to fingerprint...
Docker command executed successfully
##[warning]Failed to add status to PR: Missing necessary environment variables.
##[warning]Failed to add status to PR: Missing necessary environment variables.
##[warning]Failed to add status to PR: Missing necessary environment variables.
```

**Solution:** This error occurs when the pipeline is triggered manually without an associated Pull Request (PR). To resolve:
1. Create a Pull Request in your repository in order to launch the scan instead of runnning manually

### 5. Failed with status code 403

**Issue:** Repeated warnings about failing with status code 403.

**Solution:** Enable the "Contribute to pull requests" permission in Azure DevOps settings:
1. Go to Project Settings > Repositories > Security.
2. Find the "Build Service" user (or the group associated with your pipeline).
3. Locate the "Contribute to pull requests" permission.
4. Change this permission to "Allow".

## Support

If you encounter issues not covered in this guide, please contact SCANOSS support for further assistance support@scanoss.com.
