.PHONY: build test upgrade_version_dev upgrade_version package package_dev install


install:
	cd codescantask && npm install

upgrade_version_dev:
	./tools/version.sh dev

upgrade_version:
	./tools/version.sh

build:install
	cd codescantask && npm run build

package:build
	tfx extension create --manifest-globs vss-extension.json vss

package_dev:build
	tfx extension create --manifest-globs vss-extension-dev.json vss


test:
	cd codescantask && npm run test