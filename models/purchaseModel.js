const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        pricePerKg: {
            type: Number,
            required: true
        }
    }],
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'received', 'delivered'],
        default: 'received' // Default status
    },
    totalAmount:{
        type:Number,
        required:true
    }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
