class accountController{
    loginpage(req,res){
        res.render('account/login',{layout:'account'})
    }
    signuppage(req,res){
        res.render('account/signup',{layout:'account'})
    }
    userpage(req,res){
        res.render('account/user')
    }

    cartpage(req,res){
        res.render('account/cart')
    }
    checkoutpage(req,res){
        res.render('account/checkout')
    }

}
module.exports = new accountController();