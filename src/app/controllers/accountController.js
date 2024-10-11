class accountController{
    loginpage(req,res){
        res.render('account/login',{layout:'account'})
    }
    signuppage(req,res){
        res.render('account/signup',{layout:'account'})
    }
}
module.exports = new accountController();