const loader = require('./loader');
const Path = require('path');
const ResourceMap = require('./resourceMap');
const ConfigMapGenerator = require('./configMapGenerator');
const SecretGenerator = require('./secretGenerator');
const traverse = require('./traverse');

module.exports = class Kustomization {
  constructor(){
    this.bases = [];
    this.resourceMap = new ResourceMap();
    this.configMapGenerators = [];
    this.secretGenerators = [];
  }

  addBase(kustomization) {
    // todo assert kustomization instance
    this.bases.push(kustomization);
  }

  addResourceMap(resourceMap) {
    this.resourceMap.mergeReplace(resourceMap);
  }

  addConfigMapGenerator(generator){
    this.configMapGenerators.push(generator);
  }

  addSecretGenerator(generator) {
    this.secretGenerators.push(generator);
  }


  flatten() {
    let flattened = new Kustomization();

    this.bases.forEach(base => {
      let flatBase = base.flatten();

      this.addResourceMap(flatBase.resourceMap);

      flattened.configMapGenerators = flatBase.configMapGenerators.concat(flattened.configMapGenerators);

      flattened.secretGenerators = flatBase.secretGenerators.concat(flattened.secretGenerators);

      // TODO: add overlays
    });

    flattened.addResourceMap(this.resourceMap);

    flattened.configMapGenerators = this.configMapGenerators.concat(flattened.configMapGenerators);

    flattened.secretGenerators = this.secretGenerators.concat(flattened.secretGenerators);

    // TODO: add overlays
    return flattened;
  }

  compile() {
    let flattened = this.flatten();

    flattened.resourceMap.forEach(resource => {
      traverse(resource, (value, key, obj) => {
        // update config map references
        if(ConfigMapGenerator.isReferenceKey(key) === true) {
          flattened.configMapGenerators.forEach(generator => {
            if(generator.name === value.name) {
              value.name = generator.generatedName();
            }
          });
        }

        // update secret reference
        if(SecretGenerator.isReferenceKey(key) === true) {
          flattened.secretGenerators.forEach(generator => {
            if(generator.name === value.name) {
              value.name = generator.generatedName();
            } else if(generator.name === value.secretName) {
              value.secretName = generator.generatedName();
            }
          });
        }
      });
    });


    let resourceMap = new ResourceMap();
    // prepend config maps
    flattened.configMapGenerators
      .forEach(generator => resourceMap.add(generator.getResource()));

    // prepend secrets
    flattened.secretGenerators
      .forEach(generator => resourceMap.add(generator.getResource()));

    resourceMap.mergeReplace(flattened.resourceMap);

    return resourceMap;
  }

  render() {
    let compiledResourceMap = this.compile();
    return compiledResourceMap.render();
  }

  static factory(yml, basePath) {
    let kustom = new Kustomization();

    if(Array.isArray(yml.bases)) {
      let bases = yml.bases.map(base => {
        let resolvedBasePath = Path.resolve(basePath, base);
        let kustomizationFile = Path.resolve(resolvedBasePath, 'kustomization.yml');
        let baseYml = loader.load(kustomizationFile, basePath);

        return Kustomization.factory(baseYml[0], resolvedBasePath);
      });

      bases.forEach(base => kustom.addBase(base));
    }

    if(Array.isArray(yml.resources)) {
      let resourceMaps = yml.resources.map(filePath => {
        let resourceYml = loader.load(filePath, basePath);
        return ResourceMap.factory(resourceYml);
      });

      resourceMaps.forEach(map => kustom.addResourceMap(map));
    }

    if(Array.isArray(yml.configMapGenerator)) {
      yml.configMapGenerator.forEach(generator => {
        let configMapGenerator = ConfigMapGenerator.factory(generator, basePath);
        kustom.addConfigMapGenerator(configMapGenerator);
      });
    }

    if(Array.isArray(yml.secretGenerator)) {
      yml.secretGenerator.forEach(generator => {
        let secretGenerator = SecretGenerator.factory(generator, basePath);
        kustom.addSecretGenerator(secretGenerator);
      });
    }

    return kustom;
  }
};
