import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, Check, Copy, Info, File } from 'lucide-react';
import * as XLSX from 'xlsx';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Kopiuj do schowka"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  );
};

// Function to detect file type
const detectFileType = (content) => {
  if (!content) return null;
  
  const lowerContent = content.toLowerCase();
  
  // Detect XSD schema
  if (lowerContent.includes('<xs:schema') || lowerContent.includes('<xsd:schema')) {
    return 'xsd';
  }
  
  // Default to XML
  return 'xml';
};

// Function to parse XML
const parseXML = (xmlText) => {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, "text/xml");
};

// Extract field information from uploaded documentation file
const extractFieldInfoFromDocumentation = (content) => {
  // This function will process content from uploaded documentation file
  // Format: table with columns for field name, description, type, required
  if (!content) return {};
  
  const fieldInfo = {};
  
  try {
    // For table formats like the ORD doc, look for rows with field names and descriptions
    const rows = content.split('\n');
    let currentField = null;
    let currentDesc = '';
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].trim();
      
      // Look for field name pattern - something in ** ** at the beginning of the line
      const fieldMatch = row.match(/^\|\s*\*\*([A-Z_]+)\*\*\s*\|/);
      if (fieldMatch) {
        // If we have a previous field with description, save it
        if (currentField && currentDesc) {
          fieldInfo[currentField] = currentDesc.trim();
        }
        
        // Start new field
        currentField = fieldMatch[1];
        currentDesc = '';
        
        // Extract description from the same line
        const descMatch = row.match(/\|\s*\*\*[A-Z_]+\*\*\s*\|\s*(.*?)\s*\|/);
        if (descMatch && descMatch[1]) {
          currentDesc = descMatch[1];
        }
      } 
      // If no field match but we have a current field, append to description
      else if (currentField && !row.startsWith('+--') && row.includes('|')) {
        const descPart = row.split('|')[2];
        if (descPart) {
          currentDesc += ' ' + descPart.trim();
        }
      }
    }
    
    // Don't forget to save the last field
    if (currentField && currentDesc) {
      fieldInfo[currentField] = currentDesc.trim();
    }
  } catch (err) {
    console.error("Error extracting field info from documentation:", err);
  }
  
  return fieldInfo;
};

// Function to parse XSD schema and extract field definitions
const parseXSDSchema = (xsdContent, documentationContent = null) => {
  try {
    // Extract field documentation from additional uploaded files if available
    const fieldDocumentation = documentationContent ? 
      extractFieldInfoFromDocumentation(documentationContent) : {};
    
    const xsdDoc = parseXML(xsdContent);
    
    if (xsdDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XSD schema");
    }
    
    // Extract namespace information
    const schemaElement = xsdDoc.documentElement;
    const xsNamespace = "http://www.w3.org/2001/XMLSchema";
    const hasTargetNamespace = schemaElement.hasAttribute("targetNamespace");
    
    console.log("Schema has target namespace:", hasTargetNamespace);
    
    // Find all attribute elements using namespace-aware methods
    const attributeNodes = [];
    
    // Method 1: Using getElementsByTagNameNS
    const attributesNS = xsdDoc.getElementsByTagNameNS(xsNamespace, "attribute");
    for (let i = 0; i < attributesNS.length; i++) {
      attributeNodes.push(attributesNS[i]);
    }
    
    // Method 2: As backup, try to find attributes using attribute selector
    if (attributeNodes.length === 0) {
      console.log("Using fallback attribute selector method");
      const allElements = xsdDoc.getElementsByTagName("*");
      for (let i = 0; i < allElements.length; i++) {
        const node = allElements[i];
        if (node.nodeName === "xs:attribute" || node.nodeName === "xsd:attribute") {
          attributeNodes.push(node);
        }
      }
    }
    
    console.log(`Found ${attributeNodes.length} attribute nodes`);
    
    // If still no attributes, try one more method
    if (attributeNodes.length === 0) {
      console.log("Using deeply nested search for attributes");
      // Look in element definitions for attributes
      const complexTypes = xsdDoc.getElementsByTagNameNS(xsNamespace, "complexType");
      for (let i = 0; i < complexTypes.length; i++) {
        const attrsInType = complexTypes[i].getElementsByTagNameNS(xsNamespace, "attribute");
        for (let j = 0; j < attrsInType.length; j++) {
          attributeNodes.push(attrsInType[j]);
        }
      }
    }
    
    const fields = [];
    
    // Process each attribute
    attributeNodes.forEach(attrNode => {
      const name = attrNode.getAttribute('name');
      if (!name) return; // Skip attributes without names
      
      // Get use (required or optional)
      const use = attrNode.getAttribute('use') || 'optional';
      const required = use === 'required';
      
      // Get type information
      let typeInfo = attrNode.getAttribute('type') || '';
      
      // Find restriction elements - need to handle namespace
      let simpleTypeElements = [];
      const childNodes = attrNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeName === "xs:simpleType" || 
            childNodes[i].nodeName === "xsd:simpleType" ||
            childNodes[i].localName === "simpleType") {
          simpleTypeElements.push(childNodes[i]);
        }
      }
      
      let restrictionInfo = '';
      
      if (simpleTypeElements.length > 0) {
        const simpleType = simpleTypeElements[0];
        let restrictionElements = [];
        
        // Find restriction elements
        const stChildNodes = simpleType.childNodes;
        for (let i = 0; i < stChildNodes.length; i++) {
          if (stChildNodes[i].nodeName === "xs:restriction" || 
              stChildNodes[i].nodeName === "xsd:restriction" ||
              stChildNodes[i].localName === "restriction") {
            restrictionElements.push(stChildNodes[i]);
          }
        }
        
        if (restrictionElements.length > 0) {
          const restriction = restrictionElements[0];
          const baseType = restriction.getAttribute('base') || '';
          if (baseType) typeInfo = baseType;
          
          // Find max/min length elements
          const rChildNodes = restriction.childNodes;
          
          let maxLength = null;
          let minLength = null;
          let pattern = null;
          
          for (let i = 0; i < rChildNodes.length; i++) {
            const nodeName = rChildNodes[i].nodeName;
            const localName = rChildNodes[i].localName;
            
            if (nodeName === "xs:maxLength" || nodeName === "xsd:maxLength" || localName === "maxLength") {
              maxLength = rChildNodes[i].getAttribute('value');
            } else if (nodeName === "xs:minLength" || nodeName === "xsd:minLength" || localName === "minLength") {
              minLength = rChildNodes[i].getAttribute('value');
            } else if (nodeName === "xs:pattern" || nodeName === "xsd:pattern" || localName === "pattern") {
              pattern = rChildNodes[i].getAttribute('value');
            }
          }
          
          if (maxLength) {
            restrictionInfo += `Max length: ${maxLength}`;
          }
          
          if (minLength) {
            restrictionInfo += restrictionInfo ? `, Min length: ${minLength}` : `Min length: ${minLength}`;
          }
          
          if (pattern) {
            restrictionInfo += restrictionInfo ? `, Pattern: ${pattern}` : `Pattern: ${pattern}`;
          }
        }
      }
      
      // Format the type string
      let formattedType = typeInfo;
      if (typeInfo.includes('string')) {
        formattedType = 'CHR';
        if (restrictionInfo.includes('Max length:')) {
          const match = restrictionInfo.match(/Max length: (\d+)/);
          if (match && match[1]) {
            formattedType += `(${match[1]})`;
          }
        }
      } else if (typeInfo.includes('decimal')) {
        formattedType = 'DEC';
        
        // Try to find totalDigits and fractionDigits in the schema
        // This is more complex with namespaces, so we'll search globally
        let totalDigits = null;
        let fractionDigits = null;
        
        // Find the simpleType element for this attribute if it exists
        const allSimpleTypes = xsdDoc.getElementsByTagNameNS(xsNamespace, "simpleType");
        for (let i = 0; i < allSimpleTypes.length; i++) {
          const typeName = allSimpleTypes[i].getAttribute("name");
          if (typeName && typeInfo.includes(typeName)) {
            // Found a matching simpleType, now look for totalDigits and fractionDigits
            const totalDigitsElements = allSimpleTypes[i].getElementsByTagNameNS(xsNamespace, "totalDigits");
            const fractionDigitsElements = allSimpleTypes[i].getElementsByTagNameNS(xsNamespace, "fractionDigits");
            
            if (totalDigitsElements.length > 0) {
              totalDigits = totalDigitsElements[0].getAttribute("value");
            }
            
            if (fractionDigitsElements.length > 0) {
              fractionDigits = fractionDigitsElements[0].getAttribute("value");
            }
          }
        }
        
        // If not found in a named type, try to look directly in the attribute's definition
        if (!totalDigits || !fractionDigits) {
          let restrictionElement = null;
          // Find restriction element for this attribute
          const allElements = xsdDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            const node = allElements[i];
            if ((node.nodeName === "xs:restriction" || node.nodeName === "xsd:restriction") && 
                node.getAttribute("base") && node.getAttribute("base").includes("decimal")) {
              // Try to check if this is related to our attribute
              let parent = node.parentNode;
              while (parent) {
                if ((parent.nodeName === "xs:attribute" || parent.nodeName === "xsd:attribute") && 
                    parent.getAttribute("name") === name) {
                  restrictionElement = node;
                  break;
                }
                parent = parent.parentNode;
              }
            }
          }
          
          if (restrictionElement) {
            const childNodes = restrictionElement.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
              const nodeName = childNodes[i].nodeName;
              if (nodeName === "xs:totalDigits" || nodeName === "xsd:totalDigits") {
                totalDigits = childNodes[i].getAttribute("value");
              } else if (nodeName === "xs:fractionDigits" || nodeName === "xsd:fractionDigits") {
                fractionDigits = childNodes[i].getAttribute("value");
              }
            }
          }
        }
        
        // Check for totalDigits/fractionDigits directly in the schema text as a last resort
        if (!totalDigits || !fractionDigits) {
          // Look for patterns like: <xs:totalDigits value="19">
          const totalDigitsMatch = xsdContent.match(new RegExp(`<xs:totalDigits\\s+value=["']([\\d]+)["']`, 'i'));
          const fractionDigitsMatch = xsdContent.match(new RegExp(`<xs:fractionDigits\\s+value=["']([\\d]+)["']`, 'i'));
          
          if (totalDigitsMatch && totalDigitsMatch[1]) {
            totalDigits = totalDigitsMatch[1];
          }
          
          if (fractionDigitsMatch && fractionDigitsMatch[1]) {
            fractionDigits = fractionDigitsMatch[1];
          }
        }
        
        if (totalDigits && fractionDigits) {
          formattedType += `(${totalDigits},${fractionDigits})`;
        }
      } else if (typeInfo.includes('integer')) {
        formattedType = 'INT';
      } else if (typeInfo.includes('date')) {
        formattedType = 'DATE';
      }
      
      // Look for documentation or annotation
      let description = '';
      
      // Use getElementsByTagNameNS to find annotations
      const annotations = [];
      const allAnnotations = xsdDoc.getElementsByTagNameNS(xsNamespace, "annotation");
      
      // Check if the annotation is a child of this attribute
      for (let i = 0; i < allAnnotations.length; i++) {
        let parent = allAnnotations[i].parentNode;
        if (parent === attrNode) {
          annotations.push(allAnnotations[i]);
          break;
        }
      }
      
      // If no annotations found as direct children, try another method
      if (annotations.length === 0) {
        const childNodes = attrNode.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          if (childNodes[i].nodeName === "xs:annotation" || 
              childNodes[i].nodeName === "xsd:annotation" ||
              childNodes[i].localName === "annotation") {
            annotations.push(childNodes[i]);
          }
        }
      }
      
      // Extract documentation from annotations
      if (annotations.length > 0) {
        const annotation = annotations[0];
        const documentationElements = annotation.getElementsByTagNameNS(xsNamespace, "documentation");
        
        if (documentationElements.length > 0) {
          description = documentationElements[0].textContent.trim();
        } else {
          // Try to find documentation elements directly
          const childNodes = annotation.childNodes;
          for (let i = 0; i < childNodes.length; i++) {
            if (childNodes[i].nodeName === "xs:documentation" || 
                childNodes[i].nodeName === "xsd:documentation" ||
                childNodes[i].localName === "documentation") {
              description = childNodes[i].textContent.trim();
              break;
            }
          }
        }
      }
      
      // If no description from schema, try to get it from external documentation if available
      if (!description && name && fieldDocumentation[name]) {
        description = fieldDocumentation[name];
      }
      
      // Add the field to the array
      fields.push({
        name,
        description: description || '',
        type: formattedType,
        required: required,
        restrictions: restrictionInfo
      });
    });
    
    return fields;
  } catch (error) {
    console.error('Error parsing XSD schema:', error);
    throw error;
  }
};

// Function to convert HTML to Excel
const convertHTMLToExcel = (htmlContent, fileName) => {
  try {
    // Create a temporary container to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extract the table from the HTML
    const table = tempDiv.querySelector('table');
    if (!table) {
      throw new Error('No table found in HTML content');
    }
    
    // Convert the table to a worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(table);
    
    // Apply some basic styling (column widths)
    const colWidths = [
      { wch: 20 }, // Name column
      { wch: 40 }, // Description column
      { wch: 15 }, // Type column
      { wch: 10 }  // Required column
    ];
    worksheet['!cols'] = colWidths;
    
    // Generate the Excel file and trigger download
    const outputFileName = `dokumentacja_${fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, outputFileName);
  } catch (error) {
    console.error('Error converting HTML to Excel:', error);
    throw error;
  }
};

const INTDocsMaker = () => {
  const [files, setFiles] = useState([]);
  const [fieldDefinitions, setFieldDefinitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docContent, setDocContent] = useState('');
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setFieldDefinitions([]);
    setHtmlContent('');
    setShowPreview(false);
    setDebugInfo('');
    
    try {
      setFileName(file.name);
      const content = await file.text();
      const fileType = detectFileType(content);
      
      if (fileType === 'xsd') {
        console.log('Processing XSD file:', file.name);
        
        // Pass the documentation content if available
        const fields = parseXSDSchema(content, docContent);
        console.log('Extracted fields:', fields.length);
        setFieldDefinitions(fields);
        
        // Add the file to the list
        setFiles([{
          name: file.name,
          type: fileType,
          content: content
        }]);
        
        if (fields.length === 0) {
          setDebugInfo('Nie znaleziono definicji pól w pliku. Sprawdź czy plik zawiera definicje atrybutów.');
        }
      } else {
        setError('Proszę załadować plik schematu XSD');
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Błąd przetwarzania pliku: ${err.message}`);
      setDebugInfo(`Szczegóły błędu: ${err.toString()}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDocFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setDocFile(file);
      const content = await file.text();
      setDocContent(content);
      
      setDebugInfo(`Załadowano dokumentację pomocniczą: ${file.name}`);
      
      // If we already have an XSD file loaded, reprocess it with the new documentation
      if (files.length > 0 && files[0].content) {
        setLoading(true);
        const fields = parseXSDSchema(files[0].content, content);
        setFieldDefinitions(fields);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error processing documentation file:', err);
      setDebugInfo(`Błąd przetwarzania pliku dokumentacji: ${err.message}`);
    }
  };
  
  const generateDocumentation = () => {
    if (fieldDefinitions.length === 0) {
      setError('Brak definicji pól do wygenerowania dokumentacji');
      return;
    }
    
    try {
      // Sort fields by required first, then by name
      const sortedFields = [...fieldDefinitions].sort((a, b) => {
        if (a.required !== b.required) {
          return b.required ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Generate HTML documentation
      const documentationHtml = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dokumentacja Schematu XSD</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .required {
            color: #e74c3c;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .metadata {
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #e9ecef;
          }
          .field-name {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dokumentacja Schematu XSD</h1>
          <div class="metadata">
            <p><strong>Plik źródłowy:</strong> ${files[0]?.name || 'Nieznany'}</p>
            <p><strong>Data wygenerowania:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Liczba pól:</strong> ${fieldDefinitions.length}</p>
            ${docFile ? `<p><strong>Dokumentacja pomocnicza:</strong> ${docFile.name}</p>` : ''}
          </div>
        </div>
        
        <h2>Tabela pól</h2>
        <table>
          <thead>
            <tr>
              <th>Nazwa pola</th>
              <th>Opis</th>
              <th>Typ danych</th>
              <th>Wymagane</th>
            </tr>
          </thead>
          <tbody>
            ${sortedFields.map(field => `
              <tr>
                <td class="field-name">${field.name}</td>
                <td>${field.description || '-'}</td>
                <td>${field.type || '-'}</td>
                <td>${field.required ? '<span class="required">Tak</span>' : 'Nie'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
      `;
      
      setHtmlContent(documentationHtml);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generating documentation:', err);
      setError(`Błąd generowania dokumentacji: ${err.message}`);
    }
  };
  
  const downloadExcel = () => {
    if (fieldDefinitions.length === 0) {
      setError('Brak definicji pól do wygenerowania dokumentacji');
      return;
    }
    
    try {
      // Generate HTML if not already generated
      if (!htmlContent) {
        generateDocumentation();
      }
      
      // Convert HTML to Excel and download
      convertHTMLToExcel(htmlContent || generateDocumentation(), fileName);
    } catch (err) {
      console.error('Error generating Excel:', err);
      setError(`Błąd generowania Excel: ${err.message}`);
    }
  };

  // Create a Word document
  const downloadWord = () => {
    if (fieldDefinitions.length === 0) {
      setError('Brak definicji pól do wygenerowania dokumentacji');
      return;
    }

    try {
      // Sort fields by required first, then by name
      const sortedFields = [...fieldDefinitions].sort((a, b) => {
        if (a.required !== b.required) {
          return b.required ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Create a simple HTML table for copy-paste into Word
      const tableHtml = `
      <html>
      <body>
        <h1>Dokumentacja Schematu XSD</h1>
        <p><strong>Plik źródłowy:</strong> ${files[0]?.name || 'Nieznany'}</p>
        <p><strong>Data wygenerowania:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Liczba pól:</strong> ${fieldDefinitions.length}</p>
        ${docFile ? `<p><strong>Dokumentacja pomocnicza:</strong> ${docFile.name}</p>` : ''}
        
        <h2>Tabela pól</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left;">Nazwa pola</th>
            <th style="padding: 8px; text-align: left;">Opis</th>
            <th style="padding: 8px; text-align: left;">Typ danych</th>
            <th style="padding: 8px; text-align: left;">Wymagane</th>
          </tr>
          ${sortedFields.map(field => `
            <tr>
              <td style="padding: 8px;"><strong>${field.name}</strong></td>
              <td style="padding: 8px;">${field.description || '-'}</td>
              <td style="padding: 8px;">${field.type || '-'}</td>
              <td style="padding: 8px;">${field.required ? '<span style="color: red; font-weight: bold;">Tak</span>' : 'Nie'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
      `;
      
      // Create a blob and download link
      const blob = new Blob([tableHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dokumentacja_${fileName.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating Word document:', err);
      setError(`Błąd generowania dokumentu HTML do Word: ${err.message}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-end">
            INT Docs Maker <span className="text-lg font-normal ml-2">V.2.1</span>
          </h1>
          <p className="text-sm text-gray-400">
            Generator dokumentacji ze schematów XSD w formie tabelki
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Załaduj pliki:</h2>
          
          {/* XSD File upload section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-600 mb-3">1. Plik schematu XSD (wymagany):</h3>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors bg-blue-50">
                <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <span className="block text-xl text-gray-600 mb-2">
                  Wybierz plik schematu XSD
                </span>
                <span className="text-sm text-gray-500">
                  Kliknij, aby wybrać plik XSD, z którego zostanie wygenerowana dokumentacja
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xsd,.xml" 
                  onChange={handleFileUpload} 
                />
              </div>
            </label>
          </div>
          
          {/* Documentation File upload section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-600 mb-3">2. Plik z opisami pól (opcjonalny):</h3>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-green-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors bg-green-50">
                <Upload className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <span className="block text-lg text-gray-600 mb-2">
                  Wybierz plik dokumentacji
                </span>
                <span className="text-sm text-gray-500">
                  Możesz załadować plik .docx lub .txt z opisami pól, aby wzbogacić dokumentację
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".docx,.txt,.doc" 
                  onChange={handleDocFileUpload} 
                />
              </div>
            </label>
            {docFile && (
              <div className="mt-2 text-sm text-green-600">
                <span className="font-medium">Załadowano:</span> {docFile.name}
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {/* Debug info for development */}
          {debugInfo && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
              <h4 className="font-medium">Informacje diagnostyczne:</h4>
              <p className="text-sm">{debugInfo}</p>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6 flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analizowanie schematu XSD...
            </div>
          )}
          
          {/* File info */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Załadowany plik:
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <File className="w-5 h-5 text-green-500" />
                  <span className="ml-3 font-medium text-gray-700">{files[0].name}</span>
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    XSD
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Fields summary */}
          {fieldDefinitions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Wykryte pola ({fieldDefinitions.length}):
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldDefinitions.slice(0, 9).map((field, index) => (
                    <div key={index} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                      <div className="font-medium text-blue-700">{field.name}</div>
                      <div className="text-sm text-gray-500">{field.type || 'Unknown type'}</div>
                      {field.required && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          Wymagane
                        </span>
                      )}
                    </div>
                  ))}
                  {fieldDefinitions.length > 9 && (
                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">
                        ...i {fieldDefinitions.length - 9} więcej pól
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              onClick={() => generateDocumentation()}
              disabled={fieldDefinitions.length === 0}
            >
              <FileText className="w-5 h-5 mr-2" />
              Generuj dokumentację HTML
            </button>
            
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              onClick={() => downloadExcel()}
              disabled={fieldDefinitions.length === 0}
            >
              <Download className="w-5 h-5 mr-2" />
              Pobierz jako Excel
            </button>
            
            <button
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              onClick={() => downloadWord()}
              disabled={fieldDefinitions.length === 0}
            >
              <FileText className="w-5 h-5 mr-2" />
              Pobierz jako HTML dla Word
            </button>
          </div>
          
          {/* Table preview directly embedded for simpler testing */}
          {fieldDefinitions.length > 0 && !showPreview && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Podgląd tabeli pól:
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                        Nazwa pola
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                        Opis
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r border-gray-300">
                        Typ danych
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        Wymagane
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fieldDefinitions.map((field, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                          {field.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-300">
                          {field.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300">
                          {field.type || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {field.required ? (
                            <span className="text-red-600 font-semibold">Tak</span>
                          ) : (
                            'Nie'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* HTML preview */}
        {showPreview && htmlContent && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-700">
                Podgląd dokumentacji:
              </h2>
              <div className="flex gap-2">
                <CopyButton text={htmlContent} />
                <button
                  onClick={() => downloadExcel()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Pobierz jako Excel"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                srcDoc={htmlContent}
                className="w-full"
                style={{ height: '600px' }}
                title="Podgląd dokumentacji"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default INTDocsMaker;