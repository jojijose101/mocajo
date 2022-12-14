var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require('express-fileupload')
var usersRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const Handlebars = require('handlebars');
var hbs = require('express-handlebars')
var app = express();
var db=require('./config/connection')
var productHelpers=require('./helpers/product-helpers')
var session=require('express-session')
// view engine setup
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials' ,
handlebars: allowInsecurePrototypeAccess(Handlebars)
}))

app.engine('html', require('hbs').__express);
db.connect((err)=>{
  if(err) console.log('connection error'+err);
  else console.log('database');
})
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(fileUpload());
app.use(session({
  secret: "key",
  saveUninitialized:true,

  cookie: { 
  
   
    maxAge: 6000000 },
  resave: false
}));
app.use('/admin', adminRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
