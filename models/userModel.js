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
    },
    cart:[{
        item:{type:mongoose.Schema.Types.ObjectId,ref:'Item'},
        quantity:{type:Number,required:true}
    }],
    subscription: {
        type: String,
        enum: ['normal', 'pro', 'pro plus'],
        default: 'normal'
    },
    address: {
        hno:{type:String,required:true},
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country:{type:String,required:true},
        zipCode: { type: String, required: true }
    }
});

// Create the model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
