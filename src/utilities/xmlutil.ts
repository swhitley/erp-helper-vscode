const saxonJS = require('saxon-js');    

export class XmlUtil {

  public static getWorkersSample = `<?xml version="1.0" encoding="UTF-8"?>
<wd:Get_Workers_Request xmlns:wd="urn:com.workday/bsvc" wd:version="v39.1">
  <wd:Request_References wd:Ignore_Invalid_References="true" wd:Skip_Non_Existing_Instances="true">
    <wd:Worker_Reference>
      <wd:ID wd:type="Employee_ID">{Employee ID}</wd:ID>
    </wd:Worker_Reference>
  </wd:Request_References>
</wd:Get_Workers_Request>`;

  public static soapHeader = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:Envelope xmlns:xsd="http://schemas.xmlsoap.org/soap/envelope/">
  <xsd:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>{username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">{password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </xsd:Header>
  <env:Body xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">`;

  public static soapFooter = `</env:Body>
</xsd:Envelope>`;

  public static xsltTidy = `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" encoding="utf-8" indent="yes"/>
  <xsl:template match="/">
  <xsl:copy-of select="@*|node()"/>
  </xsl:template>
  </xsl:stylesheet>`;

  public async transform(xml: string, xslt: string) {
    
    var result = await saxonJS.XPath.evaluate(`transform(
      map {
          'source-node' : parse-xml-fragment($xml),
          'stylesheet-text' : $xslt,
          'delivery-format' : 'serialized'
          }
      )?output`,
      [],
      { params : {
          xml : xml,
          xslt : xslt
      }
    });

    return result;

  }
}