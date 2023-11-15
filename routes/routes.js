const router = require('express').Router();
const userController = require('../controllers/userController');

router.get('/',(req,res)=>{
    res.render('home-guest');
})


router.post('/login',userController.login)
router.post('/register',userController.register)

module.exports = router;