const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check whether user is authenticated
    if (!req.user) {
      return res.status(401).json({
        succeeded: false,
        message: "Authentication required.",
        data: null,
      });
    }

    // Check whether user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        succeeded: false,
        message: "Access denied. You do not have permission.",
        data: null,
      });
    }

    next();
  };
};

authorizeRoles.authorizeRoles = authorizeRoles;
module.exports = authorizeRoles;
