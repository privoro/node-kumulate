function traverse(obj, cb){
  Object.keys(obj).forEach(key => {
    let result = cb(obj[key], key, obj);
    if(result === true) {
      return;
    }
    if(typeof obj[key] !== 'object') {
      return;
    }
    traverse(obj[key], cb);
  });
}

module.exports = traverse;
