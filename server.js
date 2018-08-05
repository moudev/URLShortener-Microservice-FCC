'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var bodyParser = require('body-parser');
var cors = require('cors');

mongoose.Promise = global.Promise // <--OJO A ESTE ERROR DE PROMESAS JS
mongoose.connect(process.env.STRING_MONGO,{ useNewUrlParser: true });


var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

//middleawer's
app.use(function(req,response,next){
  console.log(req.method+' '+req.path+' - '+req.ip);
  next();
})
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

/*  SCHEMA URLS  and MODEL*/
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  original_url : { type: String, required: true },
  short_url : Number,
});

var Url = mongoose.model('Url', urlSchema);
/*  SCHEMA URLS and MODEL */

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

/*-- START  SAVE MODEL REQUEST  */
app.post('/api/shorturl/new', (req, res, next)=>{
  let urlOriginal = (req.body.url)? (req.body.url).replace(/\/+?$/,'').replace(/(http[s]?:\/\/)?(www\.)?/,''): '';
  console.log('URL: '+urlOriginal);
  let jsonResponse = {};
  let promise = new Promise((resolve, reject)=>{
      dns.lookup(urlOriginal, (err, address, family)=> {
        console.log("address: " + address);
        console.log("respond: "+(address == undefined));
        return (address == undefined)? reject('false') : resolve('true');
      })
  });
  
  promise.then((data)=>{
    
    console.log("[Valid URL]: " + data);
    /*  START SAVE DATA  */    
    let url = new Url({
      original_url: urlOriginal,
      short_url: Date.now()
    })
    // http://mongoosejs.com/docs/promises.html
    url.save()
      .then((data)=>{
        console.log(data)
        jsonResponse = {
          "original_url":data.original_url,
          "short_url":data.short_url
        }
        res.json(jsonResponse);
      })
      .catch((err)=>{
        console.log(err)
        jsonResponse = {"error":err}
        res.json(jsonResponse);
      })
    /*  END SAVE DATA  */    
    
  })
  .catch((error)=>{
    console.log("[ERROR URL]:" + error);
    jsonResponse = {"error":"invalid URL"}
    res.json(jsonResponse);
  })
  
});
/*-- END  SAVE MODEL REQUEST  */

/*-- START  REDIRECT REQUEST  */
app.get('/api/shorturl/:id', (req, res, next)=>{
  let url = req.params.id || '';
  Url.findOne({short_url: url})
  .then((data)=>{
    if(data != null){
       res.writeHead(301, { "Location": "http://" + data.original_url  });
        return res.end();
      
    }else{
      res.json({error: "no exist url"});
    }
  })
  .catch((err)=>console.log(err));
              
});
/*-- END  REDIRECT REQUEST  */


app.listen(port, function () {
  console.log('Node.js listening ...');
});