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
        hno:{type:String,default : null},
        street: { type: String, default : null },
        city: { type: String, default : null },
        state: { type: String, default : null },
        country:{type:String, default : null},
        zipCode: { type: String, default : null }
    }
});

// Create the model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
