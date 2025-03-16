export const fieldDefinitions = {
    ID_KLS: { 
      description: 'Unikalny identyfikator klienta (punktu sieci) wg notacji obowiązującej w sieci.', 
      dataType: 'CHR(50)', 
      required: true,
      special: 'absGenerated' // specjalne oznaczenie dla ID_KLS
    },
    REGION: { 
      description: 'Nazwa regionalnej grupy sklepów w ramach sieci.', 
      dataType: 'CHR(100)', 
      required: true,
      special: 'defaultValue', // specjalne oznaczenie dla REGION
      defaultValue: '-'
    },
    NAZWA: { 
      description: 'Nazwa długa sklepu wg sieci', 
      dataType: 'CHR(100)', 
      required: true 
    },
    SKROT: { 
      description: 'Skrócona/dodatkowa nazwa sklepu', 
      dataType: 'CHR(100)', 
      required: false 
    },
    ID_KRAJ: { 
      description: 'Dwuliterowy kod państwa alfa-2 zgodny ze standardem ISO-3166-1, np.: PL - Polska, FR - Francja, DE - Niemcy', 
      dataType: 'CHR(2)', 
      required: true,
      special: 'defaultValue', // dodane specjalne oznaczenie dla ID_KRAJ
      defaultValue: 'PL'
    },
    NIP: { 
        description: 'NIP sklepu – dla Polski 10 znaków bez kresek.', 
        dataType: 'CHR(30)', 
        required: true,
        special: 'defaultValue', // Dodane oznaczenie specjalne
        defaultValue: '' // Domyślna wartość
      },
    KOD: { 
      description: 'Kod pocztowy lokalizacji sklepu. Kod pocztowy w postaci ciągu 5 znaków bez kreski.', 
      dataType: 'CHR(10)', 
      required: true 
    },
    MIASTO: { 
      description: 'Miasto adresu sklepu.', 
      dataType: 'CHR(100)', 
      required: true 
    },
    ULICA: { 
      description: 'Ulica adresu sklepu (i opcjonalnie również numer lokalu).', 
      dataType: 'CHR(100)', 
      required: true 
    },
    NR_LOK: { 
      description: 'Numer lokalu z adresu sklepu.', 
      dataType: 'CHR(10)', 
      required: false 
    },
    DATA_OD: { 
      description: 'Data przyjęcia sklepu do sieci.', 
      dataType: 'DT, RRRR-MM-DD', 
      required: true 
    },
    DATA_DO: { 
      description: 'Data wyjścia sklepu z sieci', 
      dataType: 'DT, RRRR-MM-DD', 
      required: false 
    },
    POWIERZCHNIA: { 
      description: 'Powierzchnia sprzedaży sklepu', 
      dataType: 'INT', 
      required: false 
    },
    LICZBA_KAS: { 
      description: 'Ilość kas w sklepie', 
      dataType: 'INT', 
      required: false 
    },
    TELEFON: { 
      description: 'Nr telefonu kontaktowego do sklepu', 
      dataType: 'CHR(50)', 
      required: false 
    },
    EMAIL: { 
      description: 'Adres email do kontaktu ze sklepem', 
      dataType: 'CHR(100)', 
      required: false 
    },
    KATEGORIA: { 
      description: 'Nazwa kategorii sklepu wg sieci', 
      dataType: 'CHR(200)', 
      required: false 
    },
    TYP_SKLEPU: { 
      description: 'Nazwa typu sklepu wg sieci', 
      dataType: 'CHR(200)', 
      required: false 
    },
    KLASYFIKACJA: { 
      description: 'Klasyfikacja sklepu wg sieci, np. województwo.', 
      dataType: 'CHR(200)', 
      required: false 
    },
    REGAL_CHLODNICZY: { 
      description: 'Czy występuje regał chłodniczy (TAK/NIE)', 
      dataType: 'CHR(10)', 
      required: false 
    },
    LADA_MIESNA: { 
      description: 'Czy występuje lada mięsno-wędliniarska (TAK/NIE)', 
      dataType: 'CHR(10)', 
      required: false 
    }
  };
  
  export const fieldOrder = [
    'ID_KLS',
    'REGION',
    'NAZWA',
    'SKROT',
    'ID_KRAJ',
    'NIP',
    'KOD',
    'MIASTO',
    'ULICA',
    'NR_LOK',
    'DATA_OD',
    'DATA_DO',
    'POWIERZCHNIA',
    'LICZBA_KAS',
    'TELEFON',
    'EMAIL',
    'KATEGORIA',
    'TYP_SKLEPU',
    'KLASYFIKACJA',
    'REGAL_CHLODNICZY',
    'LADA_MIESNA'
  ];