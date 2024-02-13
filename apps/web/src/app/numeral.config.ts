import numeral from 'numeral';

numeral.register('locale', 'es', {
  delimiters: {
    thousands: '.',
    decimal: ',',
  },
  abbreviations: {
    thousand: 'k',
    million: 'm',
    billion: 'b',
    trillion: 't',
  },
  ordinal: function () {
    return '°';
  },
  currency: {
    symbol: '€',
  },
});

// switch between locales
numeral.locale('es');
