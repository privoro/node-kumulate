const Path = require('path');
const vorpal = require('vorpal')();
const loader = require('./src/loader');
const Kustomization = require('./src/kustomization');

vorpal
  .delimiter('kumulate$')
  .command('build <path>', 'outputs accumulated kustomizations.')
  .action(function(args, callback) {
    try {
      let yml = loader.load(Path.resolve(args.path, 'kustomization.yml'));
      let kustom = Kustomization.factory(yml[0], args.path);
      this.log(kustom.render());
    } catch(err) {
      this.log(err)
    }
    callback()
  });


module.exports = vorpal;
