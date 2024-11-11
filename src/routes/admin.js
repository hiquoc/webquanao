const express = require('express');
const router=express.Router();
const upload=require('../app/config/multer.js')
let adminController = require('../app/controllers/adminController')

router.get('/san-pham-moi', adminController.upload);
router.post('/san-pham-moi', upload.array("product-images") ,adminController.uploadPost);
router.post('/status', adminController.status);

router.get('/edit/:id', adminController.editpage);
router.post('/edit/', upload.array("product-images"), adminController.editPost);
router.post('/edit1/', upload.none(), adminController.edit1Post);
router.post('/delete',  adminController.deletePost);

router.post('/xoa', adminController.xoaorder);
router.get('/order', adminController.allorder);
router.post('/order', adminController.allorderPost);
router.post('/tai-khoan/role', adminController.role);
router.post('/tai-khoan/order/xoa', adminController.xoaorder);
router.get('/tai-khoan/order/:id', adminController.order);
router.post('/tai-khoan/order/:id', adminController.orderPost);

router.get('/tai-khoan', adminController.account);
router.post('/tai-khoan', adminController.xoaaccount);
router.get('/search', adminController.search);
router.get('/doanh-thu', adminController.doanhthu);
router.get('/', adminController.main);


module.exports = router;
