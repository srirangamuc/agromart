const Item = require('../models/itemModel');
const Vendor = require('../models/vendorModel');
const User = require('../models/userModel');
// Predefined list of allowed fruits and vegetables
const bcrypt = require('bcrypt');
const allowedProducts = [
    "Apple", "Banana", "Orange", "Grapes", "Strawberry", "Blueberry", "Watermelon",
    "Pineapple", "Mango", "Peach", "Plum", "Cherry", "Kiwi", "Lemon", "Lime", "Avocado",
    "Carrot", "Broccoli", "Spinach", "Kale", "Tomato", "Cucumber", "Bell Pepper", "Zucchini",
    "Eggplant", "Potato", "Sweet Potato", "Onion", "Garlic", "Radish", "Beetroot"
];

// Function to add a new product
async function addProduct(req, res) {
    try {
        let { name, quantity, pricePerKg } = req.body;
        const vendorId = req.session.userId;

        // Convert quantity and pricePerKg to numbers
        quantity = parseInt(quantity, 10);
        pricePerKg = parseFloat(pricePerKg);

        if (!name || isNaN(quantity) || isNaN(pricePerKg) || !vendorId) {
            return res.status(400).send('All fields are required and must be valid numbers. Vendor must be logged in.');
        }

        name = capitalizeFirstLetter(name);

        if (!allowedProducts.includes(name)) {
            return res.status(400).send('Product is not allowed. Please select from the list of allowed fruits and vegetables.');
        }

        const existingProduct = await Item.findOne({ name });

        if (existingProduct) {
            const newTotalPrice = (existingProduct.pricePerKg + pricePerKg) / 2;
            existingProduct.pricePerKg = newTotalPrice;
            existingProduct.quantity += quantity;
            await existingProduct.save();
        } else {
            const newItem = new Item({ name, quantity, pricePerKg });
            await newItem.save();
        }

        const profit = quantity * pricePerKg;
        const vendorItem = new Vendor({ vendor: vendorId, itemName: name, quantity, pricePerKg, profit });
        await vendorItem.save();

        res.redirect('/vendor');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Server error');
    }
}

// Function to fetch products for the vendor
async function getProducts(req, res) {
    try {
        const vendorId =  req.session.userId;

        if (!vendorId) {
            return res.status(400).send('Vendor must be logged in');
        }

        // Fetch products for the specific vendor
        const products = await Vendor.find({ vendor: vendorId });
        console.log(vendorId)

        // Filter products to ensure only those that match the vendor's userId are displayed
        // const filteredProducts = products.filter(product => product.vendor.toString() === vendorId);
        // console.log(filteredProducts);
        res.render('vendor', {products}); // Render vendor.ejs and pass filtered products
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
}

// Function to fetch the customer dashboard
// Function to fetch the vendor dashboard
// Function to fetch the vendor dashboard
async function getVendorDashboard(req, res) {
    try {
        const vendorId = req.session.userId;

        // Fetch products for the specific vendor
        const products = await Vendor.find({ vendor: vendorId });

        // Fetch vendor profile
        const vendorProfile = await User.findById(vendorId);

        // Prepare data for the profit chart
        const productNames = products.map(product => product.itemName);
        const profits = products.map(product => product.profit);

        // Pass the products, vendorProfile, and chart data (productNames, profits) to the view
        res.render('vendor', { products, vendorProfile, productNames, profits });
    } catch (error) {
        console.error('Error fetching vendor dashboard:', error);
        res.status(500).send('Server error');
    }
}




// Update profile
async function updateProfile (req, res) {
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
        res.redirect('/vendor');
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send("Server error");
    }
};

// Helper function to capitalize the first letter of each word
function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, char => char.toUpperCase());
}

// Export individual functions
module.exports = {
    addProduct,
    getProducts,
    getVendorDashboard,
    updateProfile
};
