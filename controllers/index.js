
module.exports = {
    'GET /': async (ctx, next) => {
        ctx.render('home.html');
    },
    'GET /home': async (ctx, next) => {
        ctx.render('home.html');
    },
    'GET /login': async (ctx, next) => {
        ctx.render('login.html');
    },
    'GET /addBook': async (ctx, next) => {
        ctx.render('addBook.html');
    },
    'GET /addArchive': async (ctx, next) => {
        ctx.render('addArchive.html');
    }
};
