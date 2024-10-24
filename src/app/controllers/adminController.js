class adminController{
    main(req,res){
        res.render('admin/main')
    }
    upload(req,res){
        res.render('admin/upload')
    }
    account(req,res){
        res.render('admin/account')
    }

}
module.exports = new adminController();