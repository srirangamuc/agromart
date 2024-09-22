const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    } else {
        return res.status(401).send('Unauthorized: Please log in');
    }
};

module.exports = isAuthenticated;