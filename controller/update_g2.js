const User = require("../models/userinfo.js");
const Appointment = require("../models/newappoinments.js")


// Controller to update G2 form
module.exports.G2_updatePage = async (req, res) => {
    console.log("Received form data:", req.body);
    const { licenseno, make, model, year, plateno } = req.body;

    if (!licenseno || !make || !model || !year || !plateno) {
        return res.status(400).send("All fields are required.");
    }

    try {
        await User.findByIdAndUpdate(req.session.userId, {
            licenseno: licenseno.trim(),
            Car_info: {
                make: make.trim(),
                model: model.trim(),
                year: parseInt(year, 10),
                plateno: plateno.trim(),
            },
        });

        res.redirect("/g2-page");
    } catch (error) {
        console.error("Error updating user data:", error);
        res.status(500).render("g-modifypage", { user: req.body, errorMessage: "Unable to save G2 Information." })
    }
};



module.exports.G2_showPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        const currentDate = new Date().toISOString().split("T")[0];
        const appointments = await Appointment.find({
            date: currentDate,
            isTimeSlotAvailable: true,
        });

        res.render("g2-page", {
            user,
            appointments,
            currentDate,
            successMessage: req.query.successMessage || null,
            errorMessage: null,
        });
    } catch (error) {
        res.status(500).render("g2-page", {
            user: {},
            currentDate: new Date().toISOString().split("T")[0],
            appointments: [],
            successMessage: null,
            errorMessage: "Error loading G2 page.",
        });
    }
};


module.exports.G_showPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send("User not found");

        const hasDefaultData =
            user.firstName === " " &&
            user.lastName === " " &&
            user.licenseno === " " &&
            (!user.Car_info.make || user.Car_info.make === " ") &&
            (!user.Car_info.model || user.Car_info.model === " ") &&
            (!user.Car_info.year || isNaN(user.Car_info.year)) &&
            (!user.Car_info.plateno || user.Car_info.plateno === " ");

        if (hasDefaultData) {
            return res.redirect("/g2-page");
        }

        res.render("g-page", { user, errorMessage: null });
    } catch (error) {
        console.error("Error fetching user data for G page:", error);
        res.status(500).render("g_test", {
            user: {},
            errorMessage: "Error loading G page. Please try again later.",
        });
    }
};