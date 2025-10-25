// src/services/holidays.ts

import https from 'https';
import { Holiday } from '../types';

const HOLIDAYS_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';

let holidaysCache: Set<string> | null = null;

/**
 * Función auxiliar para hacer peticiones HTTPS
 */
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Obtiene los días festivos colombianos y los almacena en cache
 */
export async function getHolidays(): Promise<Set<string>> {
  if (holidaysCache !== null) {
    return holidaysCache;
  }

  try {
    const jsonString = await httpsGet(HOLIDAYS_URL);
    const data = JSON.parse(jsonString);
    
    let holidays: string[];
    
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'string') {
        holidays = data as string[];
      } else {
        const holidayObjects = data as Holiday[];
        holidays = holidayObjects.map(h => h.holiday);
      }
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      const holidaysKey = keys.find(key => Array.isArray(data[key]));
      
      if (holidaysKey) {
        const arrayData = data[holidaysKey];
        if (arrayData.length > 0 && typeof arrayData[0] === 'string') {
          holidays = arrayData as string[];
        } else {
          holidays = (arrayData as Holiday[]).map(h => h.holiday);
        }
      } else {
        throw new Error('No se encontró el array de festivos');
      }
    } else {
      throw new Error('Formato de datos no reconocido');
    }

    holidaysCache = new Set(holidays.filter(date => date != null && date.length > 0));
    
    return holidaysCache;
  } catch (error) {
    console.error('Error obteniendo festivos:', error);
    return new Set();
  }
}

/**
 * Verifica si una fecha es día festivo
 * @param dateString Fecha en formato YYYY-MM-DD
 */
export async function isHoliday(dateString: string): Promise<boolean> {
  const holidays = await getHolidays();
  return holidays.has(dateString);
}