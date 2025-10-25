// src/services/workingDays.ts

import { addDays, addHours, addMinutes, getHours, getMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { 
  adjustToWorkingTime, 
  getNextWorkingDay, 
  isWorkingDay, 
  isWorkingHour,
  WORK_START_HOUR,
  WORK_END_HOUR,
  LUNCH_START_HOUR,
  LUNCH_END_HOUR,
  WORK_HOURS_PER_DAY
} from '../utils/dateUtils';

/**
 * Suma días hábiles a una fecha
 * @param startDate Fecha inicial (en hora de Colombia)
 * @param daysToAdd Número de días hábiles a sumar
 * @returns Fecha resultante después de sumar los días hábiles
 */
export async function addWorkingDays(startDate: Date, daysToAdd: number): Promise<Date> {
  if (daysToAdd === 0) {
    return startDate;
  }
  
  // Primero ajustar la fecha al momento laboral válido
  let currentDate = await adjustToWorkingTime(startDate);
  
  // Sumar días hábiles uno por uno
  let daysAdded = 0;
  
  while (daysAdded < daysToAdd) {
    // Obtener el siguiente día laboral
    currentDate = await getNextWorkingDay(currentDate);
    daysAdded++;
  }
  
  return currentDate;
}

/**
 * Suma horas hábiles a una fecha
 * @param startDate Fecha inicial (en hora de Colombia)
 * @param hoursToAdd Número de horas hábiles a sumar
 * @returns Fecha resultante después de sumar las horas hábiles
 */
export async function addWorkingHours(startDate: Date, hoursToAdd: number): Promise<Date> {
  if (hoursToAdd === 0) {
    return startDate;
  }
  
  // Primero ajustar la fecha al momento laboral válido
  let currentDate = await adjustToWorkingTime(startDate);
  
  let remainingHours = hoursToAdd;
  
  while (remainingHours > 0) {
    // Calcular cuántas horas quedan en el día actual
    const hoursLeftInDay = await getWorkingHoursLeftInDay(currentDate);
    
    if (remainingHours <= hoursLeftInDay) {
      // Podemos sumar todas las horas restantes en el día actual
      currentDate = await addHoursWithinDay(currentDate, remainingHours);
      remainingHours = 0;
    } else {
      // Necesitamos pasar al siguiente día
      remainingHours -= hoursLeftInDay;
      
      // Ir al siguiente día laboral a las 8:00 AM
      currentDate = await getNextWorkingDay(currentDate);
    }
  }
  
  return currentDate;
}

/**
 * Calcula cuántas horas laborales quedan en el día actual
 * desde la hora actual hasta el fin de la jornada (5 PM)
 */
async function getWorkingHoursLeftInDay(date: Date): Promise<number> {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  
  // Convertir todo a minutos desde el inicio del día
  const currentMinutes = hour * 60 + minute + second / 60;
  
  // Fin de jornada: 17:00 (5 PM) = 1020 minutos
  const endOfDayMinutes = WORK_END_HOUR * 60;
  
  // Calcular minutos hasta el fin del día
  let minutesLeft = endOfDayMinutes - currentMinutes;
  
  // Si estamos antes del almuerzo o durante el almuerzo, restar la hora de almuerzo
  if (hour < LUNCH_END_HOUR) {
    // Restar 1 hora (60 minutos) de almuerzo
    minutesLeft -= 60;
  }
  
  // Convertir minutos a horas
  const hoursLeft = minutesLeft / 60;
  
  return Math.max(0, hoursLeft);
}

/**
 * Suma horas dentro del mismo día, saltando el horario de almuerzo
 */
async function addHoursWithinDay(date: Date, hours: number): Promise<Date> {
  let currentDate = new Date(date);
  let remainingMinutes = hours * 60; // Convertir a minutos para mayor precisión
  
  while (remainingMinutes > 0) {
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    
    // Si estamos justo antes del almuerzo (entre 11:XX y 12:00)
    if (currentHour === 11) {
      // Calcular minutos hasta las 12:00 PM
      const minutesUntilLunch = 60 - currentMinute;
      
      if (remainingMinutes <= minutesUntilLunch) {
        // Podemos sumar sin llegar al almuerzo
        currentDate = addMinutes(currentDate, remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Llegamos al almuerzo, saltar a la 1:00 PM
        remainingMinutes -= minutesUntilLunch;
        currentDate = setHours(currentDate, LUNCH_END_HOUR);
        currentDate = setMinutes(currentDate, 0);
        currentDate = setSeconds(currentDate, 0);
        currentDate = setMilliseconds(currentDate, 0);
      }
    }
    // Si estamos durante el almuerzo (12:00 - 12:59)
    else if (currentHour === LUNCH_START_HOUR) {
      // Saltar a la 1:00 PM
      currentDate = setHours(currentDate, LUNCH_END_HOUR);
      currentDate = setMinutes(currentDate, 0);
      currentDate = setSeconds(currentDate, 0);
      currentDate = setMilliseconds(currentDate, 0);
    }
    // Horario normal
    else {
      // Calcular minutos hasta el fin del día o hasta el almuerzo
      let minutesUntilBreak;
      
      if (currentHour < LUNCH_START_HOUR) {
        // Estamos antes del almuerzo
        minutesUntilBreak = (LUNCH_START_HOUR - currentHour) * 60 - currentMinute;
      } else {
        // Estamos después del almuerzo
        minutesUntilBreak = (WORK_END_HOUR - currentHour) * 60 - currentMinute;
      }
      
      if (remainingMinutes <= minutesUntilBreak) {
        // Podemos sumar todo sin interrupciones
        currentDate = addMinutes(currentDate, remainingMinutes);
        remainingMinutes = 0;
      } else {
        // Llegaríamos al límite
        currentDate = addMinutes(currentDate, minutesUntilBreak);
        remainingMinutes -= minutesUntilBreak;
        
        // Si llegamos al almuerzo, saltar a la 1 PM
        if (currentDate.getHours() === LUNCH_START_HOUR) {
          currentDate = setHours(currentDate, LUNCH_END_HOUR);
          currentDate = setMinutes(currentDate, 0);
          currentDate = setSeconds(currentDate, 0);
          currentDate = setMilliseconds(currentDate, 0);
        }
      }
    }
  }
  
  return currentDate;
}