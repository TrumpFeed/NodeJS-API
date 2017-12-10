var FeedParser = require('feedparser'),
    http       = require('http');
var async = require('async');
var cheerio = require('cheerio');

cheerio
var res = function(cb){
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
          article.summary = '';
          console.log(article.guid)
          http.get(article.guid, function(res){
            // console.log(html);

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
              done();
            })
          });
      }, function(err, results) {
          // console.log('Tweet Inserted:', results.length);
          return cb(null, feedMeta, articles);
      });
    });
  };
};

var rssurl = require('./../credentials.json').cnn.rssurl;

var get = function(module, cb){ http.get(rssurl + module + '.rss', res(cb)); };

var funct = function(url){ return function(cb){ get(url, cb); }; };
module.exports = {
  top: funct('cnn_topstories'),
  world: funct('cnn_world'),
  us: funct('cnn_us'),
  politics: funct('cnn_allpolitics'),
  latest: funct('cnn_latest')
};
