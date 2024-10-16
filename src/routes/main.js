const accountRouter=require('./account')
const adminRouter=require('./admin')
function route(app) {
  app.use('/product', (req,res)=>{
    res.render('product')
  })
  app.use('/nam', (req,res)=>{
    res.render('nam')
  })
  app.use('/account',accountRouter)
  app.use('/admin',adminRouter)
  app.use('/test', (req,res)=>{res.render('test')});
  app.get('/', (req, res) => {
    res.render('home');
  });
}

module.exports = route;