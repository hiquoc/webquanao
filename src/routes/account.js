const express = require('express');
const router=express.Router();
let loginPage = require('../app/controllers/accountController')

router.get('/login', loginPage.loginpage);
router.get('/signup', loginPage.signuppage);

module.exports = router;
