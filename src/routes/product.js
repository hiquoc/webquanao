const express = require('express');
const router=express.Router();
let productController = require('../app/controllers/productController')

router.post('/comment', productController.comment);
router.get('/:id', productController.main);
router.post('/:id', productController.order);

module.exports = router;
