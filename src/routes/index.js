const accountRouter=require('./account')
const adminRouter=require('./admin')
const productRouter=require('./product')
const mainRouter=require('./main')
function route(app) {
  app.use('/product', productRouter);
  app.use('/account',accountRouter)
  app.use('/admin',adminRouter)
  app.use('/test', (req,res)=>{res.render('test')});
  app.use('/', mainRouter)
}

module.exports = route;