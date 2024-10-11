const accountRouter=require('./account')
function route(app) {
  app.use('/cart', (req,res)=>{
    res.render('cart')
  });
  app.use('/product', (req,res)=>{
    res.render('product')
  })
  app.use('/nam', (req,res)=>{
    res.render('nam')
  })
  app.use('/account',accountRouter)
  app.use('/test', (req,res)=>{res.render('test')});
  app.get('/', (req, res) => {
    res.render('home');
  });
}

module.exports = route;