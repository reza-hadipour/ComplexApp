const router = require('express').Router();
// const userController = require('../controllers/userController');

// User Controller
const {register ,login ,logout ,ifUserExists ,showProfile ,home ,mustBeLoggedIn} = require('../controllers/userController');

// Post Controller
const {showCreatePost ,createPost ,showPost, showEditPost, editPost, deletePost} = require('../controllers/postController');

router.get('/',home)

router.post('/register',register)
router.post('/login',login)
router.post('/logout',logout)

// Post routes
router.get('/post/create',mustBeLoggedIn ,showCreatePost);
router.post('/post/create',mustBeLoggedIn ,createPost);
router.get('/post/:id',mustBeLoggedIn ,showPost);

router.get('/post/:id/edit', mustBeLoggedIn, showEditPost);
router.post('/post/:id/edit', mustBeLoggedIn, editPost);
router.post('/post/:id/delete', mustBeLoggedIn, deletePost);

// Profile routes
router.get('/profile/:username',ifUserExists, showProfile);

module.exports = router;