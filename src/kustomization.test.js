const Kustomization = require('./kustomization');
const assert = require('assert');
const Yaml = require('js-yaml');
const ResourceMap = require('./resourceMap');
const ConfigMapGenerator = require('./configMapGenerator');
const SecretGenerator = require('./secretGenerator');

describe('kustomization', function(){
  describe('factory', function(){
    it('loads resources', async () => {
      let yml = {resources: ['fiz.yml', 'foo.yml']};
      let kustom = await Kustomization.factory(yml, __dirname + '/../tests/base');
      // assert resources
      assert.equal(kustom.resourceMap.length, 2, 'number of resources loaded');
      assert.equal(kustom.resourceMap.getResource(0).metadata.name, 'fiz', 'resource name');
      assert.equal(kustom.resourceMap.getResource(1).metadata.name, 'foo', 'resource name');
    });

    it('loads bases', async () => {
      let yml = {bases: ['base']};
      let kustom = Kustomization.factory(yml, __dirname + '/../tests');

      // assert resources
      assert.equal(kustom.bases.length, 1, 'number of bases loaded');
      assert.equal(kustom.bases[0].resourceMap.length, 2, 'number of resources in base');
      assert.equal(kustom.bases[0].resourceMap.getResource(0).metadata.name, 'fiz', 'resource name');
      assert.equal(kustom.bases[0].resourceMap.getResource(1).metadata.name, 'foo', 'resource name');
    });

    it('loads config map generators');

    it('loads overlays');
  });

  describe('render', function(){
    it('renders resources', async () => {
      let resources = [
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceA'}},
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceB'}},
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceC'}}
      ];

      let resourceMap = new ResourceMap();
      resourceMap.add(resources[0]);
      resourceMap.add(resources[1]);
      resourceMap.add(resources[2]);

      let kustom = new Kustomization();
      kustom.addResourceMap(resourceMap);

      let expected = resources.map(rm => Yaml.dump(rm)).join("---\n");
      let rendered = kustom.render();

      assert.equal(rendered, expected, 'output');
    });

    it('renders bases', async () => {
      let resources = [
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceA'}},
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceB'}},
        {apiVersion: 'test/v1', kind: 'test', metadata: {name: 'resourceC'}}
      ];

      let resourceMap = new ResourceMap();
      resourceMap.add(resources[0]);
      resourceMap.add(resources[1]);
      resourceMap.add(resources[2]);

      let kustomBase = new Kustomization();
      kustomBase.addResourceMap(resourceMap);

      let kustomOverlay = new Kustomization();
      kustomOverlay.addBase(kustomBase);

      let expected = resources.map(rm => Yaml.dump(rm)).join("---\n");
      let rendered = kustomOverlay.render();

      assert.equal(rendered, expected, 'output');
    });

  });

  describe('flatten', function() {
    let kGrandChild = new Kustomization();
    kGrandChild.addConfigMapGenerator(new ConfigMapGenerator('fuz'));
    kGrandChild.addSecretGenerator(new SecretGenerator('buz'));
    kGrandChild
      .addResourceMap(ResourceMap.factory([
        {kind: 'test', metadata: {name: 'grandchild'}}
      ]));

    let kChild = new Kustomization();
    kChild.addBase(kGrandChild);
    kChild.addConfigMapGenerator(new ConfigMapGenerator('biz'));
    kChild.addConfigMapGenerator(new ConfigMapGenerator('buz'));
    kChild.addSecretGenerator(new SecretGenerator('fiz'));
    kChild.addSecretGenerator(new SecretGenerator('fuz'));
    kChild.addResourceMap(ResourceMap.factory([
        {kind: 'test', metadata: {name: 'childA'}},
        {kind: 'test', metadata: {name: 'childB'}}
      ]));

    let kParent = new Kustomization();
    kParent.addBase(kChild);
    kParent.addConfigMapGenerator(new ConfigMapGenerator('foo'));
    kParent.addSecretGenerator(new SecretGenerator('boo'));
    kParent.addResourceMap(ResourceMap.factory([
      {kind: 'test', metadata: {name: 'parent'}}
    ]));

    let flattened = kParent.flatten();


    describe('returns a new kustomization', function(){
      it('should not have nested bases', () => {
        assert.equal(flattened.bases.length, 0, 'should not have nested bases');
      });

      it('aggregates nested config map generators', () => {
        assert.equal(flattened.configMapGenerators.length, 4, 'config map count');
        assert.equal(flattened.configMapGenerators[0].name, 'foo', 'parent should be first');
        assert.equal(flattened.configMapGenerators[1].name, 'biz', 'child should be second');
        assert.equal(flattened.configMapGenerators[2].name, 'buz', 'grandchild should be third');
        assert.equal(flattened.configMapGenerators[3].name, 'fuz', 'grandchild should be fourth');
      });

      it('aggregates nested secret generators', () => {
        assert.equal(flattened.secretGenerators.length, 4, 'secret count');
        assert.equal(flattened.secretGenerators[0].name, 'boo', 'parent should be first');
        assert.equal(flattened.secretGenerators[1].name, 'fiz', 'child should be second');
        assert.equal(flattened.secretGenerators[2].name, 'fuz', 'grandchild should be third');
        assert.equal(flattened.secretGenerators[3].name, 'buz', 'grandchild should be fourth');
      });

      it('aggregates nested resource maps', () => {
        assert.equal(flattened.resourceMap.length, 4, 'resource count');
        assert.equal(flattened.resourceMap.getResource(0).metadata.name, 'parent', 'parent should be first');
        assert.equal(flattened.resourceMap.getResource(1).metadata.name, 'childA', 'childA should be second');
        assert.equal(flattened.resourceMap.getResource(2).metadata.name, 'childB', 'childB should be second');
        assert.equal(flattened.resourceMap.getResource(3).metadata.name, 'grandchild', 'grandchild should be fourth');
      });
    });
  });

  describe('compile', function(){
    let configMapGenerator = new ConfigMapGenerator('foo');
    configMapGenerator.add('fiz', 'buz');

    let secretGenerator = new SecretGenerator('boo');
    secretGenerator.add('fiz', Buffer.from('buz', 'utf8').toString('base64'));

    let kustom = new Kustomization();
    kustom.addConfigMapGenerator(configMapGenerator);
    kustom.addSecretGenerator(secretGenerator);
    kustom.addResourceMap(ResourceMap.factory([
      {
        kind: 'test', metadata: {name: 'test-resource'}, spec: {
          containers: [
            {
              name: 'test-container',
              env: [
                {
                  name: 'CONFIG_VAR',
                  valueFrom: {
                    configMapKeyRef: {
                      name: 'foo',
                      key: 'fiz'
                    }
                  }
                },
                {
                  name: 'SECRET_VAR',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'boo',
                      key: 'fiz'
                    }
                  }
                },
              ]
            }
          ]
        }
      }
    ]));

    let compiled = kustom.compile();

    it('converts config map generators to resources', ()=>{
      let filtered = compiled.filter(val => val.metadata.name === configMapGenerator.generatedName());
      assert(filtered.length === 1, 'resource map should contain generated config map');
    });

    it('converts secret generators to resources', () => {
      let filtered = compiled.filter(val => val.metadata.name === secretGenerator.generatedName());
      assert(filtered.length === 1, 'resource map should contain generated secret');
    });

    it('appends hashes to (generator) config map names references', () => {
      let filtered = compiled.filter(val => val.metadata.name === 'test-resource');
      assert(filtered.length === 1, 'resource map should contain test-resource');
      assert.equal(filtered[0].spec.containers[0].env[0].valueFrom.configMapKeyRef.name, configMapGenerator.generatedName(), 'config map reference should be replaced')
    });

    it('appends hashes to (generator) secret names references', () => {
      let filtered = compiled.filter(val => val.metadata.name === 'test-resource');
      assert(filtered.length === 1, 'resource map should contain test-resource');
      assert.equal(filtered[0].spec.containers[0].env[1].valueFrom.secretKeyRef.name, secretGenerator.generatedName(), 'secret reference should be replaced')
    });
  });
});
