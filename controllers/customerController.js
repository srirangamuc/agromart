const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const Item = require('../models/itemModel');
const bcrypt = require('bcrypt');
const STRIPE_SECRET_KEY='sk_test_51Q1BEGDvKfDjvcpCsEqOVgaKLyoDU660JD41lqYzQU3G9KUsvFmcDiJ72dLMexorHUr4rC91KPBmMeiJxDZlpgru00gDvBILze'
// console.log(STRIPE_SECRET_KEY)
const stripe = require('stripe')(STRIPE_SECRET_KEY);
// const dotenv = require('dotenv');
// dotenv.config();


// dotenv.config();
const productImages = {
    "Apple": "download-apples-png-image-red-apple-fruit-10.png",
    "Banana": "fresh-yellow-banana-fruit-free-png.webp",
    "Orange": "purepng.com-orange-orangesorangefruitbitter-orangeorangesclip-art-1701527337017aqfwq.png",
    "Grapes": "grapes-isolated-on-transparent-background-grape-clip-art-generative-ai-png.webp",
    "Strawberry": "purepng.com-strawberrystrawberrygenus-fragariastrawberriesfruitbotanical-berrybright-red-colorjuicy-texture-1701527399030cd1x5.png",
    "Blueberry": "blueberry.gif",
    "Watermelon": "watermelon.gif",
    "Pineapple": "pinapple image.png",
    "Mango": "Mango-PNG-Picture.png",
    "Peach": "peach-png-transparent-picture-1.png",
    "Plum": "plum.gif",
    "Cherry": "cherry.png",
    "Kiwi": "kiwi-fruit-transparent-background-free-png.webp",
    "Lemon": "Fresh-lemon-with-leaves-isolated-on-transparent-background-PNG.png",
    "Lime": "purepng.com-limelimelemonhybrid-citrus-fruitroundlime-greenpersian-lime-17015273304120hpww.png",
    "Avocado": "OIP (1).jpeg",  // assuming a placeholder image
    "Carrot": "purepng.com-carrotscarrotvegetablesfreshdeliciousefoodhealthycarrots-481521740717jmglq.png",
    "Broccoli": "broccoli.webp",  // assuming a placeholder image
    "Spinach": "spinach-transparent-background-png.webp",
    "Kale": "kale.gif",
    "Tomato": "tomato.jpg",  // assuming a placeholder image
    "Cucumber": "isolated-cucumber-one-fresh-cucumber-isolated-transparent-background_542607-5441.jpg",
    "Bell Pepper": "483-4832162_bell-pepper-png-photo-background-bell-pepper-png.png",
    "Zucchini": "zucchini.png",
    "Eggplant": "eggplant-background-6.png",
    "Potato": "Potato-Transparent-Background.png",
    "Sweet Potato": "sweet-potato-transparent-background-png.webp",
    "Onion": "Onion-PNG-File.png",
    "Garlic": "garlic.gif",
    "Radish": "White-Radish-Transparent-Image.png",
    "Beetroot": "beetroot-transparent-background-png.webp"
};

// Get customer dashboard
exports.getCustomerDashBoard = async (req, res) => {
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
        res.render('customer',{items:displayItems,user:userWithCart,productImages:productImages})
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



// Delete item from cart
exports.deleteFromCart = async (req, res) => {
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
        console.error('Error in deleteFromCart:', error);
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

            return res.redirect('/customer/purchases');
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
                console.error("Stripe checkout error:", error);
                return res.status(500).send("Payment error");
            }
        }
    } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).send("Server error");
    }
};

// Success route - finalize the purchase and update stock only after successful payment
exports.success = async (req, res) => {
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
        console.error("Payment success error:", error);
        return res.status(500).send("Server error");
    }
};

// Cancel route - no changes made when the payment is cancelled
exports.cancel = (req, res) => {
    return res.redirect('/customer/cart'); // Simply redirect to the cart, no changes made
};


// Update profile 
exports.updateProfile = async (req, res) => {
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
        res.redirect('/');
    });
};

// Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.redirect('/');
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
exports.getSucess = (req, res) => {
    res.render('success');
};

exports.getFaliure = (req,res) =>{
    res.render('failure');
}
// New function for subscription purchase
exports.purchaseSubscription = async (req, res) => {
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
        console.error('Stripe subscription error:', error);
        res.status(500).send('Server error');
    }
};

// Subscription success handler
exports.successSubscription = async (req, res) => {
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
        console.error('Subscription success error:', error);
        res.status(500).send('Server error');
    }
};
exports.cancelPayment = (req, res) => {
    res.render('cancel'); // Render the cancel EJS page
};