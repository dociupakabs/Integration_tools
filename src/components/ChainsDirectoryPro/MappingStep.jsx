import React, { useState } from 'react';
import FieldMapping from './FieldMapping';
import CopyButton from './CopyButton';
import { fieldOrder } from './fieldsConfig';
import { Save } from 'lucide-react';

const MappingStep = ({
  mappings,
  handleColumnSelect,
  headerRow,
  previewData,
  startRow,
  idKlsGenerated,
  setIdKlsGenerated,
  regionDefaultValue,
  setRegionDefaultValue,
  nipDefaultValue,
  setNipDefaultValue,
  idKrajDefaultValue,
  setIdKrajDefaultValue,
  xsltOutput,
  checkRequiredFieldsMapped,
  generateXSLT,
  onBack,
  // Parametry dla opcji walidacji
  worksheetNameValidation,
  setWorksheetNameValidation,
  headersValidation,
  setHeadersValidation
}) => {
  // Stan dla modalu z numerem zlecenia
  const [showOrderNumberModal, setShowOrderNumberModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderNumberError, setOrderNumberError] = useState('');

  // Funkcja do otwierania modalu
  const handleOpenSaveModal = () => {
    setOrderNumber('');
    setOrderNumberError('');
    setShowOrderNumberModal(true);
  };

  // Funkcja do zamykania modalu
  const handleCloseModal = () => {
    setShowOrderNumberModal(false);
  };

  // Funkcja do zapisywania XSLT jako pliku XML
  const handleSaveXSLT = () => {
    // Sprawdzenie czy wprowadzono numer zlecenia
    if (!orderNumber.trim()) {
      setOrderNumberError('Proszę podać numer zlecenia');
      return;
    }

    try {
      // Utworzenie zawartości pliku (kod XSLT)
      const blob = new Blob([xsltOutput], { type: 'application/xml' });
      
      // Utworzenie URL dla blob-a
      const url = URL.createObjectURL(blob);
      
      // Utworzenie elementu do pobrania pliku
      const a = document.createElement('a');
      a.href = url;
      a.download = `zlecenie_${orderNumber.trim()}.xml`;
      
      // Kliknięcie w element (pobranie pliku)
      document.body.appendChild(a);
      a.click();
      
      // Czyszczenie
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Zamknięcie modalu
      setShowOrderNumberModal(false);
    } catch (err) {
      console.error('Błąd podczas zapisywania pliku:', err);
      setOrderNumberError('Wystąpił błąd podczas zapisywania pliku');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Zmapuj pola:
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-700">
          Mapowanie korzysta z nagłówków z wiersza {startRow - 1}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Pola oznaczone <span className="text-red-500">*</span> są wymagane
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Kolumny już przypisane do innych pól są oznaczone kursywą i szarym tłem
        </p>
      </div>

      {/* Opcje walidacji */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Opcje walidacji:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="worksheet-validation"
              checked={worksheetNameValidation}
              onChange={(e) => setWorksheetNameValidation(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="worksheet-validation" className="text-sm text-gray-700">
              Walidacja nazwy arkusza
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="headers-validation"
              checked={headersValidation}
              onChange={(e) => setHeadersValidation(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="headers-validation" className="text-sm text-gray-700">
              Walidacja nagłówków
            </label>
          </div>
        </div>
        <p className="text-xs text-yellow-600 mt-2">
          Włączenie walidacji spowoduje dodanie do kodu XSLT mechanizmów sprawdzających 
          poprawność struktury importowanego pliku.
        </p>
      </div>

      <div className="space-y-4">
        {fieldOrder.map((field) => {
          // Przekazujemy specjalne parametry dla określonych pól
          const specialProps = {};
          
          if (field === 'ID_KLS') {
            specialProps.isAbsGenerated = idKlsGenerated;
            specialProps.setIsAbsGenerated = setIdKlsGenerated;
          } else if (field === 'REGION') {
            specialProps.defaultValue = regionDefaultValue;
            specialProps.setDefaultValue = setRegionDefaultValue;
          } else if (field === 'ID_KRAJ') {
            specialProps.defaultValue = idKrajDefaultValue;
            specialProps.setDefaultValue = setIdKrajDefaultValue;
          } else if (field === 'NIP') {
            specialProps.defaultValue = nipDefaultValue;
            specialProps.setDefaultValue = setNipDefaultValue;
          }
          
          return (
            <FieldMapping
              key={field}
              field={field}
              mappedColumn={mappings[field]}
              columns={headerRow}
              onColumnSelect={handleColumnSelect}
              previewData={previewData}
              startRow={startRow}
              allMappings={mappings} // Pass the entire mappings object
              {...specialProps}
            />
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Wygenerowany kod XSLT:
        </h3>
        <div className="relative">
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200 max-h-96 overflow-y-auto">
            {xsltOutput}
          </pre>
          {xsltOutput && <CopyButton text={xsltOutput} className="absolute top-4 right-4" />}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          onClick={onBack}
        >
          Wstecz
        </button>
        <div className="flex space-x-3">
          {xsltOutput && (
            <button
              onClick={handleOpenSaveModal}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
              title="Zapisz jako XML"
            >
              <Save className="w-5 h-5 mr-2" />
              Zapisz XML
            </button>
          )}
          <button
            className={`px-6 py-3 ${checkRequiredFieldsMapped() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'} text-white rounded-lg font-medium`}
            onClick={generateXSLT}
            disabled={!checkRequiredFieldsMapped()}
            title={!checkRequiredFieldsMapped() ? "Uzupełnij wszystkie wymagane pola" : ""}
          >
            Generuj XSLT
          </button>
        </div>
      </div>

      {/* Modal z numerem zlecenia */}
      {showOrderNumberModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Zapisz XSLT jako plik XML
            </h3>
            
            <div className="mb-4">
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Numer zlecenia:
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Wprowadź numer zlecenia"
              />
              {orderNumberError && (
                <p className="text-red-500 text-sm mt-1">{orderNumberError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Numer zlecenia zostanie użyty jako część nazwy pliku: zlecenie_[NUMER].xml
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveXSLT}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MappingStep;