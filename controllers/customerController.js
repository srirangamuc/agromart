const Item = require('../models/itemModel');
const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');

// GET: Customer dashboard to view all unique products
exports.getCustomerDashboard = async (req, res) => {
    try {
        // Fetch all unique products
        const products = await Item.aggregate([
            { $group: { _id: "$name", totalQuantity: { $sum: "$quantity" } } }
        ]);

        res.render('customer', { products });
    } catch (error) {
        console.error("Error fetching customer dashboard:", error);
        res.status(500).send('Server error');
    }
};

// GET: Product details (show weighted average price)
exports.getProductDetails = async (req, res) => {
    try {
        const productName = req.params.name;

        // Fetch all vendors who sell the product
        const items = await Item.find({ name: productName });

        if (items.length === 0) {
            return res.status(404).send('Product not found');
        }

        // Calculate weighted average price
        let totalQuantity = 0;
        let totalPrice = 0;

        items.forEach(item => {
            totalQuantity += item.quantity;
            totalPrice += item.pricePerKg * item.quantity;
        });

        const avgPrice = totalPrice / totalQuantity;
        const finalPrice = avgPrice * 1.10; // Add 10% to the price

        res.render('productDetails', {
            productName,
            finalPrice,
            totalQuantity
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send('Server error');
    }
};

// POST: Customer buying a product
exports.buyProduct = async (req, res) => {
    try {
        const { name, quantity } = req.body;
        let remainingQuantity = parseInt(quantity, 10);

        // Fetch all vendors for the product, ordered by their listing time
        const items = await Item.find({ name }).sort({ _id: 1 });

        if (!items || items.length === 0) {
            return res.status(404).send('Product not found');
        }

        const customerId = req.session.userId;
        let totalPrice = 0;

        // Deduct quantities and calculate price
        for (const item of items) {
            if (remainingQuantity === 0) break;

            if (item.quantity >= remainingQuantity) {
                totalPrice += remainingQuantity * item.pricePerKg;
                item.quantity -= remainingQuantity;
                await item.save();
                remainingQuantity = 0;
            } else {
                totalPrice += item.quantity * item.pricePerKg;
                remainingQuantity -= item.quantity;
                item.quantity = 0;
                await item.save();
            }
        }

        if (remainingQuantity > 0) {
            return res.status(400).send('Insufficient stock available');
        }

        const finalPrice = totalPrice * 1.10; // Add 10% markup

        // Record the purchase
        const newPurchase = new Purchase({
            customer: customerId,
            product: name,
            quantity,
            totalPrice: finalPrice
        });
        await newPurchase.save();

        res.redirect('/customer'); // Redirect back to customer dashboard after purchase
    } catch (error) {
        console.error("Error processing purchase:", error);
        res.status(500).send('Server error');
    }
};
