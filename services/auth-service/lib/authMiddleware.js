// services/auth-service/lib/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

function verifyJWT(req, res, next) {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'missing_token' });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload; // { sub, phone, roles, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token', message: e.message });
  }
}

module.exports = { verifyJWT };
