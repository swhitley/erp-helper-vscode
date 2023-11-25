# ERP Helper for VS Code

**ERP Helper (VS Code)** is a [Visual Studio Code]([https://code.visualstudio.com/) extension with a set of utilities for developing ERP integrations. It includes XSL transformation and Workday® API SOAP calls.

## How to install

Install ERP Helper from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=WhitleyMedia.erp-helper).

## Features

* XSLT Transformation with Saxon-HE
* Web Service sample SOAP request generator
* Workday API Connector
* WQL Notebooks (WQLBook)

### How to use

From any open editor, right-click (Windows) or control-click (Mac) and locate <i>ERP Helper</i> on the context menu.

### XML Transformations (XSLT)
To perform the most common function (XML transformation with XSLT) follow these instructions:
1. Open the XML document in an editor window.
2. Open the XSLT document in an editor window to the right of the XML document (as shown in the image below). 
   To ensure that your final output is formatted correctly, include an output element with the indent attribute in your XSLT: <code><xsl:output method="xml" indent="yes" /></code>
3. Right-click or control-click to reveal the context menu.  Select <i>ERP Helper</i> > <i>Transform (XSLT)</i>.
4. The transformed document will open in a new window.

##   

![Transform (XSLT)](images/erp-helper-screenshot-1.png)

## Authentication
ERP Helper supports OAuth 2.0 and Basic Authentication. Authentication is required when using the API Calls page.

For OAuth, you must use the Register API Client task in your Workday tenant.  See the example below for OAuth settings.  The Redirection URI is `vscode://WhitleyMedia.erp-helper`.

![image](https://github.com/swhitley/erp-helper-vscode/assets/413552/572d237c-8493-4f0d-8f8d-2d4030062c66)

## WQL Books
ERP Helper enables WQL query execution using a file type called `wqlbook`.  Create a file with the .wqlbook extension. Features are automatically enabled.
* The last selected connection on the ERP Helper **Connections** page is used for the API connection.  Make sure you have OAuth configured.  You will need to update your access token regularly.
* To switch connections or update your access token, right-click in the `Code` area and select ERP Helper -> Connections from the menu.
* WQLBooks support JSON and HTML views.  Switch output views by clicking the elipses (...) next to the output cell and then select `Change Presentation`.
* **IMPORTANT**: A WQLBook is a file that can be saved and shared with other users. The displayed data will also be shared as part of the file.  Clear the output cell and save the file before sharing if you do not wish to share the data.

<img width="578" alt="image" src="https://github.com/swhitley/erp-helper-vscode/assets/413552/82853270-80dd-47a6-ac2a-cb513a8fd6f7">

### WQL Book Commands
**OUTPUT HTML** - Use the `OUTPUT HTML` command in a code cell to change the output so that it defaults to HTML.  Example:  `SELECT lastName FROM allWorkers; OUTPUT HTML`

**LIST {list name} {opt: 'output'}** - Use the list command in a markup cell (not within the WQL code cell).  Build a list of items that can be converted into a WQL "in" list.  The list command has one mandatory parameter and one optional parameter.

**LIST {list name}** - The `list name` is required if the list should be used in a WQL query. The `list name` must match the replacement text in the query. Surrounding braces are used in the query to identify the replacement text.

**LIST {list name} output** - The `output` parameter alters the output of the WQL query.  The output is based on the key values in the list.  A lookup is performed in the query for each key, and the associated value will be returned in the output list.

**Example:**

WQL Code: 

`SELECT name as key, referenceID1 as value FROM supervisoryOrganizations WHERE name in {list1}`

LIST Text:

<code>LIST list1 output
Human Resources
Finance & Administration
Information Technology
Operations
Risk Management
Accounting Operations
Financial Planning & Analysis
SEC Reporting
Planning & Analysis
Accounts Receivable
Accounts Payable</code>

1. As the query is executed, the `{list1}` replacement text in the WQL query will be replaced by the unique values in a WQL list:  `('Human Resources', 'Finance & Administration',...)`
2. The query will return the names and associated reference ids.  The labels `key` and `value` in the query are critical for output list matching.
3. Due to the `output` LIST parameter, the resulting output will contain the translated values from the LIST (the reference ids of the matching supervisory organizations).

Output:

<code>Human_Resources_supervisory
Finance_Administration_supervisory
Information_Technology_supervisory
Operations_supervisory
Risk_Management_supervisory
Accounting_Operations_supervisory
Financial_Planning_supervisory
SEC_Reporting_supervisory
Planning_Analysis_supervisory
Accounts_Receivable_supervisory
Accounts_Payable_supervisory</code>


## Extension Settings

This extension contributes the following settings:

* `erp-helper.webServiceSelected`: Most recent Web Service selection under Web Services.
* `erp-helper.webOperationSelected`: Most recent Web Operation selection under Web Services.
* `erp-helper.connectionSelected`: Most recent Connection selection under Connections.
* `erp-helper.connectionList`: Workday tenant connection information.  Passwords are saved in secret storage.

## Credits

ERP Helper is compatible with Workday®
It is not sponsored, affiliated with, or endorsed by Workday.

- Stormloop Technologies
  - Thank you to Stormloop Technologies for sponsoring the development of ERP Helper. Please check out their service offerings.
  - https://www.stormlooptech.com/

- Saxon - HE
  - https://licenses.nuget.org/MPL-2.0
  - https://www.saxonica.com/

- Axios
  - https://github.com/axios/axios/blob/v1.x/LICENSE
  - https://github.com/axios/axios

- Cheerio
  - https://github.com/cheeriojs/cheerio/blob/main/LICENSE
  - https://github.com/cheeriojs/cheerio
