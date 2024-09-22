const Item = require('../models/itemModel');
const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const bcrypt = require('bcrypt');

// GET: Customer dashboard to view all unique products and display cart and profile data
exports.getCustomerDashboard = async (req, res) => {
    try {
        // Fetch all unique products
        const products = await Item.aggregate([
            { $group: { _id: "$name", totalQuantity: { $sum: "$quantity" } } }
        ]);

        // Fetch user data
        const user = await User.findById(req.session.userId);

        // Fetch purchases for the cart (based on the current user's session)
        const cart = await Purchase.find({ customer: req.session.userId });

        res.render('customer', { products, user, cart });
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

        res.redirect('/customer');
    } catch (error) {
        console.error("Error processing purchase:", error);
        res.status(500).send('Server error');
    }
};

// GET: Fetch user profile (now part of the dashboard)
exports.getProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('profile', { user });
    } catch (error) {
        console.error("Error fetching profile details:", error);
        res.status(500).send('Server error');
    }
};

// POST: Update profile details within customer dashboard
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.name = name || user.name;
        user.email = email || user.email;

        if (password && password.length > 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        await user.save();

        const cart = await Purchase.find({ customer: userId });

        res.render('customer', { products: [], user, cart });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send('Server error');
    }
};

// POST: Add to cart
exports.addToCart = async (req, res) => {
    try {
        const { name, quantity } = req.body;
        const customerId = req.session.userId;

        // Check if the product already exists in the cart
        let existingPurchase = await Purchase.findOne({ customer: customerId, product: name });

        if (existingPurchase) {
            // Update quantity if the product is already in the cart
            existingPurchase.quantity += parseInt(quantity, 10);
            await existingPurchase.save();
        } else {
            // Add new product entry to the cart
            const newPurchase = new Purchase({
                customer: customerId,
                product: name,
                quantity,
                totalPrice: 0 // Total price will be calculated during checkout
            });
            await newPurchase.save();
        }

        res.redirect('/customer');
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).send('Server error');
    }
};

// POST: Update cart quantity (increase or decrease)
exports.updateCartQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const customerId = req.session.userId;

        const purchase = await Purchase.findOne({ customer: customerId, product: productId });

        if (!purchase) {
            return res.status(404).send('Item not found in cart');
        }

        purchase.quantity = quantity;
        await purchase.save();

        res.redirect('/checkout');
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).send('Server error');
    }
};

// GET: Checkout page with cart summary and payment options
exports.getCheckoutPage = async (req, res) => {
    try {
        const customerId = req.session.userId;
        const cart = await Purchase.find({ customer: customerId });

        if (!cart || cart.length === 0) {
            return res.status(400).send('Your cart is empty');
        }

        // Calculate total price
        let totalAmount = 0;
        cart.forEach(item => {
            totalAmount += item.totalPrice;
        });

        res.render('checkout', { cart, totalAmount });
    } catch (error) {
        console.error("Error loading checkout page:", error);
        res.status(500).send('Server error');
    }
};

// POST: Complete the purchase
exports.completePurchase = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        const customerId = req.session.userId;

        const cart = await Purchase.find({ customer: customerId });

        if (!cart || cart.length === 0) {
            return res.status(400).send('No items in cart to purchase');
        }

        // Process payment (implement Stripe or COD here)
        if (paymentMethod === 'stripe') {
            // Implement Stripe payment logic here
        } else if (paymentMethod === 'cod') {
            // Handle cash on delivery logic here
        }

        // Clear the cart after purchase
        await Purchase.deleteMany({ customer: customerId });

        res.render('orderConfirmation', { message: "Purchase completed successfully!" });
    } catch (error) {
        console.error("Error completing purchase:", error);
        res.status(500).send('Server error');
    }
};
