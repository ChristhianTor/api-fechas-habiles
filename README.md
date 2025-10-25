# API de Fechas Hábiles - Colombia

API REST que calcula fechas hábiles en Colombia, considerando días festivos, horarios laborales y zona horaria local.

**API desplegada:** 
https://api-fechas-habiles-production.up.railway.app

**Endpoint principal:**
GET https://api-fechas-habiles-production.up.railway.app/calculate-working-date

### Prueba rápida

Haz click aquí para probar:
- [Sumar 1 día hábil](https://api-fechas-habiles-production.up.railway.app/calculate-working-date?days=1)
- [Sumar 5 horas hábiles](https://api-fechas-habiles-production.up.railway.app/calculate-working-date?hours=5)
- [Sumar 2 días y 3 horas](https://api-fechas-habiles-production.up.railway.app/calculate-working-date?days=2&hours=3)

## 🚀 Características

- Suma días hábiles (lunes a viernes, excluyendo festivos)
- Suma horas hábiles (8:00 AM - 5:00 PM, excluyendo almuerzo 12:00 PM - 1:00 PM)
- Manejo de zona horaria de Colombia (UTC-5)
- Exclusión automática de festivos nacionales colombianos
- Validación de parámetros
- Respuestas en formato UTC ISO 8601

## 📋 Requisitos

- Node.js 18+ 
- npm

## 🔧 Instalación
```bash
# Clonar el repositorio
git clone <https://github.com/ChristhianTor/api-fechas-habiles.git>
cd api-fechas-habiles

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## 🌐 Uso

### Endpoint
```
GET /calculate-working-date
```

### Parámetros Query String

- `days` (opcional): Número de días hábiles a sumar (entero positivo)
- `hours` (opcional): Número de horas hábiles a sumar (entero positivo)
- `date` (opcional): Fecha inicial en formato UTC ISO 8601 con sufijo Z. Si no se provee, usa la fecha actual.

**Nota:** Debe proporcionarse al menos `days` o `hours`.

### Ejemplos

#### Sumar 5 días hábiles desde ahora
```
GET /calculate-working-date?days=5
```

#### Sumar 3 horas hábiles desde ahora
```
GET /calculate-working-date?hours=3
```

#### Sumar 2 días y 4 horas desde una fecha específica
```
GET /calculate-working-date?date=2025-10-24T20:00:00.000Z&days=2&hours=4
```

### Respuestas

#### Éxito (200 OK)
```json
{
  "date": "2025-10-28T15:00:00.000Z"
}
```

#### Error (400 Bad Request)
```json
{
  "error": "InvalidParameters",
  "message": "Debe proporcionar al menos uno de los parámetros: days o hours"
}
```

#### Error interno (500 Internal Server Error)
```json
{
  "error": "InternalError",
  "message": "Ocurrió un error interno del servidor"
}
```

## 📚 Reglas de Negocio

### Horario Laboral
- Lunes a viernes
- 8:00 AM - 5:00 PM (hora de Colombia)
- Almuerzo: 12:00 PM - 1:00 PM (no se cuenta como tiempo laboral)
- Total: 8 horas laborales por día

### Días Festivos
Los días festivos colombianos se obtienen automáticamente desde:
https://content.capta.co/Recruitment/WorkingDays.json

### Ajuste de Fechas
Si la fecha inicial está fuera del horario laboral o en fin de semana/festivo, se ajusta al siguiente momento laboral válido.

## 🏗️ Estructura del Proyecto
```
api-fechas-habiles/
├── node_modules/
├── src/
│   ├── index.ts              # Punto de entrada, servidor Express
│   ├── types/
│   │   └── index.ts          # Definiciones de tipos TypeScript
│   ├── services/
│   │   ├── holidays.ts       # Gestión de días festivos
│   │   └── workingDays.ts    # Lógica de suma de días/horas hábiles
│   └── utils/
│       └── dateUtils.ts      # Utilidades para manejo de fechas
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Tecnologías

- **TypeScript**: Lenguaje principal
- **Node.js**: Runtime
- **Express**: Framework web
- **date-fns**: Manipulación de fechas
- **date-fns-tz**: Manejo de zonas horarias

## 📝 Scripts

- `npm run dev`: Ejecuta en modo desarrollo con recarga automática
- `npm run build`: Compila TypeScript a JavaScript
- `npm start`: Ejecuta la versión compilada

## 🧪 Ejemplos de Prueba
```bash
# Desde un viernes a las 4:00 PM, sumar 2 horas
# Resultado esperado: Lunes a las 9:00 AM
curl "http://localhost:3000/calculate-working-date?date=2025-10-24T21:00:00.000Z&hours=2"

# Desde un lunes a las 8:00 AM, sumar 8 horas
# Resultado esperado: Mismo lunes a las 5:00 PM
curl "http://localhost:3000/calculate-working-date?date=2025-10-27T13:00:00.000Z&hours=8"

# Desde un martes a las 11:30 AM, sumar 3 horas
# Resultado esperado: Mismo martes a las 3:30 PM (saltando almuerzo)
curl "http://localhost:3000/calculate-working-date?date=2025-10-27T16:30:00.000Z&hours=3"
```

## 👤 Autor

Christhian Camilo Torres Figueredo

## 📄 Licencia

ISC
```

---

## 6.2 Crear archivo .gitignore

En la raíz del proyecto, crea `.gitignore`:
```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo