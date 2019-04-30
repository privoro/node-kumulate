const loader = require('./loader');
const assert = require('assert');

describe('loader', function() {
  describe('load', function(){
    it('loads relative paths', () => {
      let yml = loader.load('../tests/simple.yml', __dirname);
      assert.equal(yml.length, 1, 'expected single document');
      assert.equal(yml[0].metadata.name, 'simple', 'expected file to be loaded')
    });

    it('loads absolute paths', () => {
      let yml = loader.load(__dirname + '/../tests/simple.yml');

      assert.equal(yml.length, 1, 'expected single document');
      assert.equal(yml[0].metadata.name, 'simple', 'expected file to be loaded');
    });

    it('loads yaml with multiple documents', function(){
      let yml = loader.load('../tests/multi.yml', __dirname);
      assert.equal(yml.length, 2, 'expected multiple documents');
      assert.equal(yml[0].metadata.name, 'fiz', 'expected file to be loaded')
    });

    it('loads url paths');
    it('throws if file does not exist');
    it('throws if file is not yaml');
  });
});
