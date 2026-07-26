const cfg = require('./webpack.config.js');
const vegaCjs = cfg.find(c => c.output && c.output.path && c.output.path.endsWith('cjs/vega'));
vegaCjs.optimization = { minimize: false };
vegaCjs.mode = 'development';
vegaCjs.devtool = false;
module.exports = vegaCjs;
