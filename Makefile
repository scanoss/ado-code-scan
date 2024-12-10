.PHONY: build test .upgrade_version_dev upgrade_version package package_dev install package_dev_mac_arm64


install:
	cd codescantask && npm install

.upgrade_version_dev:
	./tools/version.sh dev

upgrade_version:
	./tools/version.sh

build:install
	cd codescantask && npm run build

package:build
	tfx extension create --manifest-globs vss-extension.json vss

package_dev:.upgrade_version_dev build
	tfx extension create --manifest-globs vss-extension-dev.json vss

package_dev_mac_arm64:package_dev
	@LATEST_VSIX=$$(ls -t *.vsix | head -1); \
	echo "Processing $$LATEST_VSIX..."; \
	TMPDIR=$$(mktemp -d); \
	ORIGINAL_DIR=$$(pwd); \
	unzip -q "$$LATEST_VSIX" -d "$$TMPDIR"; \
	sed -i '' 's/arm64):&#x9;//g' "$$TMPDIR/[Content_Types].xml"; \
	cd "$$TMPDIR" && zip -q -r "$$ORIGINAL_DIR/$$LATEST_VSIX.fixed" .; \
	cd "$$ORIGINAL_DIR"; \
	mv "$$LATEST_VSIX.fixed" "$$LATEST_VSIX"; \
	rm -rf "$$TMPDIR"; \
	echo "Fixed ContentType in $$LATEST_VSIX"

test:
	cd codescantask && npm run test