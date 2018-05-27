// const products = require('../products');
const model = require('../model');
const logger = require('../logger.js');

const jwt = require('jsonwebtoken')
const secret = require('../jwt/secret.json')
const bcrypt = require('bcryptjs')

let User = model.User;
let Books = model.Books;

const APIError = require('../rest').APIError;

module.exports = {
    'POST /api/login': async (ctx, next) => {
        var email = ctx.request.body.email;
        var password = ctx.request.body.password;
        const user = await User.findOne({
            where: {
                email
            }
        })

        // 判断用户是否存在
        if (user) {
            // 判断前端传递的用户密码是否与数据库密码一致
            if (bcrypt.compareSync(password, user.password)) {
                // 用户token
                const userToken = {
                    name: user.email,
                    id: user.id
                }
                const token = jwt.sign(userToken, secret.sign, { expiresIn: '4h' })  // 签发token
                ctx.rest({
                    data: { token: token }
                });
            } else {
                ctx.rest({
                    code: -102,
                    msg: '用户名或密码错误'
                });
            }
        } else {
            ctx.rest({
                code: -101,
                msg: '用户不存在'
            });
        }
    },

    'POST /api/createUser': async (ctx, next) => {
        var email = ctx.request.body.email;
        var password = ctx.request.body.password;

        var mCode = ctx.request.body.mCode;
        if (mCode != 'hello man') {
            ctx.rest({
                code: -1,
                msg: '参数错误'
            });
            return;
        }

        if (password && email) {
            const existUser = await User.findOne({
                where: {
                    email
                }
            }) 
            if (existUser) {
                ctx.rest({
                    code: -101,
                    msg: '用户名已经存在'
                });
            } else {
                // 密码加密
                const salt = bcrypt.genSaltSync()
                const hash = bcrypt.hashSync(password, salt)
                password = hash

                await User.create({
                    email: email, 
                    password: password
                });
                const newUser = await User.findOne({
                    where: {
                        email
                    }
                }) 

                // 签发token
                const userToken = {
                    name: newUser.email,
                    id: newUser.id
                }
                const token = jwt.sign(userToken, secret.sign, { expiresIn: '4h' })

                ctx.rest({
                    msg: '创建成功',
                    data: { token: token }
                });
            }
        } else {
            ctx.rest({
                code: -1,
                msg: '参数错误'
            });
        }
    },

    'POST /api/checkAuth': async (ctx, next) => {
        if (ctx.auth && ctx.auth.code != 0) {
            ctx.rest({
                code: ctx.auth.code,
                msg: ctx.auth.message
            })
            return
        } else {
            ctx.rest({
                data: {auth: 'success'}
            })
        }
    },

    'POST /api/home': async (ctx, next) => {
        var data = {
            banner: [
                {img: 'banner1.jpg', desc: '', type: 'banner', categoryId: '1', items:[]}, 
                {img: 'banner2.jpg', desc: '', type: 'banner', categoryId: '2', items:[]}
            ],
            category: [
                {img: '', desc: '小说', type: 'category', categoryId: '1', items:[]}, 
                {img: '', desc: '听书', type: 'category', categoryId: '2', items:[]},
                {img: '', desc: '杂志', type: 'category', categoryId: '3', items:[]}, 
                {img: '', desc: '动漫', type: 'category', categoryId: '4', items:[]}
            ]
        }
        var itemList = []
        for (var i = 1; i < 5; i++) {
            var resutl = await Books.findAll({limit: 3, order: 'createdAt asc', where: {type: i}});
            if (resutl && resutl.length > 0) {
                var des = '';
                switch(i) {
                case 1:
                    des = '小说';
                    break;
                case 2:
                    des = '听书';
                    break;
                case 3:
                    des = '杂志';
                    break;
                case 4:
                    des = '动漫';
                    break;
                case 5:
                    des = '资讯';
                    break;
                default:
                    des = '小说';
                }
                var item = {img: '', desc: des, type: 'itemList', categoryId: '', items: resutl};
                itemList.push(item);
            }
        }
        data.itemList = itemList;

        ctx.rest({
            data: data
        });
    },

    'POST /api/category': async (ctx, next) => {
        var categoryId = parseInt(ctx.request.body.categoryId) || 0;
        var pageSize = parseInt(ctx.request.body.pageSize) || 20;
        var start = parseInt(ctx.request.body.start) || 0;

        var resutl = await Books.findAll({
                offset: start, 
                limit: pageSize, 
                order: 'createdAt asc', 
                where: {type: categoryId}
            });

        if (resutl) {
            ctx.rest({
                data: resutl
            })
        } else {
            ctx.rest({
                code: -1,
                msg: '无该分类'
            });
        }
    },

    'POST /api/book': async (ctx, next) => {
        var bookId = ctx.request.body.bookId || '';
        var resutl = await Books.findOne({
            where: {id: bookId}
        });

        if (resutl) {
            ctx.rest({
                data: resutl
            })
        } else {
            ctx.rest({
                code: -1,
                msg: '未查找到'
            });
        }
    }
};
