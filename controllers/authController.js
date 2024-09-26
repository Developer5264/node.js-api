const multer = require('multer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../middleware/generateToken');
const path = require('path');
const fs = require('fs');

// User registration
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const image = req.file; // multer will add the uploaded file to req.file

    try {
        let user = await User.findOne({ email });
        if (user) {
            // Remove uploaded file if user already exists
            if (image) {
                fs.unlinkSync(path.join(__dirname, '../uploads', image.filename));
            }
            return res.status(400).json({ msg: 'User already exists' });
        }

        const imageUrl = image ? `/uploads/${image.filename}` : ''; // Store the file URL

        user = new User({
            username,
            email,
            password,
            profileImage: imageUrl  // Save image URL in user document
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    const { userId } = req.body; // Extract userId from request

    try {

        // Check if a new image file is uploaded
        let profileImageUrl = null;
        if (req.file) {
            profileImageUrl = req.file.path;
        }

        // Update the user profile in the database
        const updatedUser = await User.findByIdAndUpdate(userId, {
            username: req.body.username,
            profileImage: profileImageUrl
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// User login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email }); console.log('Searching for user with email:', email);
        console.log('User found:', user);
        if (!user) return res.status(400).json({ msg: 'Invalid email' });

        // Compare entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Generate token
        const token = generateToken(user.id);
        console.log('token:', token);

        // Return the user details along with the token
        res.json({
            token,

        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }

};
// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        // Fetch the user by ID from the request (set by auth middleware)
        const user = await User.findById(req.user).select('-password'); // Exclude password from the response

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Send back user details
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
        });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
};
