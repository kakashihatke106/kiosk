const mongoose = require("mongoose");
const bcrypt = require('bcrypt');


const UserDataScheme = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        enum: ["Driver", "Examiner", "Admin"],
        required: true,
    },


    firstName: {
        type: String,
        default: " ",
    },

    lastName: {
        type: String,
        default: " ",
    },

    licenseno: {
        type: String,
        default: " ",
    },

    age: {
        type: Number,
        default: null,
    },

    dob: {
        type: Date,
        default: null,
    },

    Car_info: {
        make: {
            type: String, default: " "
        },

        model: {
            type: String, default: " "
        },

        year: {
            type: Number, default: null
        },

        plateno: {
            type: String, default: " "
        },
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        default: null,
    },
});


UserDataScheme.pre("save", async function (next) {
    if (this.isModified("licenseno")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.licenseno = await bcrypt.hash(this.licenseno, salt);
        } catch (error) {
            return next(error);
        }
    }
    if (this.isModified("password")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
            return next(error);
        }
    }
    next();
});


const User = mongoose.model("UserInfo", UserDataScheme);
module.exports = User;