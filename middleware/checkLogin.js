const checkLogin = async (req, res, next) => {
  let cookies =
    Object.keys(req.signedCookies).length > 0 ? req.signedCookies : null;

  if (cookies) {
    try {
      let token = await cookies[process.env.COOKIE_NAME];
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; /// contains the users data from jwt token()
      console.log("checked cookie");
      next();
    } catch (error) {
      res.status(500).json({
        message: "Authentication failure!",
      });
    }
  } else {
    res.status(401).json({
      error: "Authentication failure",
    });
  }
};

module.exports = checkLogin;
