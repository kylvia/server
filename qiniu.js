const path = require('path')
const fs = require('fs')
const Busboy = require('busboy')
const qiniu = require('qiniu')
const qiniuConfig = require('./qiniuconfig')
const inspect = require('util').inspect
let qn = {
// 写入目录
  mkdirsSync :(dirname) => {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
    return false
  },
  getSuffix :function(fileName) {
    return fileName.split('.').pop()
  },
  Rename :function(fileName) {
    return Math.random().toString(16).substr(2) + '.' + this.getSuffix(fileName)
  },
  removeTemImage :function(path) {
    fs.unlink(path, (err) => {
      if (err) {
        throw err
      }
    })
  },
  upToQiniu :function(filePath, key) {
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
          return
        }
        if (respInfo.statusCode == 200) {
          resolved(respBody)
        } else {
          resolved(respBody)
        }
      })
    })

  },
  uploadFile :function(ctx, options) {
    const _this = this
    const _emmiter = new Busboy({headers: ctx.req.headers})
    const fileType = options.fileType
    const filePath = path.join(options.path, fileType)
    const confirm = this.mkdirsSync(filePath)
    if (!confirm) {
      return
    }
    console.log('start uploading...')
    return new Promise((resolve, reject) => {
      _emmiter.on('file', function (fieldname, file, filename, encoding, mimetype) {
        const fileName = _this.Rename(filename)
        const saveTo = path.join(path.join(filePath, fileName))
        file.pipe(fs.createWriteStream(saveTo))
        file.on('end', function () {
          resolve({
            imgPath: `/${fileType}/${fileName}`,
            imgKey: fileName
          })
        })
      })

      _emmiter.on('finish', function () {
        console.log('finished...')
      })

      _emmiter.on('error', function (err) {
        console.log('err...')
        reject(err)
      })

      ctx.req.pipe(_emmiter)
    })
  }
}
module.exports=qn
