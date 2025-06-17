### Undeclared components
 | Component | Version | License | 
 | - | - | - | 
 | pkg:github/scanoss/wfp | 6afc1f6 | GPL-2.0-only | 
 | pkg:github/scanoss/scanner.c | 1.3.3 | GPL-2.0-only | 


2 undeclared component(s) were found.
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
      }
    ]
  }
}
```

