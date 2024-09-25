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
        res.redirect('/admin'); // Redirect to the admin dashboard after updating
    } catch (error) {
        console.error("Error updating purchase status:", error);
        res.status(500).send("Server error");
    }
};

exports.getCustomerAnalysis = async (req, res) => {
    try {
        const proPlusCount = await User.countDocuments({ subscription: 'pro plus' });
        const proCount = await User.countDocuments({ subscription: 'pro' });
        const normalCount = await User.countDocuments({ subscription: 'normal' });

        // Return data as JSON for frontend usage
        res.json({ proPlusCount, proCount, normalCount });
    } catch (error) {
        console.error('Error fetching customer analysis data:', error);
        res.status(500).json({ message: 'Error fetching customer analysis data' });
    }
};

exports.getPurchasesAnalysis = async (req, res) => {
    try {
        const purchases = await Purchase.find().populate('items.item');
        const itemQuantities = {};

        purchases.forEach(purchase => {
            purchase.items.forEach(item => {
                const itemName = item.name;
                const quantity = item.quantity;

                if (itemQuantities[itemName]) {
                    itemQuantities[itemName] += quantity;
                } else {
                    itemQuantities[itemName] = quantity;
                }
            });
        });

        const itemNames = Object.keys(itemQuantities);
        const quantities = Object.values(itemQuantities);

        res.json({ itemNames, quantities });
    } catch (error) {
        console.error('Error fetching purchases analysis:', error);
        res.status(500).send('Internal Server Error');
    }
};