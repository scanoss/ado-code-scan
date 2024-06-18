.PHONY: build test upgrade_version package install


install:
	cd codescantask && npm install

upgrade_version:
	./tools/version.sh

build:install
	cd codescantask && npm run build

package:build
	tfx extension create --manifest-globs vss-extension.json vss

test:
	cd codescantask && npm run test