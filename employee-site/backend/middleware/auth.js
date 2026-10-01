const jwt = require('jsonwebtoken');

// Expects header:  Authorization: Bearer <token>
module.exports = function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token, please log in.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, empid: payload.empid };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again.' : 'Invalid token.';
    res.status(401).json({ message });
  }
};
