#!/bin/bash

export dir=$(dirname "$0")
# Path to your files
TASK_JSON="${dir}/codescantask/task.json"
PACKAGE_JSON="${dir}/codescantask/package.json"
VSS_EXTENSION_JSON="${dir}/vss-extension.json"

# Extract the version from task.json
VERSION=$(jq -r '.version | "\(.Major).\(.Minor).\(.Patch)"' "$TASK_JSON")

# Check if jq was able to parse the version correctly
if [ -z "$VERSION" ]; then
  echo "Failed to extract version from $TASK_JSON"
  exit 1
fi

echo "Extracted version: $VERSION"

# Update the version in package.json
jq --arg version "$VERSION" '.version = $version' "$PACKAGE_JSON" > tmp.$$.json && mv tmp.$$.json "$PACKAGE_JSON"

# Update the version in vss-extension.json
jq --arg version "$VERSION" '.version = $version' "$VSS_EXTENSION_JSON" > tmp.$$.json && mv tmp.$$.json "$VSS_EXTENSION_JSON"

echo "Updated version in $PACKAGE_JSON and $VSS_EXTENSION_JSON"