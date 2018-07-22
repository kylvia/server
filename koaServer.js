const Koa = require('koa');
var cors = require('koa2-cors');
const Router = require('koa-router');
const serve = require('koa-static');
const koaBody  = require('koa-body')

const app = new Koa();
const router = new Router();
app.use(cors());
router.use(koaBody())

var port = process.env.PORT || 1124;
app.use(serve(__dirname + '/public/'));

console.log('listening on port '+port);
var Model = require('./model')
var dbHelper = require('./dbHelper')

var mongoose=require('mongoose');
var assert = require("assert");
mongoose.connect('mongodb://127.0.0.1:27017/VueDB');
const path = require('path')
var qn=require('./qiniu');


router.post('/login/login',async (ctx, next) => {
  let query = {name:ctx.request.body.username,pwd:ctx.request.body.password}
  const promist = new Promise(function (resolve,reject) {
    Model.User.findOne(query,function (err,users) {
      assert.equal(null,err);
      if(!users){
        resolve({
          code:101,
          data:'',
          message:'用户名或密码错误'
        })
      }else {
        let token  =  new Date()-0

        Model.User.update(query, {$set :{token:token}},function(error){
          assert.equal(null,error)

          Model.User.findOne(query,function (err,datas) {
            assert.equal(null,error)
            resolve({
              code:100,
              data:datas,
              message:'登陆成功'
            })
          })

        })
      }
    })
  })
  ctx.body =await promist
})
router.get('/user/info',async (ctx, next) => {

  if(ctx.request.query.token){
    try{
      ctx.body = await new Promise((resolve, reject) => {
        Model.User.findOne({token:ctx.request.query.token},function (err,Personal) {
          assert.equal(null,err);
          if(Personal){
            resolve({
              code:100,
              data:Personal,
              message:'登陆成功'
            })
          }else {
            resolve({
              code:104,
              data:null,
              message:'会话过期！'
            })
          }
          // users.close()
        })
      })
    }catch (err){
      ctx.throw(500);
    }
  }else{
    ctx.body ={
      code:104,
      data:null,
      message:'会话过期！'
    }
  }
})

router.post('/api/register',async (ctx, next) => {

  let data = ctx.request.body
  const promist = new Promise(function (resolve,reject) {
    Model.User.find({name: data.name}, function (err, users) {
      assert.equal(null, err);

      if (users.length) {
        resolve({
          code: 101,
          data: null,
          message: '该用户已存在'
        })
      } else {
        let newUser = new Model.User({name: data.name, pwd: data.pwd});
        newUser.save(function (err, user) {
          assert.equal(null, err)
          // db.close()
          resolve({
            code: 100,
            data: null,
            message: '注册成功'
          })
        })
      }
      // users.close()
    })
  })
  ctx.body = await promist
  /*User.fetch(function (err,users) {
    assert.equal(null,err);
    res.send({data:users})
  })*/
})
//查询分类
router.get('/article/classesList',async (ctx, next) => {
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.ClassesList.find(function (err,classes) {
        assert.equal(null,err);
        let arr = []
        if(classes.length){
          classes.map(function (item,index) {
            let obj = {}
            obj.id = item._id
            obj.name = item._doc.name
            arr.push(obj)
          })
        }
        resolve({
          code:100,
          data:arr,
          message:'查询成功'
        })
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})

//新增分类
//param: {classes: 'string1'}
router.post('/article/insertClass',async (ctx, next) => {

  let name = ctx.request.body.name
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.ClassesList.find({name:name},function (err,classes) {
        assert.equal(null,err);
        if(classes.length){
          resolve({
            code:101,
            data:null,
            message:'已存在'
          })
        }else {
          let newClasses = new Model.ClassesList({name:name});
          newClasses.save(function (err,msg) {
            assert.equal(null,err)
            resolve({
              code:100,
              data:null,
              message:'添加成功！'
            })
          })
        }
      })
    })
  }catch (err){
    ctx.throw(500);
  }

})
//文章
//param: {id: 'string1'}
router.get('/article/detail',async (ctx, next) => {
  let _data = ctx.request.query;
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  //更新浏览量
  let _upDateScan
  let _findDetail = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.findDataPopulation(Model.List,{_id:_data.id},'articleId',null,null,null,function (findRes) {
        if(findRes){
          const article = findRes.result[0]
          dbHelper.findDataPopulation(Model.Article,{_id: article.articleId._id},'messageId',null,null,null,function(msgRes) {
            if(msgRes){
              const msgs = msgRes.result[0]
              let mes = []
              if(msgs.messageId && (JSON.stringify(msgs.messageId.msgs)!= "[{}]")){
                mes = msgs.messageId.msgs
              }
              resolve({
                code:100,
                data:{
                  id: article.articleId._id,
                  classes: article.classes, //分类 0、1
                  content_short: article.content_short,
                  msgid: msgs.messageId._id,
                  content: article.articleId.content, //正文
                  display_time: article.display_time, //发布时间
                  pageviews: article.pageviews || 0, //浏览量
                  image_uri: article.image_uri, //图片链接
                  articleType: article.articleType, //文章类型 原创、转载
                  title: article.title, //标题
                  list: mes
                },
                message:'查询成功'
              })
            }else{

            }
          })
        }else{

        }
      })
    })
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      _findDetail().then(res => {
        resolve(res)
      }).catch(err => {
        resolve(err)
      })
    })
  }catch (err){
    ctx.throw(500);
  }


})
//新增文章
//param: {id: 'string1'}
router.post('/article/create',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'新增失败！'
  }

  //查询分类
  let _getClassFun = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.findByIdData(Model.ClassesList,_data.classes,null,null,function (claRes) {
        if(claRes.success){
          _data.classesLabel= claRes.result && claRes.result._doc.name || ''
          resolve(true)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //新增留言
  let _newMsgFun = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.addData(Model.Message,null,function (newData) {
        if(newData.success){
          resolve(newData.result._id)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //新增详情
  let _newDetailFun = function (msgId) {
    return new Promise(function (resolve, reject) {
      dbHelper.addData(Model.Article,{
        content: _data.content,
        messageId: msgId
      },function (newData) {
        if(newData.success){
          resolve(newData.result._id)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //新增列表
  let _newListFun = function (articleId) {
    return new Promise(function (resolve, reject) {
      _data.articleId = articleId
      dbHelper.addData(Model.List,_data,function (newData) {
        if(newData.success){
          resolve({
            code:100,
            data:null,
            message:'添加成功！'
          })
        }else {
          reject(errSend)
        }
      })
    })
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      _getClassFun().then(_newMsgFun).then( res => {
        return _newDetailFun(res)
      }).then( res => {
        return _newListFun(res)
      }).then( res => {
        resolve(res)
      }).catch( err => {
        resolve(err)
      })
    })
  }catch (err){
    ctx.throw(500);
  }


})
//修改文章
router.post('/article/update',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  //更新文章详情
  let _updateArticle = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.updateData(Model.Article, {_id: _data.id} ,{$set: {content:_data.content}},null, function (upArticleRes) {
        if(upArticleRes.success){
          resolve(true)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //更新文章列表
  let _updateList = function (className) {
    return new Promise(function (resolve, reject) {
      _data.classesLabel = className
      dbHelper.updateData(Model.List, {articleId: _data.id} ,{$set: _data},null, function (upListRes) {
        if(upListRes.success){
          resolve(true)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //查询分类
  let _searchClasses = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.findByIdData(Model.ClassesList, _data.classes , null,null, function (searchRes) {
        if(searchRes.success){
          resolve(searchRes.result._doc.name)
        }else {
          reject(errSend)
        }
      })
    })
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      _searchClasses().then(_updateArticle()).then(res => {
        _updateList(res)
      }).then(() => {
        resolve({
          code:100,
          data:null,
          message:'修改成功！'
        })
      }).catch(err => {
            resolve(err)
          })
      })
  }catch (err){
    ctx.throw(500);
  }


})
//删除文章
router.post('/article/delete',async (ctx, next) => {
  let id = ctx.request.body.id;
  let errSend = {
    code:101,
    data:null,
    message:'删除失败！'
  }
  //删除文章
  let _articalFunc = function (articleId) {
    return new Promise(function (resolve, reject) {
      dbHelper.removeById(Model.Article,articleId,null,function (articalRes) {
        if(articalRes.success){
          resolve(true)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //删除留言
  let _msgFunc = function (articleId) {
    return new Promise(function (resolve, reject) {
      dbHelper.findByIdData(Model.Article,articleId,null,null ,function (articalRes) {
        if(articalRes.success){
          const msgId = articalRes.result.messageId
          dbHelper.removeById(Model.Message,msgId,null,function (delRes) {
            if(delRes.success){
              resolve(true)
            }else {
              reject(errSend)
            }
          })
        }else {
          resolve(errSend)
        }
      })
    })
  }
  //查找列表
  let _searchFunc = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.findByIdData(Model.List,id ,null,null,function (searchRes) {
        if(searchRes.success){
          resolve(searchRes.result.articleId)
        }else {
          resolve(errSend)
        }
      })
    })
  }
  //删除列表
  let _detailFunc = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.removeById(Model.List, id,null ,function (delRes) {
        if(delRes.success){
          resolve(true)
        }else {
          resolve(errSend)
        }
      })
    })
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      _searchFunc().then(res => {
        _msgFunc(res).then(_articalFunc(res)).then(_detailFunc()).then(() => {
          resolve({
            code:100,
            data:null,
            message:'删除成功！'
          })
        })
      }).catch(function (err) {
        resolve(err)
      })

    })
  }catch (err){
    ctx.throw(500);
  }
})
//系统设置
//新增
router.post('/sysInfo/insert',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'添加失败！'
  }
  _data = Object.assign({
    name:'jk',
    sysName:'D&K',
    motto:'',
    aboutMe:'',
    avatar:[]
  },_data)
  try{
    ctx.body = await new Promise((resolve, reject) => {

      Model.Article.fetch(function (err,article) {
        if(null !== err || article.length){
          resolve(errSend)
          return
        }

        let newSysSetting = new Model.SysSetting(_data);
        newSysSetting.save(function (err) {
          if(null !== err){
            resolve(errSend)
            return
          }
          // assert.equal(null,err)
          resolve({
            code:100,
            data:null,
            message:'添加成功！'
          })
        })
      })
    })
  }catch (err){
    ctx.throw(500);
  }
  /*Model.Article.findById(id,function (err,article) {
    assert.equal(null,err);
    console.log(article)
    res.send({
      code:100,
      data:article,
      message:'查询成功'
    })
  })*/
})
//修改
router.post('/sysInfo/update',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  _data = Object.assign({
    name:'jk',
    sysName:'D&K',
    motto:'',
    aboutMe:'',
    avatar:''
  },_data)
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.SysSetting.findOne({name:_data.userName},function (err,setting) {
        if(null !== err || !setting){
          resolve(errSend)
          return
        }

        Model.SysSetting.update({name:setting.name},{$set:_data},function (err) {
          if(null !== err){
            resolve(errSend)
            return
          }
          // assert.equal(null,err)
          resolve({
            code:100,
            data:null,
            message:'修改成功！'
          })
        })
      })
    })
  }catch (err){
    ctx.throw(500);
  }
  /*Model.Article.findById(id,function (err,article) {
    assert.equal(null,err);
    console.log(article)
    res.send({
      code:100,
      data:article,
      message:'查询成功'
    })
  })*/
})
//查找
router.post('/sysInfo/list',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.SysSetting.findOne({name:_data.userName},function (err,setting) {
        if(null !== err || !setting){
          resolve(errSend)
          return
        }
        resolve({
          code:100,
          data:{
            "avatar": setting.avatar,
            "sysName": setting.sysName,
            "motto": setting.motto,
            "aboutMe": setting.aboutMe
          },
          message:'查询成功！'
        })

      })
    })
  }catch (err){
    ctx.throw(500);
  }
  /*Model.Article.findById(id,function (err,article) {
    assert.equal(null,err);
    console.log(article)
    res.send({
      code:100,
      data:article,
      message:'查询成功'
    })
  })*/
})
//查询列表
router.get('/article/list',async (ctx, next) => {

  let query = {}
  let page = ctx.request.query.page
  let limit = ctx.request.query.limit
  let classes = ctx.request.query.classes
  let title = ctx.request.query.title
  classes && (query.classes = new RegExp(classes, 'i'))
  title && (query.title = new RegExp(title, 'i'))
  // var query= new RegExp(ctx.request.query.lName, 'i');//模糊查询参数

  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.List.find(query,function (err,list) {
        if(null !== err){
          resolve(errSend)
          return
        }
        let len = list.length
        let arr = []
        let resData = []
        if(len){
          arr = list.filter(function (value, index) {
            return index>=limit*(page-1) && index<(limit*page-1)
          })
          arr.map(function (item, index) {
            resData.push({
              id:item.id,
              display_time:item.display_time,
              title:item.title,
              status:item.status,
              classes:item.classes,
              classesLabel:item.classesLabel,
            })
          })
        }

        resolve({
          code:100,
          data:{
            items:resData,
            total:list.length
          },
          message:'查询成功'
        })
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//修改
router.post('/article/updateStatus',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      dbHelper.updateById(Model.List,_data.id ,{$set:{status:_data.status}},null,function (updateRes) {
        if(updateRes.success){
          resolve({
            code:100,
            data:null,
            message:'修改成功！'
          })
        }else {
          resolve(errSend)
        }
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})

const defaultParams = {
  userName: 'jk'
}
//前端
//param: {id: 'string1'}
router.get('/sysInfoFront/list',async (ctx, next) => {
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.SysSetting.findOne({name:defaultParams.userName},function (err,setting) {
        if(null !== err || !setting){
          resolve(errSend)
          return
        }
        resolve({
          code:100,
          data:{
            "avatar": setting.avatar,
            "sysName": setting.sysName,
            "motto": setting.motto,
            "aboutMe": setting.aboutMe
          },
          message:'查询成功！'
        })

      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
router.get('/userFront/info',async (ctx, next) => {
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.User.findOne({name:defaultParams.userName},function (err,Personal) {
        let errSend = {
          code:101,
          data:null,
          message:'查询失败！'
        }
        assert.equal(null,err);
        if(Personal){
          resolve({
            code:100,
            data:Personal,
            message:'登陆成功'
          })
        }else {
          resolve(errSend)
        }
        // users.close()
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
router.get('/articleFront/list',async (ctx, next) => {
  let query = {}
  let page = ctx.request.query.page || 1
  let limit = ctx.request.query.limit || 10
  let classes = ctx.request.query.classes
  classes && (query.classes = new RegExp(classes, 'i'))
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  //获取文章
  let _articalListFunc = function () {
    return new Promise(function (resolve, reject) {
      dbHelper.findData(Model.List,query,null,null,function(articalRes) {
        if(articalRes.success){
          const list = articalRes.result
          let len = list.length
          let arr = []
          arr = list.filter(function (value, index) {
            return index >= limit * (page - 1) && index < (limit * page)
          })
          let resData = []
          arr.map(function (item, index) {
            !(+item.status) && resData.push({
              id: item.id,
              display_time: item.display_time,
              articleType: item.articleType,
              title: item.title,
              image_uri: item.image_uri,
              content_short: item.content_short,
              classesLabel: item.classesLabel,
              pageviews: item.pageviews || 0
            })
          })
          resolve({
            code:100,
            data:{
              items:resData,
              total:resData.length
            },
            message:'查询成功'
          })
        }else {
          reject({
            code:100,
            data:{
              items:[],
              total:0
            },
            message:'查询成功'
          })
        }
      })
    })
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      _articalListFunc().then(res => {
        resolve(res)
      }).catch(function (err) {
        resolve(err)
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//相册
router.get('/photos/list',async (ctx, next) => {
  try{
    ctx.body = await new Promise((resolve, reject) => {
      let errSend = {
        code:101,
        data:null,
        message:'查询失败！'
      }
      Model.Photos.fetch(function (err,ps) {
        if(err){
          resolve(errSend)
        }
        if(ps){
          var timeFlag = '';
          var arrs = []
          var times = []
          ps.forEach(function (item, index) {
            var date = new Date(item.updateAt)
            var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
            if(timeFlag == time || timeFlag == ''){
              timeFlag = time
              times.push({
                src: item.src,
                _id: item._id,
                ind: index
              })
            }else {
              arrs.push({
                time:timeFlag,
                photos:times
              })
              times = []
              times.push({
                src: item.src,
                _id: item._id,
                ind: index
              })
              timeFlag = time
            }
          })
          if(times.length){
            arrs.push({
              time:timeFlag,
              photos:times
            })
          }
          resolve({
            code:100,
            data:arrs,
            message:''
          })
        }else {
          resolve(errSend)
        }
        // users.close()
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//新增
router.post('/photos/insert',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'上传失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      let newPhotos = new Model.Photos({src: _data.imgUrl});
      newPhotos.save(function (err ,res ) {
        if(null !== err){
          resolve(errSend)
          return
        }
        // assert.equal(null,err)
        resolve({
          code:100,
          data:res,
          message:'上传成功！'
        })
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//删除
router.post('/photos/delete',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'删除失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Photos.deleteById(_data.id,function (err,del) {
        if (err) {
          resolve(errSend)
        }
        if (del) {
          resolve({
            code: 100,
            data: '',
            message: '删除成功'
          })
        } else {
          resolve(errSend)
        }
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})

//留言
router.post('/messageFront/update',async (ctx, next) => {
  let _data = ctx.request.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Article.findMessages(_data.id,function (err,msg) {
        if(err){
          resolve(errSend)
          return
        }else if(!msg.messageId.msgs || JSON.stringify(msg.messageId.msgs) === "[{}]"){
          var currentDate = (new Date())-0;
          Model.Message.update({_id:msg.messageId._id},{$set:{
            msgs: [{
              username: _data.username, //留言者名字
              message: _data.message, //留言信息
              time:  currentDate
            }]
          }},function (err) {
            if(null !== err){
              resolve(errSend)
            }else {
              resolve({
                code:100,
                data:null,
                message:'修改成功！'
              })
            }
          })
        }else {
          var currentDate = (new Date())-0;
          let arr = msg.messageId.msgs
          arr.push({
            username: _data.username, //留言者名字
            message: _data.message, //留言信息
            time:  currentDate
          })
          Model.Message.update({_id:msg.messageId},{$set:{msgs:arr}},function (err) {
            if(null !== err){
              resolve(errSend)
            }else {
              resolve({
                code:100,
                data:null,
                message:'修改成功！'
              })
            }
          })
        }

      })
    })
  }catch (err){
    ctx.throw(500);
  }
})

//留言
router.get('/messageFront/list',async (ctx, next) => {
  let _data = ctx.request.query;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Message.findById(_data.id,function (err,msg) {
        if(err){
          resolve(errSend)
          return
        }else {
          resolve({
            code:100,
            data:msg.msgs,
            message:''
          })
        }

      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//图片上传
router.post('/articleFront/upload', async function(ctx, next) {
  const serverPath = path.join(__dirname, './uploads/')
  // 获取上存图片
  const result = await qn.uploadFile(ctx, {
    fileType: 'album',
    path: serverPath
  })
  const imgPath = path.join(serverPath, result.imgPath)
  let qiniu
  // 上传到七牛
  try{
    qiniu = await qn.upToQiniu(imgPath, result.imgKey)
    // 上存到七牛之后 删除原来的缓存图片
    qn.removeTemImage(imgPath)
    ctx.body = {
      code: 100,
      msg: '',
      data: {
        imgUrl: `http://pb9ts7ae2.bkt.clouddn.com/${qiniu.key}`
      }
    }
  }catch (e){
    ctx.body = {
      code: 101,
      msg: '上传失败，网络错误！',
      data: ''
    }
    return
  }
})
//获取分类
router.get('/messageFront/classes',async (ctx, next) => {
  let _data = ctx.request.query;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  //获取分类
  let _searchCla = function () {
    return new Promise(function (resolve,reject) {
      dbHelper.findData(Model.ClassesList,null,null,null,function (claRes) {
        if(claRes.success){
          resolve(claRes.result)
        }else {
          reject(errSend)
        }
      })
    })
  }
  //根据分类获取列表
  let _searchList = function (classes) {
    return new Promise(function (resolve,reject) {
      dbHelper.findData(Model.List,{classes:classes},null,null,function (claRes) {
        if(claRes.success){
          resolve(claRes.result)
        }else {
          resolve([])
        }
      })
    })
  }
  //重新组合数据
  let _setClasses = function () {
    return new Promise(function (resolve,reject) {
      let arr=[]
      let resData = []
      _searchCla().then(res => {
        arr=[]
        let i=0
        res.map(function (item, index) {
          _searchList(item._id).then(listRes => {

            resData = []
            listRes.map(function (item, index) {
              !(+item.status) && resData.push({
                id: item.id
              })
            })

            i++
            arr.push({
              id:item._id,
              name:item._doc.name,
              len:resData.length
            })
            if(i === res.length ){
              resolve(arr)
            }
          })
        })
      }).catch(() => {
        reject(errSend)
      })
    })
  }

  try{
    ctx.body = await new Promise((resolve, reject) => {
      _setClasses().then(res => {
        resolve({
          code:100,
          data:res,
          message:'添加成功！'
        })
      }).catch(() => {
        resolve(errSend)
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
//图片上传
/*router.post('/articleFront/upload', async function(ctx, next) {
  function uf(imgPath,result){
    let promise = new Promise((resolve, reject) => {
      // 上传到七牛
      const res = qn.upToQiniu(imgPath, result.imgKey)
      resolve(res)
    })
    return promise
  }
  ctx.body = await new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, './uploads/')
    // 获取上存图片
    const result = qn.uploadFile(ctx, {
      fileType: 'album',
      path: serverPath
    })
    const imgPath = path.join(serverPath, result.imgPath)
    uf(imgPath,result).then(function (result) {
      // 上存到七牛之后 删除原来的缓存图片
      qn.removeTemImage(imgPath)
      resolve ({
        code: 100,
        msg: '',
        body: {
          imgUrl: `http://pb9ts7ae2.bkt.clouddn.com/${qiniu.key}`
        }
      })
    })

  })
})*/

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(port);
