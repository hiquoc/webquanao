const express=require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const app=express();

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
// ----------------//
// add view template engine
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'resources\\views'));
// ----------------//
app.use(express.static(path.join(__dirname, 'public')));

const route=require('./routes/main');
route(app)

const port=8080;
app.listen(port,()=>{
    console.log(`listening on port ${port}`);
});