const Path = require('path');
const vorpal = require('vorpal')();
const loader = require('./src/loader');
const Kustomization = require('./src/kustomization');

vorpal
  .delimiter('kumulate$')
  .command('build <path>', 'outputs accumulated kustomizations.')
  .action(function(args, callback) {
    loader(Path.resolve(args.path, 'kustomization.yml'))
      .then(yml => {
        let kustom = Kustomization.factory(yml, args.path);
        this.log(kustom.render())
      })
      .catch(err => this.log(err))
      .finally(() => callback());
  });


module.exports = vorpal;
