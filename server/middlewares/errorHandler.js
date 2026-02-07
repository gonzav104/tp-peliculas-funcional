// Middleware de manejo de errores centralizado
export const errorHandler = (err, req, res, next) => {
    // Logueamos el error para diagnóstico
    console.error("🔥 Error detectado:", err.message);

    // Si el error tiene un código de estado (ej: 400), lo usamos. Si no, es 500 (interno).
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        exito: false,
        error: statusCode === 500 ? "Error Interno del Servidor" : err.name,
        mensaje: err.message,
    });
};