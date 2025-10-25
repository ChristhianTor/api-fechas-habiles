/**
 * Parámetros que puede recibir nuestra API
 */
export interface QueryParams {
  days?: string;    // Número de días hábiles a sumar (opcional)
  hours?: string;   // Número de horas hábiles a sumar (opcional)
  date?: string;    // Fecha inicial en formato UTC (opcional)
}

/**
 * Respuesta exitosa de la API
 */
export interface SuccessResponse {
  date: string;     // Fecha resultante en formato UTC ISO 8601
}

/**
 * Respuesta de error de la API
 */
export interface ErrorResponse {
  error: string;    // Código del error
  message: string;  // Descripción detallada del error
}

/**
 * Estructura de un día festivo colombiano
 */
export interface Holiday {
  holiday: string;  // Fecha del festivo en formato YYYY-MM-DD
  type: string;     // Tipo de festivo
  name: string;     // Nombre del festivo
}