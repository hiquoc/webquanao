class accountController{
    main(req,res){
        res.render('admin/main')
    }
}
module.exports = new accountController();