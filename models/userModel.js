const mongoose = require('mongoose');

// Define the schema for User
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // There are three roles for our project
    role: {
        type: String,
        enum: ['admin', 'customer', 'vendor'],
        default: 'normal'
    }
});

// Create the model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
