import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userWishlistSchema = new mongoose.Schema({
    discordID: {
        type: String, 
        required: true, 
        unique: true
    },
    games: [{
        type: String, 
        required: true
    }]
});

const UserWishlist = mongoose.model('UserWishlist', userWishlistSchema);

mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });

export default UserWishlist;

