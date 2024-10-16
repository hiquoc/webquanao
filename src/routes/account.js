const express = require('express');
const router=express.Router();
let accountController = require('../app/controllers/accountController')

router.get('/login', accountController.loginpage);
router.get('/signup', accountController.signuppage);
router.use('/user', accountController.userpage);
router.use('/cart', accountController.cartpage);
router.use('/checkout', accountController.checkoutpage);

module.exports = router;
