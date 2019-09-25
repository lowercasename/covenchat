const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;

const authorizeUser = function(req, res, next) {
    const token =
        req.body.token ||
        req.query.token ||
        req.headers['x-access-token'] ||
        req.cookies.token;
    if (!token) {
        console.log("No token provided")
        res.status(401).send('Unauthorized: No token provided');
    } else {
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                console.log("Invalid token")
                console.error(err)
                res.status(401).send('Unauthorized: Invalid token');
            } else {
                // FIX THIS TO MAKE THE DB HIT LESS FREQUENT
                User.findById(decoded.user._id)
                .then(user => {
                    user.lastOnline = new Date();
                    user.save()
                    .then(response => {
                        req.user = user;
                        next();
                    })
                })
            }
        });
    }
}

module.exports = authorizeUser;
