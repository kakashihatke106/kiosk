const express = require('express');
const session = require("express-session");
const User = require("./models/userinfo.js");
const app = express();
const mongoose = require("mongoose");

const {
    login,
    signup,
    profiletoDisplay,
    profiletoUpdate,
} = require("./controller/usercontroller.js");
const {
    G2_showPage,
    G2_updatePage,
    G_showPage
} = require("./controller/update_g2.js");
const driver = require("./middleware/driver.js");
const admin = require("./middleware/admin.js");
const Appointment = require("./models/newappoinments.js");




app.use(express.static("public"));
const connect = async () => {
    try {
        await mongoose.connect('mongodb+srv://dikshasamotra:diksha123@drivetest.l3ggm.mongodb.net/?retryWrites=true&w=majority&appName=Drivetest')
        console.log('Database is connected')
    } catch (error) {
        console.log('Error in Database Connection', error)
    }
}
connect();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));



// Login Session configuration
app.use(
    session({
        secret: "diksha",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false
        },
    })
);


app.use((req, res, next) => {
    res.locals.loggedIn = req.session && req.session.userId ? true : false;
    res.locals.userType = req.session.userType || null;
    next();
});


// Routes


// Dashboard page
app.get("/", (req, res) => {
    res.render("dashboard", { userType: req.session.userType || null });
});

// Login page
app.get("/login", (req, res) =>
    res.render("login", { errorMessage: null })
);
app.post("/login", login);


// Logout page
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        res.redirect("/login");
    });
});

// Signup page
app.get("/signup", (req, res) =>
    res.render("signup", { errorMessage: null })
);
app.post("/signup", signup);

// First Login and Updating Profile
app.get("/g-modifypage/:userId", profiletoDisplay);
app.post("/g-modifypage/:userId", profiletoUpdate);


// G2 Form Display and Submission 
app.get("/g2-page", driver, G2_showPage);

app.get("/g2-page", driver, G2_updatePage);
app.post("/g2-page", driver, G2_updatePage);

// DISPLAY G PAGE
app.get("/g-page", driver, G_showPage);

// DISPLAY APPOINTMENTS PAGE
app.get("/appointments", admin, async (req, res) => {
    try {
        const dateSelect = req.query.date || new Date().toISOString().split('T')[0];
        const appointments = await Appointment.find();
        const appBooked = await Appointment.find({ date: dateSelect });
        const bookedSlots = appBooked.map(app => app.time);

        res.render("appointments", {
            appointments,
            dateSelect,
            bookedSlots,
            errorMessage: null,
            successMessage: req.query.successMessage || null,
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.render("appointments", {
            appointments: [],
            dateSelect: null,
            bookedSlots: [],
            errorMessage: "Failed to load appointments. Please try again.",
            successMessage: null,
        });
    }
});

app.post("/appointments", admin, async (req, res) => {
    const { date, time } = req.body;

    try {
        const existingSlot = await Appointment.findOne({ date, time });
        if (existingSlot) {
            return res.render("appointments", {
                errorMessage: `Time slot ${time} on ${date} is already booked.`,
                dateSelect: date,
                bookedSlots: (await Appointment.find({ date })).map(app => app.time),
                appointments: await Appointment.find(),
                successMessage: null,
            });
        }

        const newAppointment = new Appointment({ date, time });
        await newAppointment.save();

        res.render("appointments", {
            successMessage: `Slot for ${time} on ${date} added successfully!`,
            dateSelect: date,
            bookedSlots: (await Appointment.find({ date })).map(app => app.time),
            appointments: await Appointment.find(),
            errorMessage: null,
        });
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.render("appointments", {
            errorMessage: "Failed to create appointment. Please try again.",
            dateSelect: date,
            bookedSlots: [],
            appointments: [],
            successMessage: null,
        });
    }
});


// Route to handle booking appointments
app.post("/appBooking", driver, async (req, res) => {
    const { date, time } = req.body;

    if (!date || !time) {
        return res.render("g2-page", {
            errorMessage: "All fields are required.",
            successMessage: null,
            appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
            user: await UserData.findById(req.session.userId),
            currentDate: date || new Date().toISOString().split("T")[0],
        });
    }

    try {
        const appointment = await Appointment.findOne({ date, time, isTimeSlotAvailable: true });

        if (!appointment) {
            return res.render("g2-page", {
                errorMessage: "Selected time slot is no longer available.",
                successMessage: null,
                appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
                user: await UserData.findById(req.session.userId),
                currentDate: date,
            });
        }

        appointment.isTimeSlotAvailable = false;
        await appointment.save();

        const user = await User.findById(req.session.userId);
        user.appointmentId = appointment._id;
        await user.save();

        res.render("g2-page", {
            successMessage: "Appointment booked successfully!",
            errorMessage: null,
            appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
            user,
            currentDate: date,
        });
    } catch (error) {
        console.error("Error booking appointment:", error);
        res.render("g2-page", {
            errorMessage: "Error booking appointment. Please try again later.",
            successMessage: null,
            appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
            user: await User.findById(req.session.userId),
            currentDate: date,
        });
    }
});



// **************************
app.get("/g2_test", driver, async (req, res) => {
    try {
        const currentDate = new Date().toISOString().split("T")[0];
        const user = await User.findById(req.session.userId);
        const appointments = await Appointment.find({
            date: currentDate,
            isTimeSlotAvailable: true,
        });

        res.render("g2-page", {
            user,
            appointments,
            currentDate,
            errorMessage: null,
            successMessage: null,
        });
    } catch (error) {
        console.error("Error fetching G2 data:", error);
        res.render("g2-page", {
            user: null,
            appointments: [],
            currentDate: new Date().toISOString().split("T")[0],
            errorMessage: "Error loading G2 page. Please try again later.",
            successMessage: null,
        });
    }
});

app.post("/g2-page", async (req, res) => {
    const { date, time } = req.body;

    try {
        const appointment = await Appointment.findOne({ date, time, isTimeSlotAvailable: true });

        if (!appointment) {
            return res.render("g2-page", {
                errorMessage: "Selected time slot is no longer available.",
                appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
                user: req.session.userId,
                currentDate: date,
            });
        }

        appointment.isTimeSlotAvailable = false;
        await appointment.save();

        const user = await User.findById(req.session.userId);
        user.appointmentId = appointment._id;
        await user.save();

        res.redirect("/g2-page");
    } catch (error) {
        console.error("Error booking appointment:", error);
        res.render("g2-page", {
            errorMessage: "Error booking appointment. Please try again later.",
            appointments: await Appointment.find({ date, isTimeSlotAvailable: true }),
            user: req.session.userId,
            currentDate: date,
        });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
