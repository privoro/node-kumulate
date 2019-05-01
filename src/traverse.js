function traverse(obj, cb){
  if(Array.isArray(obj)) {
    for(let i = 0; i < obj.length; i++) {
      traverse(obj[i], cb);
    }
  } else if(typeof obj !== 'object') {
    return;
  }
  if(obj === null) {
    return;
  }

  Object.keys(obj).forEach(key => {
    if(typeof obj === 'undefined' || obj === null) {
      return;
    }

    let result = cb(obj[key], key, obj);
    if(result === true) {
      return;
    }
    if(!Array.isArray(obj[key]) && typeof obj[key] !== 'object') {
      return;
    }
    traverse(obj[key], cb);
  });
}

module.exports = traverse;
