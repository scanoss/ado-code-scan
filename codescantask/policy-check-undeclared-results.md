### Undeclared components 
 
   |  Component | Version | License  |                                      
   | - | - | - |       
   | pkg:github/scanoss/wfp | 6afc1f6 | Zlib - GPL-2.0-only | 
 | pkg:github/scanoss/scanner.c | 1.3.3 | BSD-2-Clause | 
 | pkg:github/scanoss/engine | 4.0.4 | GPL-2.0-or-later - GPL-1.0-or-later - GPL-2.0-only |        
  #### Add the following snippet into your `sbom.json` file 
 ```json 
 {
  "components": [
    {
      "purl": "pkg:github/scanoss/wfp"
    },
    {
      "purl": "pkg:github/scanoss/scanner.c"
    },
    {
      "purl": "pkg:github/scanoss/engine"
    }
  ]
} 
 ```