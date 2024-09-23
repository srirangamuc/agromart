const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const Item = require('../models/itemModel');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure to initialize Stripe

exports.getCustomerDashBoard = async (req, res) => {
    try {
        const items = await Item.find(); // Get all items
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        const userWithCart = await User.findById(userId).populate('cart.item'); // Fetch user with populated cart
        res.render('customer', { items, user: userWithCart }); // Pass both items and user to the view
    } catch (error) {
        console.error("Error fetching customer dashboard:", error); // Log the error for debugging
        res.status(500).send("Server error");
    }
};

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

        // Convert quantity to integer
        const quantityInt = parseInt(quantity, 10);
        if (isNaN(quantityInt) || quantityInt <= 0) {
            return res.status(400).send('Invalid quantity');
        }

        // Check if item already exists in the user's cart
        const existingItem = user.cart.find(item => item.item.equals(itemId));
        if (existingItem) {
            existingItem.quantity += quantityInt; // Update quantity
        } else {
            user.cart.push({ item: itemId, quantity: quantityInt }); // Add new item to cart
        }

        await user.save(); // Save the updated user with cart
        res.redirect('/customer');
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).send('Server error');
    }
};

exports.checkout = async (req, res) => {
    const { paymentMethod } = req.body;

    try {
        const user = await User.findById(req.session.userId).populate('cart.item');

        if (!user) {
            return res.status(400).send("User not found.");
        }

        if (paymentMethod === 'COD') {
            // Create a new purchase
            const purchase = new Purchase({
                user: user._id,
                items: user.cart.map(cartItem => ({
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
            const totalAmount = user.cart.reduce((total, cartItem) => {
                return total + (cartItem.item.pricePerKg * cartItem.quantity);
            }, 0);

            try {
                // Create Stripe checkout session
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: user.cart.map(cartItem => ({
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

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ user: req.session.userId }).populate('items.item');

        // Convert purchaseDate to a string for each purchase
        purchases.forEach(purchase => {
            purchase.dateString = purchase.purchaseDate.toString();
        });

        res.render('purchases', { purchases });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).send("Server error");
    }
};
