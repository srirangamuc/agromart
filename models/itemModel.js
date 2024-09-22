const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
