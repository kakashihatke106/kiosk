const User = require("../models/userinfo.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


// for Signup
module.exports.signup = async (req, res) => {
    const { username, password, confirmPassword, userType } = req.body;

    if (!username || !password || !confirmPassword || !userType) {
        return res.render("signup", { errorMessage: "Enter all the fields" });
    }

    if (password !== confirmPassword) {
        return res.render("signup", { errorMessage: "Passwords Mis-match" });
    }

    try {
        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.render("signup", { errorMessage: "Username is already existing. Try Another" });
        }

        const user = new User({
            username: username.trim(),
            password: password,
            userType,
            Car_info: { make: "", model: "", year: null, plateno: "" },
        });
        await user.save();
        res.redirect("/login");
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).send("Error signing up.");
    }
};


// for login 
module.exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render("login", {
            errorMessage: "Either Username or password missing. Please enter both.",
        });
    }

    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.render("login", {
                errorMessage: "Unable to find the user. Sign up First to continue",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.render("login", {
                errorMessage: "Invalid username or password",
            });
        }

        req.session.userId = user._id;
        req.session.userType = user.userType;

        if (
            user.firstName === " " &&
            user.lastName === " " &&
            user.licenseno === " "
        ) {
            res.redirect(`/g-modifypage/${user._id}`);
        } else {
            res.redirect("/");
        }





    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Error logging in.");
    }
};



// Controller Fucntion display user profile for editing
module.exports.profiletoDisplay = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        if (!user.Car_info) {
            user.Car_info = { make: "", model: "", year: null, plateno: "" };
        }
        res.render("g-modifypage", { user, errorMessage: null });
    } catch (error) {
        console.error("Error fetching user for profile update:", error);
        res.status(500).send("Error loading update page.");
    }
};


// Controller Fucntion to update profile information
module.exports.profiletoUpdate = async (req, res) => {
    const {
        firstName,
        lastName,
        licenseno,
        dob,
        age,
        make,
        model,
        year,
        plateno,
    } = req.body;

    const parsedDob = new Date(dob);
    let errorMessage = null;

    if (isNaN(parsedDob.getTime())) {
        errorMessage = "Invalid Date of Birth.";
    } else {
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
            errorMessage = "Age and Date of Birth don't match.";
        } else if (calculatedAge < 18) {
            errorMessage = "You must be at least 18 years old to continue.";
        }
    }

    if (errorMessage) {
        const user = await User.findById(req.params.userId);
        // Ensure Car_info is always initialized before rendering
        if (!user.Car_info) {
            user.Car_info = { make: "", model: "", year: null, plateno: "" };
        }
        return res.render("g-modifypage", { user, errorMessage });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            {
                firstName,
                lastName,
                licenseno,
                dob: parsedDob,
                age: parseInt(age),
                Car_info: {
                    make: make || "",
                    model: model || "",
                    year: parseInt(year) || null,
                    plateno: plateno || "",
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found.");
        }

        res.redirect("/"); // Redirect to the dashboard or another page after successful update
    } catch (error) {
        console.error("Error updating profile:", error);
        const user = await User.findById(req.params.userId);
        if (!user.Car_info) {
            user.Car_info = { make: "", model: "", year: null, plateno: "" };
        }
        res.render("g-modifypage", { user, errorMessage: "Error updating profile. Please try again." });
    }
};

