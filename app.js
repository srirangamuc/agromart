const express = require("express");
const bodyparser = require('body-parser');
const mongoose = require("mongoose");
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');

const app = express();

// Correct MongoDB connection string with the database name 'farmers'
mongoose.connect("mongodb+srv://freshmart:FDWyAmiXk89asnNd@freshmart.mtbq8.mongodb.net/farmer", {
    // No need for deprecated options anymore
}).then(() => console.log('Database connection successful'))
  .catch(err => console.error("Database connection error", err));

app.use(bodyparser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    if (req.session.userId) {
        res.render("index");
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.redirect('/signup');
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        req.session.userId = user._id;
        res.redirect('/');
    } else {
        res.send('Invalid email or password');
    }
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role
    });

    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
