# ERP Helper for VS Code

 Utilities for developing ERP integrations. Includes XSL transformation and Workday® API SOAP calls. 

## Features

* XSLT Transformation with Saxon-HE
* Web Service sample SOAP request generator
* Workday API Connector


![Transform (XSLT)](images/erp-helper-screenshot-1.png)


## Extension Settings

This extension contributes the following settings:

* `erp-helper.webServiceSelected`: Most recent Web Service selection under Web Services.
* `erp-helper.webOperationSelected`: Most recent Web Operation selection under Web Services.
* `erp-helper.connectionSelected`: Most recent Connection selection under Connections.
* `erp-helper.connectionList`: Workday tenant connection information.  Passwords are saved in secret storage.


## Release Notes

### 1.0.0

Initial release

## Credits

ERP Helper is compatible with Workday®
It is not sponsored, affiliated with, or endorsed by Workday.

- Saxon - HE
  - https://licenses.nuget.org/MPL-2.0
  - https://www.saxonica.com/

- Axios
  - https://github.com/axios/axios/blob/v1.x/LICENSE
  - https://github.com/axios/axios

- Cheerio
  - https://github.com/cheeriojs/cheerio/blob/main/LICENSE
  - https://github.com/cheeriojs/cheerio
