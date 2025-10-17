# Nominatim Geocoder

Herramienta web de geocodificación directa e inversa utilizando la API pública de Nominatim de OpenStreetMap.

## Descripción

Esta aplicación permite realizar búsquedas de direcciones y geocodificación inversa (obtener dirección a partir de coordenadas) utilizando Nominatim, el servicio de geocodificación de OpenStreetMap. La interfaz incluye un mapa interactivo que permite visualizar y ajustar las ubicaciones mediante marcadores arrastrables.

## Características

- **Búsqueda de direcciones**: Busca lugares por nombre y país
- **Geocodificación inversa**: Obtén la dirección completa haciendo clic o arrastrando el marcador en el mapa
- **Jerarquía de direcciones**: Visualiza todos los componentes de la dirección con su nivel de jerarquía (rank_address)
- **Constructor de direcciones personalizado**: Selecciona los componentes que deseas incluir en la dirección final
- **Filtros configurables**:
  - Filtro de componentes de dirección (isaddress)
  - Filtro por rango de jerarquía (rank_address 8-18)
  - Opción para desactivar todos los filtros
- **Mapa interactivo**:
  - Visualización con Leaflet
  - Marcador arrastrable para ajustar coordenadas
  - Zoom personalizable que se mantiene al mover el marcador
- **Enlaces directos a OpenStreetMap**: Accede directamente a los objetos OSM desde la interfaz

## Tecnologías

- **Next.js 15.5.6** - Framework React con App Router y Turbopack
- **React 19.1.0** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Framework de estilos
- **Leaflet 1.9.4** - Biblioteca de mapas interactivos
- **Nominatim API** - API de geocodificación de OpenStreetMap

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## Uso

1. **Búsqueda de direcciones**:
   - Selecciona un país del menú desplegable
   - Escribe una dirección o lugar en el campo de búsqueda
   - Haz clic en "Buscar"
   - Selecciona un resultado de la lista

2. **Geocodificación inversa**:
   - Haz clic en cualquier punto del mapa, o
   - Arrastra el marcador a una nueva ubicación
   - La dirección se actualizará automáticamente

3. **Personalizar la dirección**:
   - Marca/desmarca los componentes de dirección que quieres incluir
   - La dirección construida se actualizará en tiempo real
   - Usa el checkbox "Mostrar no-dirección" para ver componentes adicionales
   - Usa el checkbox "Sin filtros" para ver todos los componentes OSM

4. **Ordenación automática**:
   - Los componentes se ordenan por rank_address (jerarquía)
   - Los componentes con `isaddress: true` se seleccionan automáticamente
   - El orden va de mayor a menor jerarquía (ej: país → estado → ciudad → calle → número)

## Estructura del Proyecto

```
nominatim-geocoder/
├── app/
│   ├── api/
│   │   ├── nominatim-search/     # Endpoint de búsqueda
│   │   └── nominatim-hierarchy/  # Endpoint de geocodificación inversa
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal
├── components/
│   ├── NominatimGeocoder.tsx     # Componente principal
│   └── NominatimMapComponent.tsx # Componente del mapa
├── utils/
│   └── countries.ts              # Lista de países soportados
└── package.json
```

## API Endpoints

### GET /api/nominatim-search
Busca direcciones por texto.

**Parámetros**:
- `q`: Texto de búsqueda
- `country`: Código ISO del país (2 letras)

### POST /api/nominatim-hierarchy
Obtiene información detallada de una ubicación.

**Parámetros**:
- `lat`: Latitud
- `lon`: Longitud

## Configuración

La aplicación está configurada para ejecutarse en el puerto 3002 por defecto. Puedes cambiar esto en `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3002"
  }
}
```

## Despliegue en Vercel

Este proyecto está optimizado para desplegarse en [Vercel](https://vercel.com), la plataforma de los creadores de Next.js.

### Pasos para el despliegue:

1. **Conectar con GitHub**:
   - Ve a [vercel.com](https://vercel.com) y crea una cuenta o inicia sesión
   - Haz clic en "Add New Project"
   - Importa tu repositorio de GitHub: `AitortxuLC/nominatim-geocoder`

2. **Configuración del proyecto**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Mantén la configuración predeterminada:
     - Framework Preset: `Next.js`
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`

3. **Desplegar**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu aplicación automáticamente
   - Una vez completado, obtendrás una URL pública (ej: `https://nominatim-geocoder.vercel.app`)

4. **Despliegues automáticos**:
   - Cada push a la rama `main` desplegará automáticamente una nueva versión
   - Los pull requests crearán previews automáticas para testing

### Plan gratuito de Vercel:

- ✅ 100 GB de ancho de banda por mes
- ✅ 6,000 minutos de build por mes
- ✅ 100 GB-horas de ejecución serverless
- ✅ Despliegues ilimitados
- ✅ SSL automático
- ✅ CDN global

**Nota**: El plan gratuito es ideal para proyectos personales y de hobby. Para uso comercial, necesitarás el plan Pro ($20/mes).

## API de Nominatim

Esta aplicación utiliza la API pública de Nominatim de OpenStreetMap:
- **URL base**: https://nominatim.openstreetmap.org
- **Documentación**: https://nominatim.org/release-docs/latest/api/Overview/
- **Política de uso**: https://operations.osmfoundation.org/policies/nominatim/

**Importante**: La API pública tiene límites de uso (1 petición por segundo). Para aplicaciones de producción con alto volumen, considera:
- Instalar tu propia instancia de Nominatim
- Usar servicios comerciales basados en Nominatim
- Implementar caché y rate limiting

## Licencia

Este proyecto utiliza datos de OpenStreetMap, que están disponibles bajo la licencia Open Database License (ODbL).
