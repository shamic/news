
const fs = require('fs');
const send = require('koa-send');
// const qiniu = require('qiniu');

// add url-route in /controllers:

function addMapping(router, mapping) {
    for (var url in mapping) {
        if (url.startsWith('GET ')) {
            var path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            var path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`register URL mapping: POST ${path}`);
        } else if (url.startsWith('PUT ')) {
            var path = url.substring(4);
            router.put(path, mapping[url]);
            console.log(`register URL mapping: PUT ${path}`);
        } else if (url.startsWith('DELETE ')) {
            var path = url.substring(7);
            router.del(path, mapping[url]);
            console.log(`register URL mapping: DELETE ${path}`);
        } else {
            console.log(`invalid URL: ${url}`);
        }
    }
}

function addControllers(router, dir) {
    fs.readdirSync(__dirname + '/' + dir).filter((f) => {
        return f.endsWith('.js');
    }).forEach((f) => {
        console.log(`process controller: ${f}...`);
        let mapping = require(__dirname + '/' + dir + '/' + f);
        addMapping(router, mapping);
    });
}

function addUploadFile(router) {
    //文件上传  
    const multer = require('koa-multer');
    //配置  
    var storage = multer.diskStorage({
        //文件保存路径  
        destination: function (req, file, cb) {
            if (file.originalname.match(/.txt/)) {
                cb(null, './uploads/')
            } else if (file.originalname.match(/.mp3/) || file.originalname.match(/.mp4/)) {
                cb(null, './audios/');
            } else {
                cb(null, './images/')
            }
        },
        filename: function (req, file, cb) {
            var fileFormat = (file.originalname).split(".");
            cb(null, fileFormat[0] + '_' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
        }
    })
    var upload = multer({ storage: storage });
    //upload.single('file')这里面的file是上传空间的name<input type="file" name="file"/>    
    router.post('/uploadFile', upload.single('file'), async (ctx, next) => {
        // const filePath = __dirname + '/uploads/' + ctx.req.file.filename;
        // // 上传到七牛
        // const qiniu = await upToQiniu(filePath, ctx.req.file.filename.split('.').pop())
        // // 上存到七牛之后 删除原来的缓存图片
        // removeTemImage(imgPath)
        ctx.response.body = {
            code: 0,
            msg: 'upload file success',
            data: ctx.req.file.filename
        };
    })
    console.log(`register URL mapping: POST /uploadFile`);
}

function addDownloadFile(router) {
    // download txt/audio
    router.get('/download', async (ctx, next) => {
        var fileType = ctx.request.query.fileType || 1; // 1: txt 2: audio
        var fileName = ctx.request.query.fileName || '';
        var path = '/uploads';
        if (fileType == 2) {
            path = '/audios';
        }
        // Set Content-Disposition to "attachment" to signal the client to prompt for download.
        // Optionally specify the filename of the download.
        // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
        // 也可以直接设置 ctx.set("Content-disposition", "attachment; filename=" + fileName);
        try {
            ctx.attachment(fileName);
            await send(ctx, fileName, { root: __dirname + path });
        } catch (error) {
            ctx.response.body = {
                code: -1,
                msg: 'download file fail'
            };
        }
    });
    console.log(`register URL mapping: GET /download`);
}

// 上传到七牛
function upToQiniu(filePath, key) {
    const accessKey = qiniuConfig.accessKey // 你的七牛的accessKey
    const secretKey = qiniuConfig.secretKey // 你的七牛的secretKey
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)

    const options = {
        scope: qiniuConfig.scope // 你的七牛存储对象
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(mac)

    const config = new qiniu.conf.Config()
    // 空间对应的机房
    config.zone = qiniu.zone.Zone_z2
    const localFile = filePath
    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()
    // 文件上传
    return new Promise((resolved, reject) => {
        formUploader.putFile(uploadToken, key, localFile, putExtra, function (respErr, respBody, respInfo) {
            if (respErr) {
                reject(respErr)
            }
            if (respInfo.statusCode == 200) {
                resolved(respBody)
            } else {
                resolved(respBody)
            }
        })
    })
}

module.exports = function (dir) {
    let
        controllers_dir = dir || 'controllers',
        router = require('koa-router')();
    addControllers(router, controllers_dir);
    addUploadFile(router);
    addDownloadFile(router);
    return router.routes();
};
