const Purchase = require('../models/purchaseModel');
const User = require('../models/userModel');
const Item = require('../models/itemModel'); // Import the Item model

exports.getAdminDashboard = async (req, res) => {
    try {
        // Fetch purchases
        const purchases = await Purchase.find().populate('user').exec();
        
        // Fetch customers grouped by subscription
        const proPlusCustomers = await User.find({ role: 'customer', subscription: 'pro plus' }).sort({ createdAt: -1 });
        const proCustomers = await User.find({ role: 'customer', subscription: 'pro' }).sort({ createdAt: -1 });
        const normalCustomers = await User.find({ role: 'customer', subscription: 'normal' }).sort({ createdAt: -1 });

        // Fetch vendors
        const vendors = await User.find({ role: 'vendor' }).sort({ createdAt: -1 });

        res.render('admin', {
            purchases,
            proPlusCustomers,
            proCustomers,
            normalCustomers,
            vendors
        });
    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.status(500).send('Server error');
    }
};

// Update Purchase Status
exports.updatePurchaseStatus = async (req, res) => {
    const { purchaseId, status } = req.body; // Get purchaseId and new status from request body
    try {
        const purchase = await Purchase.findByIdAndUpdate(purchaseId, { status }, { new: true });
        if (!purchase) {
            return res.status(404).send("Purchase not found");
        }
        res.redirect('/admin/dashboard'); // Redirect to the admin dashboard after updating
    } catch (error) {
        console.error("Error updating purchase status:", error);
        res.status(500).send("Server error");
    }
};
