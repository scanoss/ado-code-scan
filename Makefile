.PHONY: build

build:
	cd codescantask && npm run build
	./build/version.sh
	tfx extension create --manifest-globs vss-extension.json