const express = require('express');
const router=express.Router();
const upload=require('../app/config/multer1.js')
const upload2=require('../app/config/multer2.js')
let mainController = require('../app/controllers/mainController')


router.post('/guess/save',upload2.none(),mainController.save);
router.post('/guess',upload.single('img'),mainController.guessPost);
router.get('/guess',mainController.guess);

router.get('/new', mainController.new);
router.get('/search', mainController.search);
router.get('/:category', mainController.category);
router.get('/', mainController.main);

module.exports = router;