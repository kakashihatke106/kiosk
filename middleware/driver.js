function driver(req, res, next) {
    console.log("Session userType:", req.session.userType);

    if (!req.session || !req.session.userType) {
        return res.redirect("/login");
    }

    if (req.session.userType !== "Driver") {
        console.log("Access denied. User is not a Driver.");
        return res.status(403).send("Access denied. Only Drivers can access this page.");
    }
    next();
}

module.exports = driver;
