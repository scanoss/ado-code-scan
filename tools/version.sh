#!/bin/bash

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is required but not installed. Please install jq and try again."
    exit 1
fi

export dir=$(dirname "$0")

# Path to your files
TASK_JSON="${dir}/../codescantask/task.json"
PACKAGE_JSON="${dir}/../codescantask/package.json"

if [ "$1" == "dev" ]; then
    # Use the dev version of the VSS_EXTENSION_JSON file
    VSS_EXTENSION_JSON="${dir}/../vss-extension-dev.json"
else
    # Use the default VSS_EXTENSION_JSON file
    VSS_EXTENSION_JSON="${dir}/../vss-extension.json"
fi


# Extract the version from package.json
VERSION=$(jq -r '.version' "$PACKAGE_JSON")

# Check if jq was able to parse the version correctly
if [ -z "$VERSION" ]; then
  echo "Failed to extract version from $PACKAGE_JSON"
  exit 1
fi

echo "Extracted version: $VERSION"

# Split the version into major, minor, and patch components
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Update the version in task.json
jq --arg major "$MAJOR" --arg minor "$MINOR" --arg patch "$PATCH" \
  '.version.Major = ($major | tonumber) | .version.Minor = ($minor | tonumber) | .version.Patch = ($patch | tonumber)' \
  "$TASK_JSON" > tmp.$$.json && mv tmp.$$.json "$TASK_JSON"

# Update the version in vss-extension.json
jq --arg version "$VERSION" '.version = $version' "$VSS_EXTENSION_JSON" > tmp.$$.json && mv tmp.$$.json "$VSS_EXTENSION_JSON"

echo "Updated version in $TASK_JSON and $VSS_EXTENSION_JSON"