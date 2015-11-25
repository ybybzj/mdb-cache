## Simple mongo db key-value store implementation
#### Usage
```js
var MongoDBCache = require('mdb-cache');
var mdbCache = new MongoDBCache({
  uri: 'mongodb://127.0.0.1:27017/data-cache-db', //default
  collection: 'mdb-cache', //default
  connectionOptions: {},
  idFeild: '_id' //default, stands for feild name of 'key' in mongodb
});

//return a promise resolve the value, 
//can pass in a function as second parameter that check the vadality of the value,
//and if function return true, value will be deleted, and get promise will resolve null;
mdbCache.get(key, invalid);

//return a promise that indicates successfully 'set' if fulfilled
mdbCache.set(key, value);

//return a promise that indicates successfully 'delete a key-value' if fulfilled
mdbCache.del(key);

//close connection;
mdbCache.close();

// register an error handler
mdbCache.onError(onErrorHandler);
```