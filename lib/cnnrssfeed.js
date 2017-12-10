var FeedParser = require('feedparser'),
    http       = require('http');
var async = require('async');
var cheerio = require('cheerio');

var res = function(cb, resolve){
  return function(response){
    var feedMeta,
        articles = [];

    response.pipe(new FeedParser({})).on('error', function(error){
      return cb(error, null);
    }).on('meta', function(meta){
      feedMeta = meta;
    }).on('readable', function(){
      var stream = this, item;
      while(item = stream.read()){
        articles.push(item);
      }
    }).on('end', function(){
      async.mapSeries(articles, function (article, done) {
          article.guid = article.guid.replace(/^https:\/\//i, 'http://');
          console.log(article.guid)
          try {
            http.get(article.guid, function(res){
              article.summary = '';
              var bodyChunks = [];
              res.on('data', function(chunk) {
                // You can process streamed parts here...
                bodyChunks.push(chunk);
              }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                var $ = cheerio.load(body);
                $('.speakable').each(function(i, element){
                  // console.log($(element).text().length)
                  article.summary += $(element).text();
                });
                setTimeout(function(){ done(); }, 500);
                // done();
              })
            });
          } catch(e){
            console.log('got error')
            setTimeout(function(){ done(); }, 500);
          }
      }, function(err, results) {
          return cb(null, feedMeta, articles, resolve);
      });
    });
  };
};

var rssurl = require('./../credentials.json').cnn.rssurl;

var get = function(module, cb, resolve){ http.get(rssurl + module + '.rss', res(cb, resolve)); };

var funct = function(url){ return function(cb, resolve){ get(url, cb, resolve); }; };
module.exports = {
  top: funct('cnn_topstories'),
  world: funct('cnn_world'),
  us: funct('cnn_us'),
  politics: funct('cnn_allpolitics'),
  latest: funct('cnn_latest')
};
