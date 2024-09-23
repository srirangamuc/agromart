const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the vendor (User)
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    profit: { type: Number, required: true } // Computed as quantity * pricePerKg
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
