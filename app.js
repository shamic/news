const Koa = require('koa');

const bodyParser = require('koa-bodyparser');

const controller = require('./controller');

const templating = require('./templating');

const rest = require('./rest');

const logger = require('./logger.js');

const jwt = require('koa-jwt')
const secret = require('./jwt/secret.json')
const err = require('./jwt/error')

const app = new Koa();

// log request URL:
app.use(async (ctx, next) => {
    logger.info(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// jwt check token
app.use(err());

// static file support:
let staticFiles = require('./static-files');
app.use(staticFiles('/static/', __dirname + '/static'));
app.use(staticFiles('/images/', __dirname + '/images'));
app.use(staticFiles('/archives/', __dirname + '/archives'));

// parse request body:
app.use(bodyParser());

// jwt dont check in login
app.use(jwt({secret: secret.sign}).unless({path: [/^\//, /^\/api\/login/, /^\/api\/createUser/]}))

// add nunjucks as view:
app.use(templating('views', {
    noCache: true,
    watch: true
}));

// bind .rest() for ctx:
app.use(rest.restify());

// add controllers:
app.use(controller());

app.listen(3000);
logger.info('app started at port 3000...');
