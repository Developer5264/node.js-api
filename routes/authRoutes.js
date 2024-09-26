const express = require('express');
const { register, login, updateUserProfile, getUserProfile } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const router = express.Router();



// Multer setup for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },  // 5 MB limit
    fileFilter: (req, file, cb) => {
        console.log('File MIME type:', file.mimetype);  // Log MIME type

        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg and .png files are allowed'), false);
        }
    }
});


// Public routes
router.post('/register', upload.single('profileImage'), register);  // Handling image upload during registration
router.post('/login', login);
router.put('/update-profile', upload.single('profileImage'), updateUserProfile);
router.get('/profile', verifyToken, getUserProfile);



module.exports = router;
