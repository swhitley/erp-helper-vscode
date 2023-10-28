"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlUtil = void 0;
const saxonJS = require('saxon-js');
class XmlUtil {
    transform(xml, xslt) {
        return __awaiter(this, void 0, void 0, function* () {
            var result = yield saxonJS.XPath.evaluate(`transform(
      map {
          'source-node' : parse-xml-fragment($xml),
          'stylesheet-text' : $xslt,
          'delivery-format' : 'serialized'
          }
      )?output`, [], { params: {
                    xml: xml,
                    xslt: xslt
                }
            });
            return result;
        });
    }
    declarationRemove(xml) {
        // Remove an existing XML declaration.
        const declIndex = xml.indexOf("?>");
        if (declIndex > 0) {
            xml = xml.substring(declIndex + 2);
        }
        return xml;
    }
}
exports.XmlUtil = XmlUtil;
XmlUtil.styleSheetStart = `<?xml version="1.0" encoding="UTF-8"?>
  <xsl:stylesheet xmlns:wd="urn:com.workday/bsvc" version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <!-- Helpers:  
  <xsl:value-of select="" /> 
  <xsl:param name="" select="" /> 
  <xsl:variable name="" select="" />
  <xsl:value-of select="format-date(current-date(), '[Y0001]-[M01]-[D01]')" />
  -->
    <xsl:output method="xml" indent="yes"/>
    <xsl:template match="/">
      <env:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
        <env:Body>
          <xsl:for-each select="wd:Report_Data/wd:Report_Entry">`;
XmlUtil.styleSheetEnd = `        </xsl:for-each>
      </env:Body>
    </env:Envelope>
  </xsl:template>
</xsl:stylesheet>`;
XmlUtil.getWorkersSample = `<?xml version="1.0" encoding="UTF-8"?>
<wd:Get_Workers_Request xmlns:wd="urn:com.workday/bsvc" wd:version="v40.2">
  <wd:Request_References wd:Ignore_Invalid_References="true" wd:Skip_Non_Existing_Instances="true">
    <wd:Worker_Reference>
      <wd:ID wd:type="Employee_ID">{Employee ID}</wd:ID>
    </wd:Worker_Reference>
  </wd:Request_References>
</wd:Get_Workers_Request>`;
XmlUtil.soapStart = `<?xml version="1.0" encoding="UTF-8"?>
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
XmlUtil.soapEnd = `</env:Body>
</xsd:Envelope>`;
XmlUtil.xsltTidy = `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" encoding="utf-8" indent="yes"/>
  <xsl:template match="/">
  <xsl:copy-of select="@*|node()"/>
  </xsl:template>
  </xsl:stylesheet>`;
