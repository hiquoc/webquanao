const express = require('express');
const router=express.Router();
let adminController = require('../app/controllers/adminController')

router.get('/san-pham-moi', adminController.upload);
router.get('/tai-khoan', adminController.account);
router.get('/', adminController.main);


module.exports = router;
