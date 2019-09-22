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
                next();
            }
        });
    }
}

module.exports = authorizeUser;
