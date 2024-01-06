const router = require('express').Router();
// const userController = require('../controllers/userController');

// User Controller
const {register ,login ,logout ,mustBeLoggedIn} = require('../controllers/userController');

// Profile Controller
const {home, showFollowers, showFollowings ,showProfile , ifUserExists, followUser, unfollowUser, sharedProfileData} = require('../controllers/profileController');

// Post Controller
const {showCreatePost ,createPost ,showPost, showEditPost, editPost, deletePost, searchPost, } = require('../controllers/postController');

// Chat Controller
const {saveChat, showChats} = require('../controllers/chatController');

// Socket Controller
const {addNewSocket,getSocketByUserId,getSockets} = require('../controllers/socketController');

router.get('/',home)

router.post('/register',register)
router.post('/login',login)
router.post('/logout',logout)

// Post routes
router.get('/post/create',mustBeLoggedIn ,showCreatePost);
router.post('/post/create',mustBeLoggedIn ,createPost);
router.get('/post/:id', showPost);

router.get('/post/:id/edit', mustBeLoggedIn, showEditPost);
router.post('/post/:id/edit', mustBeLoggedIn, editPost);
router.post('/post/:id/delete', mustBeLoggedIn, deletePost);

// Profile routes
router.get('/profile/:username',ifUserExists,sharedProfileData, showProfile);
router.get('/profile/:username/followers',ifUserExists,sharedProfileData, showFollowers);
router.get('/profile/:username/followings',ifUserExists,sharedProfileData, showFollowings);

// Follow and unFollow
router.post('/profile/:username/follow', ifUserExists, mustBeLoggedIn, followUser);
router.post('/profile/:username/unfollow', ifUserExists, mustBeLoggedIn, unfollowUser);

// Search
router.post('/search', searchPost);

// Chat
router.post('/chat',saveChat);
router.get('/chat', showChats);

// Socket
router.post('/socket',addNewSocket)
router.get('/socket',getSockets)
router.get('/socket/byUser',getSocketByUserId)

module.exports = router;