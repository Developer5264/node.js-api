const multer = require('multer');
const bcrypt = require('bcryptjs');
const Post = require('../models/Post');
const User = require('../models/User');
const generateToken = require('../middleware/generateToken');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const express = require('express');
const client = new OAuth2Client('314831392071-cso4l5ffmo0jpanta3o0lvrlkdorhhg7.apps.googleusercontent.com');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios'); // Use axios to download the image
const { v4: uuidv4 } = require('uuid'); // Use this to generate unique filenames

app.use(bodyParser.json());
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
    const { userId, email, password, username } = req.body; // Extract necessary fields from request

    try {
        // Check if a new image file is uploaded
        let profileImageUrl = null;
        if (req.file) {
            // Normalize the file path for URL format (with forward slashes)
            profileImageUrl = `/uploads/${req.file.filename}`;  // Ensure forward slashes
        }

        // Create an object to hold updated fields
        const updateFields = {
            username: username,
            email: email,
            profileImage: profileImageUrl,  // Store the normalized file URL
        };

        // If password is provided, hash it before updating
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.password = hashedPassword;
        }

        // Update the user profile in the database
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

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
            console.log("Here User not found");
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

exports.googleSignin = async (req, res) => {
    const { idToken } = req.body;
    console.log('Request Body:', req.body);
    console.log('Received ID Token:', idToken);

    try {
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.OAuth2Client,
        });

        console.log('Verification successful, ticket:', ticket);
        const payload = ticket.getPayload();
        console.log('Payload:', payload);

        const userId = payload['sub'];
        const email = payload['email'];
        const username = payload['name'];
        const pictureUrl = payload['picture']; // URL of the user's Google profile picture
        const password = "null";
        console.log('User Info:', { userId, email, username, pictureUrl });

        // Check if the user already exists in the database
        let user = await User.findOne({ email });

        // If the user does not exist, create a new one
        if (!user) {
            console.log('User does not exist, creating new user.');

            // Download the Google profile image
            const imageResponse = await axios.get(pictureUrl, {
                responseType: 'arraybuffer'
            });

            // Generate a unique filename and save the image locally
            const imageFilename = `${uuidv4()}.jpg`;
            const imagePath = path.join(__dirname, '../uploads', imageFilename);

            // Write the downloaded image to the file system
            fs.writeFileSync(imagePath, imageResponse.data);

            // Create new user with local image path
            user = new User({
                username,
                email,
                password,
                profileImage: `/uploads/${imageFilename}` // Save the local path to the database
            });

            await user.save();
        } else {
            console.log('User already exists, skipping creation.');
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Send the token back to the client
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(400).send({ error: 'Invalid token', details: error.message });
    }
};
// Get User Profile
exports.uploadPost = (req, res) => {
    const post = new Post({
        userId: req.body.userId,
        imageUrl: `/uploads/${req.file.filename}`,
        caption: req.body.caption,
    });

    post.save()
        .then(() => res.status(201).json({ message: 'Post created successfully' }))
        .catch(err => res.status(500).json({ error: err }));
};


// Get User Profile
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // Sort by latest posts
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err });
    }
};

// Get User Profile
exports.searchUser = async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username query is required' });
    }

    try {
        // Search for users whose username contains the search term (case-insensitive)
        const users = await User.find({
            username: { $regex: username, $options: 'i' } // 'i' makes it case-insensitive
        }).select('username profileImage'); // Select only username and profileImage fields

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};