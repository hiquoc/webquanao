const express = require('express');
const router=express.Router();
let mainController = require('../app/controllers/mainController')

router.get('/new', mainController.new);
router.get('/search', mainController.search);
router.get('/:category', mainController.category);

router.get('/', mainController.main);

module.exports = router;