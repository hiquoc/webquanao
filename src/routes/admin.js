const express = require('express');
const router=express.Router();
let adminController = require('../app/controllers/adminController')

router.get('/', adminController.main);


module.exports = router;
