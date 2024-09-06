const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ userId }, 'yourSecretKey', { expiresIn: '1h' });
};

module.exports = generateToken;
