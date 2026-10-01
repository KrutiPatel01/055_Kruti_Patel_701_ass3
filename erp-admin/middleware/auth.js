// Protects every admin page: no session -> back to login
module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/login');
};
