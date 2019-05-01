const Yaml = require('js-yaml');
const {logger} = require('./logger');

function identifier(resource) {
  return `${resource.kind}:${resource.metadata.name}`;
}

module.exports = class ResourceMap {
  constructor() {
    this.resources = [];
    this.resourceIndex = {};
  }

  get length() {
    return this.resources.length;
  }

  forEach(cb) {
    this.resources.forEach(cb);
  }

  map(cb) {
    return this.resources.map(cb);
  }

  filter(cb) {
    return this.resources.filter(cb);
  }

  contains(resourceOrIdentifier) {
    if(typeof resourceOrIdentifier === 'string') {
      return typeof this.resourceIndex[resourceOrIdentifier] !== 'undefined';
    } else if(typeof resourceOrIdentifier === 'object') {
      return typeof this.resourceIndex[identifier(resourceOrIdentifier)] !== 'undefined';
    } else {
      throw new Error("unexpected argument type");
    }
  }

  add(resource) {
    if(resource === null) {
      logger.error('cannot add a null resource');
      return;
    }

    let id = identifier(resource);
    if(this.contains(id)){
      console.warn('added resource is already present, replacing')
      // remove previous resource
      this.resources.splice(
        this.resourceIndex[id], 1
      );
    }
    let copy = Object.assign({}, resource);
    let pos = this.resources.push(copy) - 1;
    this.resourceIndex[id] = pos;
  }

  remove(resourceOrIdentifier) {
    if( ! this.contains(resourceOrIdentifier) ){
      return
    }

    if(typeof resourceOrIdentifier !== 'string' && typeof resourceOrIdentifier !== 'object') {
      throw new Error("invalid argument type")
    }

    let id = typeof resourceOrIdentifier === 'string' ? resourceOrIdentifier : identifier(resourceOrIdentifier);
    // remove resource
    this.resources.splice(
      this.resourceIndex[id], 1
    );
    // remove index
    delete this.resourceIndex[id];
  }

  mergeReplace(resourceMap) {
    resourceMap.resources.forEach(resource => this.add(resource));
  }

  mergePatch(resourceMap) {}

  getResource(position) {
    return this.resources[position];
  }

  render() {
    return this.resources
      .map(resource => Yaml.dump(resource))
      .join("---\n");
  }

  static factory(ymlDocuments){
    let resourceMap = new ResourceMap();
    if(Array.isArray(ymlDocuments)) {
      logger.silly(`factory resource map from: ${JSON.stringify(ymlDocuments)}`);
      ymlDocuments.forEach((doc, i) => {
        if(doc === null) {
          logger.warn(`skipping empty document (index ${i})`);
          return;
        }
        resourceMap.add(doc)
      });
    }
    else {
      resourceMap.add(ymlDocuments);
    }
    return resourceMap;
  }
};
