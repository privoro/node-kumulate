const winston = require('winston');

const transport = new winston.transports.Console({
  level: 'error',
  stderrLevels: [
    'emerg', 'alert', 'crit', 'error', 'warning',
    'notice', 'info', 'debug',
    'warn', 'verbose', 'silly'
  ]
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    transport
  ]
});

module.exports = {
  logger,
  setLevel: (level) => {
    transport.level = level;
  }
};
