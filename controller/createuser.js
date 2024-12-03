const User = require("../models/userinfo.js");

module.exports.createUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            age,
            dob,
            licenseno,
            make,
            model,
            year,
            plateno,
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !age ||
            !dob ||
            !licenseno ||
            !make ||
            !model ||
            !year ||
            !plateno
        ) {
            return res.status(400).send("All fields are required");
        }

        const parsedDob = new Date(dob);
        if (isNaN(parsedDob.getTime())) {
            return res.status(400).send("Invalid Date of Birth.");
        }

        const today = new Date();
        let calculatedAge = today.getFullYear() - parsedDob.getFullYear();
        if (
            today.getMonth() < parsedDob.getMonth() ||
            (today.getMonth() === parsedDob.getMonth() &&
                today.getDate() < parsedDob.getDate())
        ) {
            calculatedAge--;
        }

        if (parseInt(age) !== calculatedAge) {
            return res.status(400).send("Mis-match in Age and DOB");
        }

        if (calculatedAge < 18) {
            return res.status(400).send("Age requirements not met.(min 18)");
        }

        const user = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            age: calculatedAge,
            dob: parsedDob,
            licenseno: licenseno.trim(),
            Car_info: {
                make: make.trim(),
                model: model.trim(),
                year: parseInt(year),
                plateno: plateno.trim(),
            },
        });
        await user.save();
        res.redirect("/g2-page");
    } catch (error) {
        console.error("Error saving user", error);
        res.status(500).send("Error saving your data to the DB");
    }
};
