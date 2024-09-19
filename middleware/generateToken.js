const jwt = require('jsonwebtoken');


const generateToken = (userId) => {
    return jwt.sign({ userId }, 'yourSecretKey', { expiresIn: '8h' });
};


module.exports = generateToken;
