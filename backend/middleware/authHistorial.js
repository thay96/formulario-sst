// backend/middleware/authHistorial.js
function authHistorial(req, res, next) {
  const auth = req.headers.authorization;
  const [usuario, clave] = auth
    ? Buffer.from(auth.split(' ')[1], 'base64').toString().split(':')
    : [];

  if (usuario === process.env.SST_USER && clave === process.env.SST_PASS) {
    return next();
  }
  return res.status(401).json({ error: 'Credenciales incorrectas' }); // sin WWW-Authenticate
}

module.exports = authHistorial;