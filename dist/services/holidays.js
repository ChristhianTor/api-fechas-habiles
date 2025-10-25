"use strict";
// src/services/holidays.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHolidays = getHolidays;
exports.isHoliday = isHoliday;
const https_1 = __importDefault(require("https"));
const HOLIDAYS_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';
let holidaysCache = null;
/**
 * Función auxiliar para hacer peticiones HTTPS
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (response) => {
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
async function getHolidays() {
    if (holidaysCache !== null) {
        return holidaysCache;
    }
    try {
        const jsonString = await httpsGet(HOLIDAYS_URL);
        const data = JSON.parse(jsonString);
        let holidays;
        if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'string') {
                holidays = data;
            }
            else {
                const holidayObjects = data;
                holidays = holidayObjects.map(h => h.holiday);
            }
        }
        else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            const holidaysKey = keys.find(key => Array.isArray(data[key]));
            if (holidaysKey) {
                const arrayData = data[holidaysKey];
                if (arrayData.length > 0 && typeof arrayData[0] === 'string') {
                    holidays = arrayData;
                }
                else {
                    holidays = arrayData.map(h => h.holiday);
                }
            }
            else {
                throw new Error('No se encontró el array de festivos');
            }
        }
        else {
            throw new Error('Formato de datos no reconocido');
        }
        holidaysCache = new Set(holidays.filter(date => date != null && date.length > 0));
        return holidaysCache;
    }
    catch (error) {
        console.error('Error obteniendo festivos:', error);
        return new Set();
    }
}
/**
 * Verifica si una fecha es día festivo
 * @param dateString Fecha en formato YYYY-MM-DD
 */
async function isHoliday(dateString) {
    const holidays = await getHolidays();
    return holidays.has(dateString);
}
