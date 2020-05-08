//pro    生产环境
//test   测试环境
//dev    开发环境 
const env = process.env.NODE_ENV === 'devlopment' ? 'dev' : process.env.NODE_ENV === 'production' ? 'pro' : "test";
const { GLOBALCONFIG }  = require(`./${env}.js`);
export { GLOBALCONFIG }