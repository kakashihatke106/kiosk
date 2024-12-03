const bcrypt = require("bcrypt");
const User = require("../models/userinfo.js");

async function licensenoverification(licensenoUser, userId) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found");
            return false;
        }

        console.log("Entered License Number:", licensenoUser);
        console.log("Stored License Number:", user.licenseno);

        const isMatch = licensenoUser === user.licenseno;
        console.log("User entered license number matched with the Database ", isMatch);
        return isMatch;
    } catch (error) {
        console.error("License number verification failed:", error);
        throw error;
    }
}

module.exports.updateUser = async (req, res) => {
    const { userId, licensenoUser, make, model, year, plateno } = req.body;

    if (!make || !model || !year || !plateno) {
        return res.render("g-page", {
            errorMessage: "All car fields are required",
            user: {
                Car_info: {
                    make,
                    model,
                    year,
                    plateno
                }
            },
        });
    }

    try {
        const isLicenseValid = await verifylicense(
            licensenoUser,
            userId
        );
        if (!isLicenseValid) {
            return res.render("g_test", {
                errorMessage: "Invalid License Number",
                user: null,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.render("g_test", {
                errorMessage: "No User Found",
                user: null,
            });
        }

        user.Car_info.make = make.trim();
        user.Car_info.model = model.trim();
        user.Car_info.year = parseInt(year);
        user.Car_info.plateno = plateno.trim();

        await user.save();
        return res.render("g-page", {
            user,
            errorMessage: "Car information updated successfully!",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send("Error updating car information.");
    }
};


