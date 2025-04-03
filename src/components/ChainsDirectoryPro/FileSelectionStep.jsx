import React from 'react';
import { Upload } from 'lucide-react';

const FileSelectionStep = ({ 
  fileData, 
  handleFileUpload, 
  sheets, 
  selectedSheet, 
  setSelectedSheet, 
  startRow, 
  handleStartRowChange, 
  allData, 
  loadSheetData, 
  onNext 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Wybór pliku</h2>
      
      <div className="mb-8">
        <label className="block w-full">
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-blue-50">
            <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <span className="block text-lg text-gray-600 mb-2">Wybierz plik Excel</span>
            <span className="text-sm text-gray-500">
              {fileData ? "Plik wybrany" : "Nie wybrano pliku"}
            </span>
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </div>
        </label>
      </div>

      {sheets.length > 0 && (
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Wybierz arkusz:
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSheet}
              onChange={(e) => {
                setSelectedSheet(e.target.value);
                loadSheetData(fileData, e.target.value);
              }}
            >
              {sheets.map(sheet => (
                <option key={sheet} value={sheet}>{sheet}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Wiersz z nagłówkami:
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                value={startRow - 1}
                onChange={(e) => handleStartRowChange(parseInt(e.target.value) + 1)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              />
              <span className="text-sm text-gray-500">
                (Pierwszy wiersz = 1)
              </span>
            </div>
          </div>
        </div>
      )}

      {allData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Podgląd danych:
          </h3>
          
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-700">
              Wiersz <span className="font-bold">{startRow}</span> będzie użyty jako wiersz z nagłówkami
            </p>
            <p className="text-sm font-medium text-yellow-700 mt-1">
              Dane będą przetwarzane od wiersza <span className="font-bold">{startRow + 1}</span>
            </p>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {allData.slice(Math.max(0, startRow - 3), startRow + 5).map((row, idx) => {
                  const rowIndex = Math.max(0, startRow - 3) + idx;
                  return (
                    <tr 
                      key={idx} 
                      className={`${rowIndex === startRow - 1 ? 'bg-blue-50 border-y border-blue-300' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-700 border-r border-gray-200">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, cellIdx) => (
                        <td 
                          key={cellIdx} 
                          className={`px-4 py-3 whitespace-nowrap text-sm ${
                            rowIndex === startRow - 1 ? 'text-blue-800 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {cell?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {startRow <= allData.length && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Dane:</span> od wiersza {startRow}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nagłówki:</span> wiersz {startRow - 1}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={onNext}
          disabled={!fileData}
        >
          Dalej
        </button>
      </div>
    </div>
  );
};

export default FileSelectionStep;