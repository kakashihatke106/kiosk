function admin(req, res, next) {
    console.log("Session userType:", req.session.userType);

    if (!req.session || !req.session.userType) {
        return res.redirect("/login");
    }

    if (req.session.userType !== "Admin") {
        console.log("Access denied. User is not a Admin.");
        return res.status(403).send("Access denied. Only Admins can access this page.");
    }
    next();
}

module.exports = admin;
