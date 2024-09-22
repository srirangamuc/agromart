const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Render login and signup pages
exports.renderAuth = (req, res) => {
    res.render('auth');
};

// POST route for login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect('/signup'); // Redirect to signup if user not found
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Store user information in the session
            req.session.userId = user._id.toString();
            req.session.userRole = user.role;
            req.session.userName = user.name; // Optionally store user's name

            // Redirect based on user role
            if (user.role === 'admin') {
                return res.redirect('/admin'); // Admin dashboard route
            } else if (user.role === 'vendor') {
                return res.redirect('/vendor'); // Vendor dashboard route
            } else {
                return res.redirect('/customer'); // Customer dashboard route
            }
        } else {
            return res.status(401).send('Invalid email or password'); // Unauthorized
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send('Server error');
    }
};

// POST route for signup
exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
        return res.status(400).send('All fields are required');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).send('Email already exists'); // Conflict
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await newUser.save();
        req.session.userId = newUser._id.toString(); // Store user ID in session
        req.session.userRole = newUser.role; // Store user role
        req.session.userName = newUser.name; // Optionally store user's name

        res.redirect('/customer'); // Redirect to customer dashboard
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).send('Server error');
    }
};

// Logout route
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).send('Server error');
        }
        res.redirect('/'); // Redirect to home after logout
    });
};
