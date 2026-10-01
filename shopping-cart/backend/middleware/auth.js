const jwt = require('jsonwebtoken');

// Verifies the token and (optionally) the role: 'admin' or 'user'
//   router.use(auth('admin'))
function auth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in.' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (role && payload.role !== role) return res.status(403).json({ message: 'Not allowed.' });
      req.auth = payload; // { id, role }
      next();
    } catch (err) {
      res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Session expired, log in again.' : 'Invalid token.' });
    }
  };
}

module.exports = auth;
