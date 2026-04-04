const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Access denied. Insufficient permissions.' });
  }
  next();
};

module.exports = { requireRole };
