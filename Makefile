.PHONY: build test

build:
	cd codescantask && npm install && npm run build
	./build/version.sh
	tfx extension create --manifest-globs vss-extension.json

test:
	cd codescantask && npm run test