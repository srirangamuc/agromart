const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const Item = require('../models/itemModel');
const bcrypt = require('bcrypt');

// Get customer dashboard
exports.getCustomerDashBoard = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const userWithCart = await User.findById(userId).populate('cart.item'); // Ensure this populates correctly
        const items = await Item.find();

        // Create a unique item list with average prices
        const uniqueItems = {};

        items.forEach(item => {
            if (uniqueItems[item.name]) {
                uniqueItems[item.name].total += item.pricePerKg;
                uniqueItems[item.name].count += 1;
            } else {
                uniqueItems[item.name] = {
                    ...item.toObject(),
                    total: item.pricePerKg,
                    count: 1
                };
            }
        });

        const displayItems = Object.values(uniqueItems).map(item => ({
            ...item,
            averagePrice: (item.total / item.count).toFixed(2) // Calculate average price
        }));

        res.render('customer', { items: displayItems, user: userWithCart });
    } catch (error) {
        console.error("Error fetching customer dashboard:", error);
        res.status(500).send("Server error");
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const quantityInt = parseInt(quantity, 10);
        if (isNaN(quantityInt) || quantityInt <= 0) {
            return res.status(400).send('Invalid quantity');
        }

        const existingItem = user.cart.find(item => item.item.equals(itemId));
        if (existingItem) {
            existingItem.quantity += quantityInt;
        } else {
            user.cart.push({ item: itemId, quantity: quantityInt });
        }

        await user.save();
        res.redirect('/customer');
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).send('Server error');
    }
};

// Checkout functionality
// Checkout functionality
exports.checkout = async (req, res) => {
    const { paymentMethod } = req.body;

    try {
        const user = await User.findById(req.session.userId).populate('cart.item');

        if (!user) {
            return res.status(400).send("User not found.");
        }

        // Check for valid items in the cart
        const itemsToPurchase = user.cart.filter(cartItem => cartItem.item);

        if (itemsToPurchase.length === 0) {
            return res.status(400).send("Your cart is empty or contains invalid items.");
        }

        if (paymentMethod === 'COD') {
            // Create a new purchase
            const purchase = new Purchase({
                user: user._id,
                items: itemsToPurchase.map(cartItem => ({
                    item: cartItem.item._id,
                    name: cartItem.item.name,
                    quantity: cartItem.quantity,
                    pricePerKg: cartItem.item.pricePerKg // Include price
                })),
                purchaseDate: new Date(), // Add purchase date
                status: 'received' // Default status
            });
            await purchase.save();

            // Clear the cart after purchase
            user.cart = [];
            await user.save(); // Save the updated user with cleared cart

            res.redirect('/customer/purchases');
        } else if (paymentMethod === 'stripe') {
            const totalAmount = itemsToPurchase.reduce((total, cartItem) => {
                return total + (cartItem.item.pricePerKg * cartItem.quantity);
            }, 0);

            try {
                // Create Stripe checkout session
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: itemsToPurchase.map(cartItem => ({
                        price_data: {
                            currency: 'inr', // Set currency to INR
                            product_data: {
                                name: cartItem.item.name,
                            },
                            unit_amount: Math.round(cartItem.item.pricePerKg * 100), // Amount in paisa (1 INR = 100 paisa)
                        },
                        quantity: cartItem.quantity,
                    })),
                    mode: 'payment',
                    success_url: `${req.protocol}://${req.get('host')}/customer/success`,
                    cancel_url: `${req.protocol}://${req.get('host')}/customer/cancel`,
                });

                res.redirect(303, session.url);
            } catch (error) {
                console.error("Stripe checkout error:", error);
                res.status(500).send("Payment error");
            }
        }
    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).send("Server error");
    }
};



// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const { username, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (username) {
            user.name = username;
        }

        if (password) {
            // Hash the new password before saving
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            user.password = hashedPassword;
        }

        await user.save();
        res.redirect('/customer');
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send("Server error");
    }
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.redirect('/login');
    });
};

// Get user's purchases
exports.getPurchases = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const purchases = await Purchase.find({ user: userId });

        res.render('purchases', { purchases }); // Render a purchases EJS template
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).send("Server error");
    }
};
