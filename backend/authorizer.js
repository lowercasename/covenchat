const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;

const authorizeUser = function(req, res, next) {
    const token =
        req.body.token ||
        req.query.token ||
        req.headers['x-access-token'] ||
        req.cookies.token;
    if (!token) {
        res.status(401).send('Unauthorized: No token provided');
    } else {
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                console.error(err)
                res.status(401).send('Unauthorized: Invalid token');
            } else {
                req.user = decoded.user;
                // FIX THIS TO MAKE THE DB HIT LESS FREQUENT
                User.findById(req.user._id)
                .then(user => {
                    console.log("Updating user last online")
                    user.lastOnline = new Date();
                    user.save()
                    .then(response => {
                        next();
                    })
                })
            }
        });
    }
}

module.exports = authorizeUser;
