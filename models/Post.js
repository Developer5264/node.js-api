const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    userId: String,
    imageUrl: String,
    caption: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
