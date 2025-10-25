"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dateUtils_1 = require("./utils/dateUtils");
const workingDays_1 = require("./services/workingDays");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
/**
 * Endpoint principal de la API
 * GET /calculate-working-date
 */
app.get('/calculate-working-date', async (req, res) => {
    try {
        const { days, hours, date } = req.query;
        // Validar que al menos un parámetro esté presente
        if (!days && !hours) {
            const errorResponse = {
                error: 'InvalidParameters',
                message: 'Debe proporcionar al menos uno de los parámetros: days o hours'
            };
            return res.status(400).json(errorResponse);
        }
        // Validar que los parámetros sean números válidos
        let daysToAdd = 0;
        let hoursToAdd = 0;
        if (days) {
            daysToAdd = parseInt(days, 10);
            if (isNaN(daysToAdd) || daysToAdd < 0) {
                const errorResponse = {
                    error: 'InvalidParameters',
                    message: 'El parámetro "days" debe ser un número entero positivo'
                };
                return res.status(400).json(errorResponse);
            }
        }
        if (hours) {
            hoursToAdd = parseInt(hours, 10);
            if (isNaN(hoursToAdd) || hoursToAdd < 0) {
                const errorResponse = {
                    error: 'InvalidParameters',
                    message: 'El parámetro "hours" debe ser un número entero positivo'
                };
                return res.status(400).json(errorResponse);
            }
        }
        // Determinar la fecha de inicio
        let startDate;
        if (date) {
            // Validar formato de fecha
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                const errorResponse = {
                    error: 'InvalidParameters',
                    message: 'El parámetro "date" debe estar en formato ISO 8601 válido'
                };
                return res.status(400).json(errorResponse);
            }
            // Validar que termine en 'Z' (UTC)
            if (!date.endsWith('Z')) {
                const errorResponse = {
                    error: 'InvalidParameters',
                    message: 'El parámetro "date" debe estar en formato UTC y terminar con "Z"'
                };
                return res.status(400).json(errorResponse);
            }
            startDate = parsedDate;
        }
        else {
            // Usar fecha actual
            startDate = new Date();
        }
        // Convertir a hora de Colombia para hacer los cálculos
        let currentDate = (0, dateUtils_1.toColombiaTime)(startDate);
        // Sumar días primero (si se proporcionó)
        if (daysToAdd > 0) {
            currentDate = await (0, workingDays_1.addWorkingDays)(currentDate, daysToAdd);
        }
        // Luego sumar horas (si se proporcionó)
        if (hoursToAdd > 0) {
            currentDate = await (0, workingDays_1.addWorkingHours)(currentDate, hoursToAdd);
        }
        // Convertir de vuelta a UTC
        const resultDateUTC = (0, dateUtils_1.fromColombiaToUTC)(currentDate);
        // Responder con formato ISO 8601 en UTC
        const response = {
            date: resultDateUTC.toISOString()
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error en calculate-working-date:', error);
        const errorResponse = {
            error: 'InternalError',
            message: 'Ocurrió un error interno del servidor'
        };
        res.status(500).json(errorResponse);
    }
});
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/calculate-working-date`);
});
