export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: Country[] = [
  { code: 'ae', name: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'at', name: 'Austria', flag: '🇦🇹' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'be', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'br', name: 'Brasil', flag: '🇧🇷' },
  { code: 'ca', name: 'Canadá', flag: '🇨🇦' },
  { code: 'ch', name: 'Suiza', flag: '🇨🇭' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'de', name: 'Alemania', flag: '🇩🇪' },
  { code: 'dk', name: 'Dinamarca', flag: '🇩🇰' },
  { code: 'ec', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'es', name: 'España', flag: '🇪🇸' },
  { code: 'fr', name: 'Francia', flag: '🇫🇷' },
  { code: 'gb', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'hk', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'ie', name: 'Irlanda', flag: '🇮🇪' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'it', name: 'Italia', flag: '🇮🇹' },
  { code: 'jp', name: 'Japón', flag: '🇯🇵' },
  { code: 'ke', name: 'Kenia', flag: '🇰🇪' },
  { code: 'ma', name: 'Marruecos', flag: '🇲🇦' },
  { code: 'mm', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'mx', name: 'México', flag: '🇲🇽' },
  { code: 'my', name: 'Malasia', flag: '🇲🇾' },
  { code: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'nl', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'nz', name: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: 'pa', name: 'Panamá', flag: '🇵🇦' },
  { code: 'pe', name: 'Perú', flag: '🇵🇪' },
  { code: 'ph', name: 'Filipinas', flag: '🇵🇭' },
  { code: 'pk', name: 'Pakistán', flag: '🇵🇰' },
  { code: 'pl', name: 'Polonia', flag: '🇵🇱' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ro', name: 'Rumania', flag: '🇷🇴' },
  { code: 'ru', name: 'Rusia', flag: '🇷🇺' },
  { code: 'se', name: 'Suecia', flag: '🇸🇪' },
  { code: 'sg', name: 'Singapur', flag: '🇸🇬' },
  { code: 'th', name: 'Tailandia', flag: '🇹🇭' },
  { code: 'tn', name: 'Túnez', flag: '🇹🇳' },
  { code: 'tr', name: 'Turquía', flag: '🇹🇷' },
  { code: 'ua', name: 'Ucrania', flag: '🇺🇦' },
  { code: 'us', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 've', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'vn', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'za', name: 'Sudáfrica', flag: '🇿🇦' }
]

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code)
}