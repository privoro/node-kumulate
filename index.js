const Path = require('path');
const vorpal = require('vorpal')();
const loader = require('./src/loader');
const Kustomization = require('./src/kustomization');
const {setLevel, logger} = require('./src/logger');

vorpal
  .delimiter('kumulate$')
  .command('build <path>', 'outputs accumulated kustomizations.', {})
  .option('--verbose [level]', 'verbosity level', ['error', 'warn', 'info','debug', 'silly'])
  .action(function(args, callback) {
    setLevel(args.options.verbose || 'error');
    try {
      let yml = loader.load(Path.resolve(args.path, 'kustomization.yml'));
      let kustom = Kustomization.factory(yml[0], args.path);
      this.log(kustom.render());
    } catch(err) {
      logger.error(err.message);
      console.error(err);
    }
    callback()
  });


module.exports = vorpal;
