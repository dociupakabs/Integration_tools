import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { fieldDefinitions } from './fieldsConfig';

function FieldMapping({ 
  field, 
  mappedColumn, 
  columns, 
  onColumnSelect, 
  previewData, 
  startRow,
  isAbsGenerated,
  setIsAbsGenerated,
  defaultValue,
  setDefaultValue,
  allMappings // We need to add this prop to check which columns are already selected
}) {
  const [showInfo, setShowInfo] = useState(false);
  const fieldInfo = fieldDefinitions[field];
  
  const getPreviewValues = () => {
    if (!mappedColumn || !previewData.length) return 'Brak przykładowych danych';
    const colIndex = parseInt(mappedColumn) - 1;
    const values = previewData.slice(0, 3).map(row => row[colIndex]).filter(Boolean);
    return values.join(', ');
  };

  // Check if a column is already mapped in another field
  const isColumnAlreadyMapped = (columnIndex) => {
    const columnValue = (columnIndex + 1).toString();
    // Return true if this column is mapped to another field (not this one)
    return Object.entries(allMappings).some(([mappedField, mappedCol]) => 
      mappedField !== field && mappedCol === columnValue
    );
  };

  // Format column name for display
  const formatColumnName = (col, idx) => {
    // If col is null, undefined or empty string, use generic column name
    if (col === null || col === undefined || col === '') {
      return `Kolumna ${idx}`;
    }
    
    // Convert to string and handle special cases like numbers, dates, etc.
    const colStr = String(col).trim();
    
    // If column name is empty after trimming, use generic name
    if (colStr === '') {
      return `Kolumna ${idx}`;
    }
    
    // If column name is very long, truncate it
    if (colStr.length > 50) {
      return colStr.substring(0, 47) + '...';
    }
    
    return colStr;
  };

  // Renderowanie specyficznych kontrolek dla różnych typów pól
  const renderSpecialControl = () => {
    if (fieldInfo.special === 'absGenerated') {
      return (
        <div className="flex items-center mt-2 ml-8">
          <input
            type="checkbox"
            id={`abs-${field}`}
            checked={isAbsGenerated}
            onChange={(e) => setIsAbsGenerated(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`abs-${field}`} className="text-sm text-gray-600">
            Generowane przez ABS
          </label>
        </div>
      );
    } else if (fieldInfo.special === 'defaultValue') {
      return (
        <div className="flex items-center mt-2 ml-8">
          <label className="text-sm text-gray-600 mr-2">
            Wartość domyślna:
          </label>
          <input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-16"
          />
        </div>
      );
    }
    return null;
  };

  // Czy pole jest aktualnie wymagane (uwzględniamy specjalne przypadki)
  const isCurrentlyRequired = fieldInfo.special === 'absGenerated' 
    ? fieldInfo.required && !isAbsGenerated
    : fieldInfo.required;

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border ${isCurrentlyRequired ? 'border-blue-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className={`font-medium ${isCurrentlyRequired ? 'text-blue-700' : 'text-gray-700'}`}>
            {field}
            {isCurrentlyRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button 
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-gray-600"
            title="Pokaż więcej informacji"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        <select
          value={mappedColumn || ''}
          onChange={(e) => onColumnSelect(field, e.target.value)}
          className={`p-2 border ${isCurrentlyRequired ? 'border-blue-300 focus:ring-blue-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md focus:ring-2`}
          disabled={fieldInfo.special === 'absGenerated' && isAbsGenerated}
        >
          <option value="">Wybierz kolumnę</option>
          {columns.map((col, idx) => {
            const isAlreadyMapped = isColumnAlreadyMapped(idx);
            const columnName = formatColumnName(col, idx);
            
            return (
              <option 
                key={idx} 
                value={idx + 1}
                className={isAlreadyMapped ? 'bg-gray-200 text-gray-500' : ''}
                style={{
                  backgroundColor: isAlreadyMapped ? '#f1f1f1' : '',
                  fontStyle: isAlreadyMapped ? 'italic' : '',
                  color: isAlreadyMapped ? '#999' : ''
                }}
              >
                {columnName}
                {isAlreadyMapped ? ' (już wybrana)' : ''}
              </option>
            );
          })}
        </select>
      </div>
      
      {/* Kontrolka specjalna (checkbox lub pole domyślne) */}
      {renderSpecialControl()}
      
      {showInfo && (
        <div className="mt-2 p-2 text-sm bg-gray-50 rounded-md">
          <p className="text-gray-700">{fieldInfo.description}</p>
          <p className="text-gray-500 mt-1">Typ danych: {fieldInfo.dataType}</p>
          <p className="text-gray-500">Wymagane: {fieldInfo.required ? 'Tak' : 'Nie'}</p>
        </div>
      )}
      
      {mappedColumn && (
        <div className="mt-2 text-sm text-gray-500 pl-8">
          Przykład: {getPreviewValues()}
        </div>
      )}
    </div>
  );
}

export default FieldMapping;