"use strict";
// src/utils/dateUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORK_HOURS_PER_DAY = exports.LUNCH_END_HOUR = exports.LUNCH_START_HOUR = exports.WORK_END_HOUR = exports.WORK_START_HOUR = exports.COLOMBIA_TZ = void 0;
exports.toColombiaTime = toColombiaTime;
exports.fromColombiaToUTC = fromColombiaToUTC;
exports.formatToColombiaISO = formatToColombiaISO;
exports.formatDateOnly = formatDateOnly;
exports.isWorkingDay = isWorkingDay;
exports.isWorkingHour = isWorkingHour;
exports.adjustToWorkingTime = adjustToWorkingTime;
exports.getNextWorkingDay = getNextWorkingDay;
const date_fns_tz_1 = require("date-fns-tz");
const date_fns_1 = require("date-fns");
const holidays_1 = require("../services/holidays");
/**
 * Zona horaria de Colombia
 */
exports.COLOMBIA_TZ = 'America/Bogota';
/**
 * Constantes de horario laboral
 */
exports.WORK_START_HOUR = 8; // 8:00 AM
exports.WORK_END_HOUR = 17; // 5:00 PM (17:00)
exports.LUNCH_START_HOUR = 12; // 12:00 PM
exports.LUNCH_END_HOUR = 13; // 1:00 PM (13:00)
/**
 * Horas laborales por día (8 AM - 5 PM = 9 horas, menos 1 de almuerzo = 8 horas)
 */
exports.WORK_HOURS_PER_DAY = 8;
/**
 * Convierte una fecha UTC a hora de Colombia
 */
function toColombiaTime(date) {
    return (0, date_fns_tz_1.toZonedTime)(date, exports.COLOMBIA_TZ);
}
/**
 * Convierte una fecha de hora de Colombia a UTC
 */
function fromColombiaToUTC(date) {
    return (0, date_fns_tz_1.fromZonedTime)(date, exports.COLOMBIA_TZ);
}
/**
 * Formatea una fecha en formato ISO 8601 con zona horaria de Colombia
 */
function formatToColombiaISO(date) {
    return (0, date_fns_tz_1.formatInTimeZone)(date, exports.COLOMBIA_TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}
/**
 * Formatea una fecha como YYYY-MM-DD
 */
function formatDateOnly(date) {
    return (0, date_fns_1.format)(date, 'yyyy-MM-dd');
}
/**
 * Verifica si una fecha es un día laboral (lunes a viernes, no festivo)
 */
async function isWorkingDay(date) {
    const dayOfWeek = (0, date_fns_1.getDay)(date);
    // 0 = domingo, 6 = sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }
    // Verificar si es festivo
    const dateString = formatDateOnly(date);
    const holiday = await (0, holidays_1.isHoliday)(dateString);
    return !holiday;
}
/**
 * Verifica si una hora específica está dentro del horario laboral (excluyendo almuerzo)
 */
function isWorkingHour(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    // Antes de las 8:00 AM
    if (hour < exports.WORK_START_HOUR) {
        return false;
    }
    // Después de las 5:00 PM (17:00)
    if (hour >= exports.WORK_END_HOUR) {
        return false;
    }
    // Durante el almuerzo (12:00 PM - 1:00 PM)
    // 12:00:00 hasta 12:59:59 es almuerzo
    if (hour === exports.LUNCH_START_HOUR) {
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
async function adjustToWorkingTime(date) {
    let adjusted = new Date(date);
    // Verificar si es día laboral
    const isWorking = await isWorkingDay(adjusted);
    if (!isWorking) {
        // No es día laboral → siguiente día laboral a las 8:00 AM
        do {
            adjusted = (0, date_fns_1.addDays)(adjusted, 1);
        } while (!(await isWorkingDay(adjusted)));
        adjusted = (0, date_fns_1.setHours)(adjusted, exports.WORK_START_HOUR);
        adjusted = (0, date_fns_1.setMinutes)(adjusted, 0);
        adjusted = (0, date_fns_1.setSeconds)(adjusted, 0);
        adjusted = (0, date_fns_1.setMilliseconds)(adjusted, 0);
        return adjusted;
    }
    // Es día laboral, verificar la hora
    const hour = adjusted.getHours();
    const minute = adjusted.getMinutes();
    const second = adjusted.getSeconds();
    // Antes de las 8:00 AM → ajustar a 8:00 AM del mismo día
    if (hour < exports.WORK_START_HOUR) {
        adjusted = (0, date_fns_1.setHours)(adjusted, exports.WORK_START_HOUR);
        adjusted = (0, date_fns_1.setMinutes)(adjusted, 0);
        adjusted = (0, date_fns_1.setSeconds)(adjusted, 0);
        adjusted = (0, date_fns_1.setMilliseconds)(adjusted, 0);
        return adjusted;
    }
    // Durante almuerzo (12:00:00 - 12:59:59) → ajustar a 12:00 PM
    if (hour === exports.LUNCH_START_HOUR) {
        adjusted = (0, date_fns_1.setHours)(adjusted, exports.LUNCH_START_HOUR);
        adjusted = (0, date_fns_1.setMinutes)(adjusted, 0);
        adjusted = (0, date_fns_1.setSeconds)(adjusted, 0);
        adjusted = (0, date_fns_1.setMilliseconds)(adjusted, 0);
        return adjusted;
    }
    // Después de las 5:00 PM → siguiente día laboral a 8:00 AM
    if (hour >= exports.WORK_END_HOUR) {
        do {
            adjusted = (0, date_fns_1.addDays)(adjusted, 1);
        } while (!(await isWorkingDay(adjusted)));
        adjusted = (0, date_fns_1.setHours)(adjusted, exports.WORK_START_HOUR);
        adjusted = (0, date_fns_1.setMinutes)(adjusted, 0);
        adjusted = (0, date_fns_1.setSeconds)(adjusted, 0);
        adjusted = (0, date_fns_1.setMilliseconds)(adjusted, 0);
        return adjusted;
    }
    // Está dentro del horario laboral válido → no cambiar
    return adjusted;
}
/**
 * Obtiene el inicio del siguiente día laboral
 */
async function getNextWorkingDay(date) {
    let next = (0, date_fns_1.addDays)(date, 1);
    next = (0, date_fns_1.setHours)(next, exports.WORK_START_HOUR);
    next = (0, date_fns_1.setMinutes)(next, 0);
    next = (0, date_fns_1.setSeconds)(next, 0);
    next = (0, date_fns_1.setMilliseconds)(next, 0);
    // Asegurar que sea día laboral
    while (!(await isWorkingDay(next))) {
        next = (0, date_fns_1.addDays)(next, 1);
    }
    return next;
}
