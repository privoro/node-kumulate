const Loader = require('./loader');
const Path = require('path');
const crypto = require('crypto');
const Yaml = require('js-yaml');

module.exports = class ConfigMapGenerator {
  constructor(name){
    this.name = name;
    this.map = {};
  }

  add(key, value) {
    this.map[key] = value;
  }

  get(key) {
    return this.map[key];
  }

  generatedName() {
    return `${this.name}-${this.hash()}`;
  }

  hash(){
    let str = JSON.stringify({kind: 'configMap', name: this.name, type: this.type, data: this.map});
    let hash = crypto.createHash('sha256');

    hash.update(str);
    return hash.digest('hex').substr(0, 10);
  }


  getResource() {
    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: this.generatedName()
      },
      data: this.map,
    }
  }

  isReference(parentKey, name) {
    return name === this.name
    && ConfigMapGenerator.isReferenceKey(parentKey);
  }

  static isReferenceKey(parentKey) {
    return ['configMap', 'configMapKeyRef', 'configMapRef'].indexOf(parentKey) !== -1;
  }

  render() {
    return Yaml.dump(this.getResource());
  }

  static factory(yml, basePath) {
    let generator = new ConfigMapGenerator(yml.name);

    if(Array.isArray(yml.files)) {
      yml.files.forEach(file => {
        let string = Loader.loadAsString(file, basePath);
        let basename = Path.basename(file);
        generator.add(basename, string);
      });
    }

    if(Array.isArray(yml.envFiles)) {
      yml.envFiles.forEach(file => {
        let string = Loader.loadAsString(file, basePath);
        string.split("\n").forEach(line => {
          if(line.indexOf('=') === -1) {
            return;
          }
          let [key,value] = line.split("=", 2);
          generator.add(key, value);
        });
      });
    }

    if(Array.isArray(yml.literals)) {
      yml.literals.forEach(literal => {
        let [key,value] = literal.split("=", 2);
        generator.add(key, value);
      });
    }

    return generator;
  }
};
