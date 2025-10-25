// src/utils/dateUtils.ts

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, addDays, addHours, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds, getDay } from 'date-fns';
import { isHoliday } from '../services/holidays';

/**
 * Zona horaria de Colombia
 */
export const COLOMBIA_TZ = 'America/Bogota';

/**
 * Constantes de horario laboral
 */
export const WORK_START_HOUR = 8;    // 8:00 AM
export const WORK_END_HOUR = 17;     // 5:00 PM (17:00)
export const LUNCH_START_HOUR = 12;  // 12:00 PM
export const LUNCH_END_HOUR = 13;    // 1:00 PM (13:00)

/**
 * Horas laborales por día (8 AM - 5 PM = 9 horas, menos 1 de almuerzo = 8 horas)
 */
export const WORK_HOURS_PER_DAY = 8;

/**
 * Convierte una fecha UTC a hora de Colombia
 */
export function toColombiaTime(date: Date): Date {
  return toZonedTime(date, COLOMBIA_TZ);
}

/**
 * Convierte una fecha de hora de Colombia a UTC
 */
export function fromColombiaToUTC(date: Date): Date {
  return fromZonedTime(date, COLOMBIA_TZ);
}

/**
 * Formatea una fecha en formato ISO 8601 con zona horaria de Colombia
 */
export function formatToColombiaISO(date: Date): string {
  return formatInTimeZone(date, COLOMBIA_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Formatea una fecha como YYYY-MM-DD
 */
export function formatDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Verifica si una fecha es un día laboral (lunes a viernes, no festivo)
 */
export async function isWorkingDay(date: Date): Promise<boolean> {
  const dayOfWeek = getDay(date);
  
  // 0 = domingo, 6 = sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Verificar si es festivo
  const dateString = formatDateOnly(date);
  const holiday = await isHoliday(dateString);
  
  return !holiday;
}

/**
 * Verifica si una hora específica está dentro del horario laboral (excluyendo almuerzo)
 */
export function isWorkingHour(date: Date): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  // Antes de las 8:00 AM
  if (hour < WORK_START_HOUR) {
    return false;
  }
  
  // Después de las 5:00 PM (17:00)
  if (hour >= WORK_END_HOUR) {
    return false;
  }
  
  // Durante el almuerzo (12:00 PM - 1:00 PM)
  // 12:00:00 hasta 12:59:59 es almuerzo
  if (hour === LUNCH_START_HOUR) {
    return false;
  }
  
  return true;
}

/**
 * Ajusta una fecha al momento laboral válido más cercano
 * Regla: Si está fuera de horario laboral, ajusta al último momento
 * laboral válido. Si ese momento ya pasó en el día actual, 
 * va al siguiente día laboral al inicio de jornada.
 */
export async function adjustToWorkingTime(date: Date): Promise<Date> {
  let adjusted = new Date(date);
  
  // Verificar si es día laboral
  const isWorking = await isWorkingDay(adjusted);
  
  if (!isWorking) {
    // No es día laboral → siguiente día laboral a las 8:00 AM
    do {
      adjusted = addDays(adjusted, 1);
    } while (!(await isWorkingDay(adjusted)));
    
    adjusted = setHours(adjusted, WORK_START_HOUR);
    adjusted = setMinutes(adjusted, 0);
    adjusted = setSeconds(adjusted, 0);
    adjusted = setMilliseconds(adjusted, 0);
    
    return adjusted;
  }
  
  // Es día laboral, verificar la hora
  const hour = adjusted.getHours();
  const minute = adjusted.getMinutes();
  const second = adjusted.getSeconds();
  
  // Antes de las 8:00 AM → ajustar a 8:00 AM del mismo día
  if (hour < WORK_START_HOUR) {
    adjusted = setHours(adjusted, WORK_START_HOUR);
    adjusted = setMinutes(adjusted, 0);
    adjusted = setSeconds(adjusted, 0);
    adjusted = setMilliseconds(adjusted, 0);
    return adjusted;
  }
  
  // Durante almuerzo (12:00:00 - 12:59:59) → ajustar a 12:00 PM
  if (hour === LUNCH_START_HOUR) {
    adjusted = setHours(adjusted, LUNCH_START_HOUR);
    adjusted = setMinutes(adjusted, 0);
    adjusted = setSeconds(adjusted, 0);
    adjusted = setMilliseconds(adjusted, 0);
    return adjusted;
  }
  
  // Después de las 5:00 PM → siguiente día laboral a 8:00 AM
  if (hour >= WORK_END_HOUR) {
    do {
      adjusted = addDays(adjusted, 1);
    } while (!(await isWorkingDay(adjusted)));
    
    adjusted = setHours(adjusted, WORK_START_HOUR);
    adjusted = setMinutes(adjusted, 0);
    adjusted = setSeconds(adjusted, 0);
    adjusted = setMilliseconds(adjusted, 0);
    
    return adjusted;
  }
  
  // Está dentro del horario laboral válido → no cambiar
  return adjusted;
}

/**
 * Obtiene el inicio del siguiente día laboral
 */
export async function getNextWorkingDay(date: Date): Promise<Date> {
  let next = addDays(date, 1);
  next = setHours(next, WORK_START_HOUR);
  next = setMinutes(next, 0);
  next = setSeconds(next, 0);
  next = setMilliseconds(next, 0);
  
  // Asegurar que sea día laboral
  while (!(await isWorkingDay(next))) {
    next = addDays(next, 1);
  }
  
  return next;
}