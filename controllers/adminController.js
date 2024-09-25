// controllers/adminController.js
const Purchase = require('../models/purchaseModel')
const User = require('../models/userModel');

exports.getAdminDashboard = async (req, res) => {
    try {
        // Get all purchases
        const purchases = await Purchase.find().populate('user').exec();
        console.log("Purchases:", purchases); // Log purchases for debugging

        // Get the last 5 added customers and vendors
        const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(5);
        console.log("Customers:", customers); // Log customers for debugging
        const vendors = await User.find({ role: 'vendor' }).sort({ createdAt: -1 }).limit(5);
        console.log("Vendors:", vendors); // Log vendors for debugging

        res.render('admin', { purchases, customers, vendors });
    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        res.status(500).send("Server error");
    }
};

exports.updatePurchaseStatus = async (req, res) => {
    const { purchaseId, status } = req.body; // Get purchaseId and new status from request body
    try {
        const purchase = await Purchase.findByIdAndUpdate(purchaseId, { status }, { new: true });
        if (!purchase) {
            return res.status(404).send("Purchase not found");
        }
        res.redirect('/admin/dashboard'); // Redirect to the admin dashboard
    } catch (error) {
        console.error("Error updating purchase status:", error);
        res.status(500).send("Server error");
    }
};
