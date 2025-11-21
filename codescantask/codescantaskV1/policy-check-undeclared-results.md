### Undeclared components
 | Component | License | 
 | - | - | 
 | pkg:github/scanoss/wfp | GPL-2.0-only | 
 | pkg:github/scanoss/scanner.c | GPL-2.0-only | 


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

