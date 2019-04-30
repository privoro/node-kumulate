const Loader = require('./loader');
const Path = require('path');
const crypto = require('crypto');
const Yaml = require('js-yaml');

module.exports = class SecretGenerator {
  constructor(name, type = 'Opaque'){
    this.name = name;
    this.map = {};
    this.type = type;
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
    let str = JSON.stringify({kind: 'secret', name: this.name, type: this.type, data: this.map});
    let hash = crypto.createHash('sha256');

    hash.update(str);
    return hash.digest('hex').substr(0, 10);
  }

  getResource() {
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: this.generatedName()
      },
      type: this.type,
      data: this.map,
    }
  }

  isReference(parentKey, name) {
    return name === this.name
      && SecretGenerator.isReferenceKey(parentKey);
  }

  static isReferenceKey(parentKey) {
    return ['secret', 'secretKeyRef'].indexOf(parentKey) !== -1;
  }

  render() {
    return Yaml.dump(this.getResource());
  }

  static factory(yml, basePath) {
    let generator = new SecretGenerator(yml.name, yml.type);

    if(Array.isArray(yml.files)) {
      yml.files.forEach(file => {
        let string = Loader.loadAsBase64(file, basePath);
        let basename = Path.basename(file);
        generator.add(basename, string);
      });
    }

    if(yml.env) {
      let string = Loader.loadAsString(yml.env, basePath);
      string.split("\n").forEach(line => {
        if(line.indexOf('=') === -1) {
          return;
        }
        let [key,value] = line.split("=", 2);
        generator.add(key, Buffer.from(value, 'utf8').toString('base64'));
      });

    }

    return generator;
  }
};
