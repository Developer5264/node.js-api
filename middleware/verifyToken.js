const jwt = require('jsonwebtoken');
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Received token:', token);  // Debug log

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET matches the one used during token generation
        req.user = decoded.userId; // Attach the user ID to the request
        console.log('Decoded user ID:', req.user);  // Debug log
        next();
    } catch (err) {
        console.log('Token verification failed:', err.message);  // Debug log
        res.status(401).json({ msg: 'Token is not valid' });
    }
};


module.exports = verifyToken;
