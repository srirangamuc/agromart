const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const Item = require('../models/itemModel');
const bcrypt = require('bcrypt');
const STRIPE_SECRET_KEY='sk_test_51Q1BEGDvKfDjvcpCsEqOVgaKLyoDU660JD41lqYzQU3G9KUsvFmcDiJ72dLMexorHUr4rC91KPBmMeiJxDZlpgru00gDvBILze'
// console.log(STRIPE_SECRET_KEY)
const stripe = require('stripe')(STRIPE_SECRET_KEY);
// const dotenv = require('dotenv');
// dotenv.config();

class CustomerController{
    async getCustomerDashBoard(req,res){
        try {
            const userId = req.session.userId;
    
            if (!userId) {
                return res.status(401).send('User not authenticated');
            }
    
            const userWithCart = await User.findById(userId).populate('cart.item');
            const items = await Item.find({quantity:{$gt:0}});
    
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
            res.render('customer',{items:displayItems,user:userWithCart})
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    }
    async addToCart(req,res){
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
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    }
    async deleteFromCart(req,res){
        try {
            const { itemId } = req.body;
            const userId = req.session.userId;
    
            if (!userId) {
                return res.status(401).send('User not authenticated');
            }
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            // Find the item in the cart and remove it
            user.cart = user.cart.filter(cartItem => !cartItem.item.equals(itemId));
    
            await user.save();
            res.redirect('/customer');
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    }
    async checkout(req,res){
        const { paymentMethod } = req.body;

    try {
        const user = await User.findById(req.session.userId).populate('cart.item');
        if (!user) {
            return res.status(400).send("User not found.");
        }

        // Filter out any invalid items from the cart
        const itemsToPurchase = user.cart.filter(cartItem => cartItem.item);

        if (itemsToPurchase.length === 0) {
            return res.status(400).send("Your cart is empty or contains invalid items.");
        }

        // Check for sufficient quantity in stock for each item
        for (const cartItem of itemsToPurchase) {
            const item = await Item.findById(cartItem.item._id);
            if (!item || item.quantity < cartItem.quantity || item.quantity <= 0) {
                return res.status(400).send(`Insufficient quantity for item: ${cartItem.item.name}`);
            }
        }

        // Calculate the total amount
        const totalAmount = itemsToPurchase.reduce((total, cartItem) => {
            return total + (cartItem.item.pricePerKg * cartItem.quantity * 1.5);
        }, 0);

        // Apply discounts based on the user's subscription
        let discount = 0;
        if (user.subscription === 'pro') {
            discount = totalAmount * 0.10; // 10% discount
        } else if (user.subscription === 'pro plus') {
            discount = totalAmount * 0.20; // 20% discount
        }

        const finalAmount = totalAmount - discount;

        if (!user.address || !user.address.hno || !user.address.street || !user.address.city || !user.address.state || !user.address.country || !user.address.zipCode) {
            return res.redirect('/customer?error=Please fill in all the required address fields before checkout.');
        }

        if (paymentMethod === 'COD') {
            // Handle Cash on Delivery (COD) payment method
            const purchase = new Purchase({
                user: user._id,
                items: itemsToPurchase.map(cartItem => ({
                    item: cartItem.item._id,
                    name: cartItem.item.name,
                    quantity: cartItem.quantity,
                    pricePerKg: cartItem.item.pricePerKg // Include price
                })),
                purchaseDate: new Date(),
                status: 'received',
                totalAmount: finalAmount,
                address: user.address // Store the final amount in the purchase
            });
            await purchase.save();

            // Update item quantities and remove items with 0 quantity
            for (const cartItem of itemsToPurchase) {
                const item = await Item.findById(cartItem.item._id);
                if (item) {
                    item.quantity -= cartItem.quantity; // Reduce item quantity
                    if (item.quantity <= 0) {
                        await Item.findByIdAndDelete(item._id); // Delete item if quantity is 0
                    } else {
                        await item.save(); // Save updated item if not deleted
                    }
                }
            }

            // Clear the user's cart after purchase
            user.cart = [];
            await user.save();

            return res.redirect('/customer');
        } else if (paymentMethod === 'stripe') {
            // Handle Stripe payment method
            try {
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{
                        price_data: {
                            currency: 'inr',
                            product_data: {
                                name: 'Total Purchase', // Name for the Stripe product
                            },
                            unit_amount: Math.round(finalAmount * 100), // Convert amount to the smallest currency unit
                        },
                        quantity: 1, // Quantity should be 1 since we are sending total price
                    }],
                    mode: 'payment',
                    success_url: `${req.protocol}://${req.get('host')}/customer/success`, // Redirect on success
                    cancel_url: `${req.protocol}://${req.get('host')}/customer/cancel`, // Redirect on cancel
                });

                res.redirect(303, session.url); // Redirect to Stripe checkout page
                const purchase = new Purchase({
                    user: user._id,
                    items: itemsToPurchase.map(cartItem => ({
                        item: cartItem.item._id,
                        name: cartItem.item.name,
                        quantity: cartItem.quantity,
                        pricePerKg: cartItem.item.pricePerKg // Include price
                    })),
                    purchaseDate: new Date(),
                    status: 'received',
                    totalAmount: finalAmount,
                    address: user.address // Store the final amount in the purchase
                });
                await purchase.save();
    
                // Update item quantities and remove items with 0 quantity
                for (const cartItem of itemsToPurchase) {
                    const item = await Item.findById(cartItem.item._id);
                    if (item) {
                        item.quantity -= cartItem.quantity; // Reduce item quantity
                        if (item.quantity <= 0) {
                            await Item.findByIdAndDelete(item._id); // Delete item if quantity is 0
                        } else {
                            await item.save(); // Save updated item if not deleted
                        }
                    }
                }
    
                // Clear the user's cart after purchase
                user.cart = [];
                await user.save();

            } catch (error) {
                console.error("Checkout error:", error);
                return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
            }
        }
    } catch (error) {
        console.error("Checkout error:", error);
        return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
    }
    }
    async success(req,res){
        try {
            const user = await User.findById(req.session.userId).populate('cart.item');
    
            if (!user) {
                return res.status(400).send("User not found.");
            }
    
            const itemsToPurchase = user.cart.filter(cartItem => cartItem.item);
    
            if (itemsToPurchase.length === 0) {
                return res.status(400).send("Your cart is empty or contains invalid items.");
            }
    
            // Calculate the total amount
            const totalAmount = itemsToPurchase.reduce((total, cartItem) => {
                return total + (cartItem.item.pricePerKg * cartItem.quantity * 1.5);
            }, 0);
    
            // Apply discounts based on the user's subscription
            let discount = 0;
            if (user.subscription === 'pro') {
                discount = totalAmount * 0.10; // 10% discount
            } else if (user.subscription === 'pro plus') {
                discount = totalAmount * 0.20; // 20% discount
            }
    
            const finalAmount = totalAmount - discount;
    
            // Save the purchase only after payment is confirmed
            const purchase = new Purchase({
                user: user._id,
                items: itemsToPurchase.map(cartItem => ({
                    item: cartItem.item._id,
                    name: cartItem.item.name,
                    quantity: cartItem.quantity,
                    pricePerKg: cartItem.item.pricePerKg // Include price
                })),
                purchaseDate: new Date(),
                status: 'received',
                totalAmount: finalAmount,
                address: user.address
            });
            await purchase.save();
    
            // Update stock after successful payment
            for (const cartItem of itemsToPurchase) {
                const item = await Item.findById(cartItem.item._id);
                if (item) {
                    item.quantity -= cartItem.quantity; // Reduce item quantity
                    if (item.quantity <= 0) {
                        await Item.findByIdAndDelete(item._id); // Delete item if quantity is 0
                    } else {
                        await item.save(); // Save updated item if not deleted
                    }
                }
            }
    
            // Clear the user's cart after successful purchase
            user.cart = [];
            await user.save();
    
            return res.redirect('/customer/purchases'); // Redirect to purchases page after success
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    }
    async cancel(req,res){
        return res.redirect('/customer/cart');
    }
    async updateProfile(req,res){
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).send('User not authenticated');
            }
    
            const { name, password, hno, street, city, state, zipCode, country } = req.body;
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            // Update name
            if (name) {
                user.name = name;
            }
    
            // Update password
            if (password) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                user.password = hashedPassword;
            }
    
            // Update address fields if provided
            if (hno) {
                user.address.hno = hno;
            }
            if (street) {
                user.address.street = street;
            }
            if (city) {
                user.address.city = city;
            }
            if (state) {
                user.address.state = state;
            }
            if (zipCode) {
                user.address.zipCode = zipCode;
            }
            if (country) {
                user.address.country = country;
            }
    
            await user.save();
            res.redirect('/customer');
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong. Please try again.');
        }
    }
    async logout(req,res){
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Failed to logout');
            }
            res.redirect('/');
        });
    }
    async getPurchases(req,res){
        try {
            const userId = req.session.userId;
    
            if (!userId) {
                return res.status(401).send('User not authenticated');
            }
    
            const purchases = await Purchase.find({ user: userId });
    
            res.json(purchases); // Render a purchases EJS template
        } catch (error) {
            console.error("Purchases error:", error);
            return res.redirect('/customer?error=Something went wrong. Please try again.');
        }
    }
    async getSucess(req, res){
        res.render('success');
    };
    async getFaliure(req,res){
        res.render('failure');
    }
    async purchaseSubscription(req, res){
        const { plan } = req.body; // 'pro' or 'pro plus'
        const userId = req.session.userId;
    
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            let amount;
            if (plan === 'pro') {
                amount = 59900; // ₹599 in paisa
            } else if (plan === 'pro plus') {
                amount = 89900; // ₹899 in paisa
            } else {
                return res.status(400).send('Invalid plan');
            }
    
            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `${plan} subscription`,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${req.protocol}://${req.get('host')}/customer/success-subscription?plan=${plan}`,
                cancel_url: `${req.protocol}://${req.get('host')}/customer/cancel`,
            });
    
            res.redirect(303, session.url);
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    };
    async successSubscription(req, res){
        const { plan } = req.query; // 'pro' or 'pro plus'
        const userId = req.session.userId;
    
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            // Update user's subscription plan
            user.subscription = plan;
            await user.save();
    
            res.redirect('/customer');
        } catch (error) {
            console.error("Checkout error:", error);
            return res.redirect('/customer?error=Something went wrong during checkout. Please try again.');
        }
    };
    async cancelPayment(req, res){
        res.render('cancel'); // Render the cancel EJS page
    };
}




module.exports = new CustomerController()