const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// Render login and signup pages
exports.renderAuth = (req, res) => {
    res.render('auth');
};

// POST route for login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.send('Email and password are required');
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.redirect('/signup');
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id.toString();
        console.log(req.session.userId);
        res.redirect('/customer'); // Redirect to a general dashboard
    } else {
        return res.send('Invalid email or password');
    }
};

// POST route for signup
exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.send('All fields are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role
    });

    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/customer'); // Redirect to a general dashboard
};

// Logout route
exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
