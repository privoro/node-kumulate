const ConfigMapGenerator = require('./configMapGenerator');
const assert = require('assert');


describe('configMapGenerator', function(){
  describe('factory', function() {
    it('loads files into map', () => {
      let basePath = __dirname + '/../tests/generators/configMap';
      let yml = {name: 'foo', files: ['foo.bar.txt', 'test.properties']};
      let generator = ConfigMapGenerator.factory(yml, basePath);
      let fooBar = generator.get('foo.bar.txt');
      let fooBarExpected = "whizbang\n";
      assert.equal(fooBar, fooBarExpected, 'utf8 file contents loaded as key');

      let test = generator.get('test.properties');
      let testExpected = "foo=bar\nfiz=buz\n";
      assert.equal(test, testExpected, 'properties file contents loaded as key');
    });

    it('loads literals into map', () => {
      let basePath = __dirname + '/../tests/generators/configMap';
      let yml = {name: 'foo', literals: ['foo=bar','f_i_z=fuz']};
      let generator = ConfigMapGenerator.factory(yml, basePath);
      assert.equal(generator.get('foo'), 'bar', 'literal loaded');
      assert.equal(generator.get('f_i_z'), 'fuz', 'literal loaded');
    });

    it('loads env files into map', () => {
      let basePath = __dirname + '/../tests/generators/configMap';
      let yml = {name: 'foo', envFiles: ['test.properties']};
      let generator = ConfigMapGenerator.factory(yml, basePath);
      assert.equal(generator.get('foo'), 'bar', 'literal loaded');
      assert.equal(generator.get('fiz'), 'buz', 'literal loaded');
    })
  });
});
