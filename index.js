var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var xtend = require('xtend');
var BPromise = require('bluebird');
var DEFAULT_DB_URI = 'mongodb://127.0.0.1:27017/data-cache-db';
var defaultOptions = {
  uri: DEFAULT_DB_URI,
  collection: 'mdb-cache',
  connectionOptions: {},
  //dbPromise: dbPromise, //if passed in, then ignore uri & connectionOptions
  idFeild: '_id'
  // invalid: function(){return false;}
};
function MongoDBCache(options){
  options = xtend({}, defaultOptions, options);
  this._idFeild = options.idFeild;
  this._collection = options.collection;
  // this._invalid = options.invalid;
  this._db = isPromise(options.dbPromise) ? options.dbPromise : new BPromise(function(resolve, reject){
    MongoClient.connect(options.uri, options.connectionOptions, function(err, db){
      if(err){
        return reject(err);
      }
      resolve(db);
    });
  });
};

var proto = MongoDBCache.prototype;

proto.onError = function(fn){
  this.onError = fn;
};

proto._generateQuery = function(id) {
  var ret = {};
  ret[this._idFeild] = id;
  return ret;
};

proto.get = function(id, invalid){
  var _this = this;
  return this._dbOp('findOne', id, function(data, resolve){

    if(data != null){
      if(typeof invalid === 'function' && invalid(data.data)){
        return _this.del(id).then(resolve);
      }else{
        return resolve(data.data);
      }
    }
    return resolve();
  })();
};

proto.del = function(id){
  return this._dbOp('remove', id, function(_, resolve){
    return resolve();
  })();
};

proto.set = function(id, value){
  var _this = this;
  var data = _this._generateQuery(id);
  data.data = value;
  return this._dbOp('update', id, function(_,resolve){
    return resolve();
  })(data, {upsert: true});
};

proto.close = function(){
  return this._db.then(function(db){
    return db.close();
  });
};

proto._dbOp = function(operation, id, cb){
  var _this = this,
      _db = this._db,
      _collection = this._collection;
  return function _operation(){
    var  args = [].slice.call(arguments);
    return _db.then(function(db){
      var collection = db.collection(_collection);
      // console.log(collection[operation]);
      return new BPromise(function(resolve, reject){
        args.unshift(_this._generateQuery(id));
        args.push(function(err, result){
          if(err) {
            return reject(err);
          }
          return cb(result, resolve);
        });
        return collection[operation].apply(collection, args);
      });
    });
  };
};
module.exports = MongoDBCache;

function isPromise(p){
  return p && typeof p.then === 'function';
}
// if(require.main === module){
//   var mgCache = new MongoDBCache();
//   mgCache.set(1, {'item':'1'}).then(function(){
//     return mgCache.get(1).then(console.log.bind(console)).then(function(){
//       mgCache._db.then(function(db){db.close();});
//     });
//   }).catch(console.error.bind(console));
  
// }
