// src/services/workingDays.ts

import { addDays, addMinutes, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { 
  adjustToWorkingTime, 
  isWorkingDay,
  WORK_END_HOUR,
  LUNCH_START_HOUR,
  LUNCH_END_HOUR
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
  
  // Ajustar al momento laboral válido
  let currentDate = await adjustToWorkingTime(startDate);
  
  // Guardar la hora ajustada para mantenerla
  const targetHour = currentDate.getHours();
  const targetMinute = currentDate.getMinutes();
  const targetSecond = currentDate.getSeconds();
  const targetMs = currentDate.getMilliseconds();
  
  let daysAdded = 0;
  
  while (daysAdded < daysToAdd) {
    // Avanzar al siguiente día
    currentDate = addDays(currentDate, 1);
    
    // Verificar si es día laboral
    while (!(await isWorkingDay(currentDate))) {
      currentDate = addDays(currentDate, 1);
    }
    
    daysAdded++;
  }
  
  // Restaurar la hora original (ajustada)
  currentDate = setHours(currentDate, targetHour);
  currentDate = setMinutes(currentDate, targetMinute);
  currentDate = setSeconds(currentDate, targetSecond);
  currentDate = setMilliseconds(currentDate, targetMs);
  
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
  
  // Ajustar al momento laboral válido
  let currentDate = await adjustToWorkingTime(startDate);
  
  let remainingMinutes = hoursToAdd * 60; // Trabajar en minutos para mayor precisión
  
  while (remainingMinutes > 0) {
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    
    // Calcular minutos hasta el final del periodo actual
    let minutesUntilBreak: number;
    
    if (currentHour < LUNCH_START_HOUR) {
      // Estamos en la mañana (8 AM - 12 PM)
      minutesUntilBreak = (LUNCH_START_HOUR - currentHour) * 60 - currentMinute;
    } else if (currentHour === LUNCH_START_HOUR) {
      // Estamos en almuerzo, saltar a 1 PM
      currentDate = setHours(currentDate, LUNCH_END_HOUR);
      currentDate = setMinutes(currentDate, 0);
      currentDate = setSeconds(currentDate, 0);
      currentDate = setMilliseconds(currentDate, 0);
      continue;
    } else {
      // Estamos en la tarde (1 PM - 5 PM)
      minutesUntilBreak = (WORK_END_HOUR - currentHour) * 60 - currentMinute;
    }
    
    if (remainingMinutes <= minutesUntilBreak) {
      // Podemos sumar todo en este periodo
      currentDate = addMinutes(currentDate, remainingMinutes);
      remainingMinutes = 0;
    } else {
      // No cabe todo, avanzamos al siguiente periodo
      currentDate = addMinutes(currentDate, minutesUntilBreak);
      remainingMinutes -= minutesUntilBreak;
      
      const hour = currentDate.getHours();
      
      if (hour === LUNCH_START_HOUR) {
        // Llegamos al almuerzo, saltar a 1 PM
        currentDate = setHours(currentDate, LUNCH_END_HOUR);
        currentDate = setMinutes(currentDate, 0);
        currentDate = setSeconds(currentDate, 0);
        currentDate = setMilliseconds(currentDate, 0);
      } else if (hour >= WORK_END_HOUR) {
        // Llegamos al final del día, ir al siguiente día laboral
        do {
          currentDate = addDays(currentDate, 1);
        } while (!(await isWorkingDay(currentDate)));
        
        currentDate = setHours(currentDate, 8); // 8 AM
        currentDate = setMinutes(currentDate, 0);
        currentDate = setSeconds(currentDate, 0);
        currentDate = setMilliseconds(currentDate, 0);
      }
    }
  }
  
  return currentDate;
}