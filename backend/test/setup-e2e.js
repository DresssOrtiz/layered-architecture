// Las suites e2e ejercitan inscribirEstudiante muchas veces seguidas: sin un límite
// alto por defecto el rate limiting las haría fallar. throttler.e2e-spec.js lo baja.
process.env.RATE_LIMIT_INSCRIPCION ??= '1000';
process.env.RATE_LIMIT_TTL ??= '60000';
