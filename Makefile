.PHONY: build test upgrade_version package

upgrade_version:
	./tools/version.sh

build:
	cd codescantask && npm install && npm run build

package:build
	tfx extension create --manifest-globs vss-extension.json

test:
	cd codescantask && npm run test