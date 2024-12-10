### Undeclared components
 | Component | Version | License | 
 | - | - | - | 
 | pkg:github/scanoss/wfp | 6afc1f6 | Zlib - GPL-2.0-only | 
 | pkg:github/scanoss/scanner.c | 1.3.3 | BSD-2-Clause - GPL-2.0-only | 
 | pkg:npm/%40grpc/grpc-js | 1.12.2 | Apache-2.0 | 
 | pkg:npm/abort-controller | 3.0.0 | MIT | 
 | pkg:npm/adm-zip | 0.5.16 | MIT | 


5 undeclared component(s) were found.
Add the following snippet into your `scanoss.json` file

```json
{
  "bom": {
    "include": [
      {
        "purl": "pkg:github/scanoss/wfp"
      },
      {
        "purl": "pkg:github/scanoss/scanner.c"
      },
      {
        "purl": "pkg:npm/%40grpc/grpc-js"
      },
      {
        "purl": "pkg:npm/abort-controller"
      },
      {
        "purl": "pkg:npm/adm-zip"
      }
    ]
  }
}
```

