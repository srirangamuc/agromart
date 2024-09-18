const { checkRole } = require('../middleware/roleMiddleware');
const mongoose = require("mongoose")
const Item = require("../models/itemModel")

// General dashboard route (all users have access)
exports.getDashboard = (req, res) => {
    res.render('dashboard'); // Render a general dashboard page
};

// Admin dashboard (restricted to admin users)
exports.getAdminDashboard = [checkRole(['admin']), (req, res) => {
    res.render('admin');
}];

// Vendor dashboard (restricted to vendor users)
exports.getVendorDashboard = [checkRole(['vendor']), async (req, res) => {
    const vendorId = req.session.userId;
    const products = await Item.find({ vendor:vendorId });
    res.render('vendor',{products});
}];
