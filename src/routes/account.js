const express = require('express');
const router=express.Router();
let accountController = require('../app/controllers/accountController')

router.get('/login', accountController.loginpage);
router.get('/signup', accountController.signuppage);
router.post('/login', accountController.loginpost);
router.post('/signup', accountController.signuppost);
router.get('/logout', accountController.logout);
router.post('/user/password', accountController.password);
router.post('/user/info', accountController.info);
router.post('/user/address', accountController.address);
router.post('/user/order', accountController.huyorder);
router.use('/user', accountController.userpage);
router.post('/cart/xoa', accountController.cartxoa);
router.use('/cart', accountController.cartpage);
router.get('/checkout', accountController.checkoutpage);
router.post('/checkout', accountController.checkoutPost);
router.get('/buynow', accountController.buynowpage);
router.post('/buynow', accountController.checkoutPost);

module.exports = router;
