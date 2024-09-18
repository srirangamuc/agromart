// middleware/roleMiddleware.js
const User = require('../models/userModel');

const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.session.userId) {
            return res.redirect('/login'); // Redirect if not logged in
        }

        try {
            const user = await User.findById(req.session.userId);

            if (!user) {
                return res.redirect('/login'); // Redirect if user not found
            }

            if (roles.includes(user.role)) {
                next(); // User has the correct role
            } else {
                res.status(403).send('Forbidden: You do not have access to this page'); // Forbidden
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    };
};

module.exports = { checkRole };
