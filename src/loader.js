const Path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const { logger } = require('./logger');

function load(path, cwd = './') {
  let resolved = Path.resolve(cwd, path);
  logger.info(`resolved ${resolved} from ${path}, ${cwd}`);
  if(! fs.existsSync(resolved)) {
    throw new Error(`could not load ${path} from ${cwd}: ${resolved} does not exist`);
  }

  try {
    let contents = fs.readFileSync(resolved, 'utf8');
    let yml = yaml.safeLoadAll(contents);
    return yml;
  } catch (err) {
      throw new Error(`could not load ${path} from ${cwd}: ${err.message}`);
  }

}

function loadAsBase64(path, cwd = './') {
  let resolved = Path.resolve(cwd, path);
  logger.info(`resolved ${resolved} from ${path}, ${cwd}`);
  if(! fs.existsSync(resolved)) {
    throw new Error(`could not load ${path} from ${cwd}: ${resolved} does not exist`);
  }

  try {
    let contents = fs.readFileSync(resolved);
    return contents.toString('base64');
  } catch (err) {
    throw new Error(`could not load ${path} from ${cwd}: ${err.message}`);
  }
}

function loadAsString(path, cwd = './') {
  let resolved = Path.resolve(cwd, path);
  logger.info(`resolved ${resolved} from ${path}, ${cwd}`);
  if(! fs.existsSync(resolved)) {
    throw new Error(`could not load ${path} from ${cwd}: ${resolved} does not exist`);
  }

  try {
    let contents = fs.readFileSync(resolved);
    return contents.toString('utf8');
  } catch (err) {
    throw new Error(`could not load ${path} from ${cwd}: ${err.message}`);
  }
}


module.exports = {
  load,
  loadAsBase64,
  loadAsString
};
