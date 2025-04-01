import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import FileSelectionStep from './components/ChainsDirectoryPro/FileSelectionStep';
import MappingStep from './components/ChainsDirectoryPro/MappingStep';
import { fieldDefinitions, fieldOrder } from './components/ChainsDirectoryPro/fieldsConfig';

const ChainsDirectoryPro = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheets, setSheets] = useState([]);
  const [startRow, setStartRow] = useState(1);
  const [previewData, setPreviewData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [headerRow, setHeaderRow] = useState([]);
  const [xsltOutput, setXsltOutput] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Stan dla specjalnych zachowań pól
  const [idKlsGenerated, setIdKlsGenerated] = useState(false);
  const [regionDefaultValue, setRegionDefaultValue] = useState('-');
  const [idKrajDefaultValue, setIdKrajDefaultValue] = useState('PL');
  const [nipDefaultValue, setNipDefaultValue] = useState('');
  
  // Zaktualizowana lista pól w mappings
  const [mappings, setMappings] = useState({
    ID_KLS: '',
    REGION: '',
    NAZWA: '',
    SKROT: '',
    ID_KRAJ: '',
    NIP: '',
    KOD: '',
    MIASTO: '',
    ULICA: '',
    NR_LOK: '',
    DATA_OD: '',
    DATA_DO: '',
    POWIERZCHNIA: '',
    LICZBA_KAS: '',
    TELEFON: '',
    EMAIL: '',
    KATEGORIA: '',
    TYP_SKLEPU: '',
    KLASYFIKACJA: '',
    REGAL_CHLODNICZY: '',
    LADA_MIESNA: ''
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Zapisujemy nazwę pliku
      setFileName(file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });
      
      setSheets(workbook.SheetNames);
      setSelectedSheet(workbook.SheetNames[0]);
      setFileData(workbook);
      loadSheetData(workbook, workbook.SheetNames[0]);
    }
  };

  const loadSheetData = (workbook, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    setAllData(data);
    
    // Update the preview data and header row based on the current startRow
    updatePreviewAndHeader(data, startRow);
  };

  // Separate function to update preview and header based on startRow
  const updatePreviewAndHeader = (data, row) => {
    if (!data || data.length === 0) return;
    
    // Set header row to be the row just before the start row
    const headerRowIndex = row - 1;
    const headerData = headerRowIndex >= 0 && headerRowIndex < data.length 
      ? data[headerRowIndex] 
      : data[0].map((_, idx) => `Kolumna ${idx + 1}`);
    
    setHeaderRow(headerData);
    
    // Set preview data to be rows starting from startRow
    const previewRows = data.slice(row);
    setPreviewData(previewRows);
  };

  // Effect to update preview when startRow changes
  useEffect(() => {
    if (allData.length > 0) {
      updatePreviewAndHeader(allData, startRow);
    }
  }, [startRow]);

  const handleStartRowChange = (value) => {
    const newStartRow = parseInt(value) || 1;
    setStartRow(newStartRow);
  };

  const handleColumnSelect = (field, column) => {
    setMappings(prev => ({
      ...prev,
      [field]: column
    }));
  };

  // Funkcja sprawdzająca, czy wszystkie wymagane pola są zmapowane
  const checkRequiredFieldsMapped = () => {
    return fieldOrder
      .filter(field => {
        // Najpierw sprawdzamy, czy pole jest zdefiniowane w fieldDefinitions
        if (!fieldDefinitions[field]) {
          console.warn(`Pole ${field} nie jest zdefiniowane w fieldDefinitions`);
          return false; // Nie traktujemy niezdefiniowanych pól jako wymagane
        }
        
        // Specjalne traktowanie pola ID_KLS
        if (field === 'ID_KLS' && idKlsGenerated) {
          return false;
        }
        
        return fieldDefinitions[field].required;
      })
      .every(field => 
        mappings[field] || 
        (field === 'REGION' && regionDefaultValue) || 
        (field === 'ID_KRAJ' && idKrajDefaultValue) ||
        (field === 'NIP' && nipDefaultValue)        // Dodane
      );
  };

  const generateXSLT = () => {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    const fileNameDisplay = fileName || 'Nieznany plik';
    
    const xslt = `<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="2.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:meta="http://anicasystem.com.pl/XMLSchema/meta"
    xmlns:expr="http://assecobs.com/extensions/expression"
    xmlns:xs="http://www.w3.org/2001/XMLSchema">

    <!--Wygenerowano przez: ChainsDirectory PRO V.0.4-->
    <!--Źródło danych: ${fileNameDisplay}-->
    <!--Data generowania: ${timestamp}-->

    <xsl:template match="/">
        <xsl:element name="meta:document">
            <xsl:element name="meta:message">
                <xsl:for-each select="document/message/worksheet[@name='${selectedSheet}']/row[@id > ${startRow} and string-length(cell[@id = '1']) > 0]">
                    <xsl:element name="meta:kls">
                        ${Object.entries(mappings)
                          .filter(([field, column]) => {
                            // Pomijamy ID_KLS jeśli jest zaznaczone "Generowane przez ABS"
                            if (field === 'ID_KLS' && idKlsGenerated) {
                              return false;
                            }
                            return column || 
                                  (field === 'REGION' && regionDefaultValue) || 
                                  (field === 'ID_KRAJ' && idKrajDefaultValue) ||
                                  (field === 'NIP' && nipDefaultValue);    // Dodane
                          })
                          .map(([field, column]) => {
                            // Specjalne traktowanie dla pola REGION
                            if (field === 'REGION') {
                              return `
                        <xsl:attribute name="REGION">
                            <xsl:choose>
                                <xsl:when test="string-length(cell[@id = '${column}']) > 0">
                                    <xsl:value-of select="cell[@id = '${column}']"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:value-of select="'${regionDefaultValue}'"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>`;
                      } else if (field === 'NIP') {
                        if (column) {
                            // Jeśli wybrano kolumnę, używamy zaawansowanej logiki przetwarzania NIP
                            return `
                        <xsl:attribute name="NIP">
                            <xsl:choose>
                                <!-- Sprawdza czy pole jest puste -->
                                <xsl:when test="string-length(cell[@id = '${column}']) = 0">
                                    <xsl:value-of select="'${nipDefaultValue || '0000000000'}'" />
                                </xsl:when>
                                <!-- Główna logika przetwarzania -->
                                <xsl:otherwise>
                                    <xsl:variable name="rawNip" select="cell[@id = '${column}']" />
                                    <xsl:variable name="cleanNip" select="normalize-space(replace($rawNip, '[^0-9]', ''))" />
                                    
                                    <xsl:choose>
                                        <!-- Obsługa wartości z notacją naukową -->
                                        <xsl:when test="contains($rawNip, 'E')">
                                            <xsl:value-of select="format-number($rawNip, '0')" />
                                        </xsl:when>
                                        <!-- Obsługa wartości numerycznych -->
                                        <xsl:when test="$cleanNip castable as xs:decimal">
                                            <xsl:value-of select="format-number(number($cleanNip), '0')" />
                                        </xsl:when>
                                        <!-- Obsługa wartości nieliczbowych po oczyszczeniu -->
                                        <xsl:otherwise>
                                            <xsl:value-of select="$cleanNip" />
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>`;
                        } else {
                            // Jeśli nie wybrano kolumny, używamy bezpośrednio wartości domyślnej
                            return `
                        <xsl:attribute name="NIP" select="'${nipDefaultValue || '0000000000'}'"/>`;
                        }
                    } else if (field === 'ID_KRAJ') {
                              // Specjalne traktowanie dla pola ID_KRAJ
                              return `
                        <xsl:attribute name="ID_KRAJ">
                            <xsl:choose>
                                <xsl:when test="string-length(cell[@id = '${column}']) > 0">
                                    <xsl:value-of select="cell[@id = '${column}']"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:value-of select="'${idKrajDefaultValue}'"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>`;
                            } else if (field === 'KOD') {
                              return `
                        <xsl:attribute name="KOD">
                            <xsl:choose>
                                <xsl:when test="cell[@id = '${column}'] castable as xs:decimal">
                                    <xsl:value-of select="format-number(cell[@id = '${column}'], '00000')"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:value-of select="replace(cell[@id = '${column}'], '-', '')"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:attribute>`;
                            } else {
                              return `
                        <xsl:attribute name="${field}" select="cell[@id = '${column}']"/>`;
                            }
                          })
                          .join('')}
                    </xsl:element>
                </xsl:for-each>
            </xsl:element>
        </xsl:element>
    </xsl:template>
</xsl:stylesheet>`;
    
    setXsltOutput(xslt);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-end">
            ChainsDirectory PRO <span className="text-lg font-normal ml-2">V.0.4</span>
          </h1>
          <p className="text-sm text-gray-400">
            by dociupak
          </p>
        </div>

        {currentStep === 0 ? (
          <FileSelectionStep 
            fileData={fileData}
            handleFileUpload={handleFileUpload}
            sheets={sheets}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            startRow={startRow}
            handleStartRowChange={handleStartRowChange}
            allData={allData}
            loadSheetData={loadSheetData}
            onNext={() => setCurrentStep(1)}
          />
        ) : (
          <MappingStep 
            mappings={mappings}
            handleColumnSelect={handleColumnSelect}
            headerRow={headerRow}
            previewData={previewData}
            startRow={startRow}
            idKlsGenerated={idKlsGenerated}
            setIdKlsGenerated={setIdKlsGenerated}
            nipDefaultValue={nipDefaultValue}
            setNipDefaultValue={setNipDefaultValue}
            regionDefaultValue={regionDefaultValue}
            setRegionDefaultValue={setRegionDefaultValue}
            idKrajDefaultValue={idKrajDefaultValue}
            setIdKrajDefaultValue={setIdKrajDefaultValue}
            xsltOutput={xsltOutput}
            checkRequiredFieldsMapped={checkRequiredFieldsMapped}
            generateXSLT={generateXSLT}
            onBack={() => setCurrentStep(0)}
          />
        )}
      </div>
      </div>
  );
};

export default ChainsDirectoryPro;