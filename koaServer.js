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

var mongoose=require('mongoose');
var assert = require("assert");
mongoose.connect('mongodb://localhost:27017/VueDB');
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
            let obj = {id:'',name:''}
            obj.id = item._id
            obj.name = item.name
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

  let name = ctx.request.body.classes
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
          newClasses.save(function (err) {
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
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Article.findById(ctx.request.query.id,function (err,article) {
        // assert.equal(null,err);
        if(null !== err){
          resolve(errSend)
          return
        }
        resolve({
          code:100,
          data:{
            classes: article.classes, //分类 0、1
            comment_disabled: article.comment_disabled, //开启评论
            content_short: article.content_short, //开启评论
            content: article.content, //正文
            display_time: article.display_time, //发布时间
            pageviews: article.pageviews || 0, //浏览量
            image_uri: article.image_uri, //图片链接
            articleType: article.articleType, //文章类型 原创、转载
            title: article.title, //标题
          },
          message:'查询成功'
        })
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
  try{
    ctx.body = await new Promise((resolve, reject) => {

      Classes.findById(_data.classes).then(function (classRes) {
        if(!classRes){
          resolve(errSend)
          return
        }
        _data = Object.assign({
          classes: "",
          classesLabel: classRes && classRes.name || '',
          comment_disabled: true,
          articleType: 0,
          pageviews: 0,
          display_time: +(new Date()),
          content: '<p>我是mongoDb测试数据我是测试数据</p><p><img class="wscnph" src="https://www.pv.synpowertech.com/images/banner1.png" data-wscntype="image" data-wscnh="300" data-wscnw="400" data-mce-src="https://www.pv.synpowertech.com/images/banner1.png"></p>"',
          content_short: '我是测试数据',
          image_uri: 'https://www.pv.synpowertech.com/images/banner1.png',
          status: 'published',
          title: 'vue-element-admin'
        },_data)
        let newArticle = new Model.Article(_data);
        newArticle.save().then(function (article) {
          if(article){
            resolve({
              code:100,
              data:null,
              message:'添加成功！'
            })
          }else {
            resolve(errSend)
          }
        }).catch(function (err) {
          console.log(err)
          reject(errSend)
        })

      }).catch(function (promiseErr) {
        console.log(promiseErr)
        reject(errSend)
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
  console.log('_data:',_data)
  try{
    ctx.body = await new Promise((resolve, reject) => {

      Classes.findById(_data.classes).then(function (classRes) {
        console.log('classRes:',classRes)
        if(!classRes){
          resolve(errSend)
          return
        }

        Model.Article.findById(_data.id,function (err,article) {
          // assert.equal(null,err,'查找失败');
          if(null !== err){
            resolve(errSend)
            return
          }
          if(article){
            _data.classesLabel = classRes.name
            Model.Article.update({_id:_data.id},{$set:_data},function (err,upRes) {
              if(!!err){
                resolve(errSend)
                return
              }
              if(upRes){
                resolve({
                  code:100,
                  data:null,
                  message:'修改成功！'
                })
              }else {
                resolve(errSend)
              }
            })

          }else {
            resolve({
              code:101,
              data:null,
              message:'修改失败！'
            })
          }


        })
      }).catch(function (promiseErr) {
        console.log(promiseErr)
        reject(errSend)
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
  try{
    ctx.body = await new Promise((resolve, reject) => {

      Model.Article.findById(id,function (err,article) {
        // assert.equal(null,err,'查找失败');
        if(null !== err){
          resolve(errSend)
          return
        }
        if(article){
          Model.Article.findByIdAndRemove({_id:id},function (err,numberAffected) {
            assert.equal(null,err)
            if(null !== err){
              resolve(errSend)
              return
            }
            resolve({
              code:100,
              data:null,
              message:'删除成功！'
            })
          })
        }else {
          resolve(errSend)
        }

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
    avatar:[]
  },_data)
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.SysSetting.findOne({name:_data.userName},function (err,setting) {
        console.log(setting)
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
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Article.find(query,function (err,list) {
        assert.equal(null,err);
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
              timestamp:item.display_time,
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

      Model.Article.findById(_data.id,function (err,resData) {
        if(null !== err || !resData){
          resolve(errSend)
          return
        }
        Model.Article.update({_id:Object(_data.id)},{$set:{status:_data.status}},function (err) {
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
      })
    })
  }catch (err){
    ctx.throw(500);
  }
})
/*MongoClient.connect(Urls,function (err,db) {
  assert.equal(null,err);

  db.collection("vueTest").insert({name:"xiaoming",pwd:'159647'},function (err,res) {
    assert.equal(null,err)
    console.log(res)
    db.close()
  })
})*/

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
  let page = ctx.request.query.page || 1
  let limit = ctx.request.query.limit || 10
  try{
    ctx.body = await new Promise((resolve, reject) => {
      Model.Article.find(function (err,list) {
        assert.equal(null,err);
        let len = list.length
        let arr = []
        if(len){
          console.log('len========',len)
          arr = list.filter(function (value, index) {
            return index>=limit*(page-1) && index<(limit*page)
          })
          let resData = []
          arr.map(function (item, index) {
            console.log(item.title)
            !(+item.status) && resData.push({
              id:item.id,
              timestamp:item.display_time,
              articleType:item.articleType,
              title:item.title,
              image_uri:item.image_uri,
              content_short:item.content_short,
              classesLabel:item.classesLabel,
              pageviews:item.pageviews || 0
            })
          })
          resolve({
            code:100,
            data:{
              items:resData,
              total:list.length
            },
            message:'查询成功'
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
  // 上传到七牛
  const qiniu = await qn.upToQiniu(imgPath, result.imgKey)
  // 上存到七牛之后 删除原来的缓存图片
  qn.removeTemImage(imgPath)
  ctx.body = {
    imgUrl: `http://pb9ts7ae2.bkt.clouddn.com/${qiniu.key}`
  }
})



//文章列表
const ArticleList = {
  insert:function (params) {
    let promise = new Promise(function (resolve,reject) {
      Model.List.findById(params.articleId,function (err,res) {
        if(null !== err || res){
          resolve(false)
          return
        }
        if(!res){
          let newArticleList = new Model.List(params);
          newArticleList.save(function (err, docs) {
            if(null !== err){
              resolve(false)
            }else {
              resolve(true)
            }
          })
        }
      })
    })
    return promise
  },
  update:function (params) {
    let promise = new Promise(function (resolve,reject) {
      Model.List.findOne({articleId:params.articleId},function (err,res) {
        if(null !== err || !res){
          resolve(false)
        }
        Model.List.update({articleId:params.articleId},{$set:params},function (err) {
          if(null !== err){
            resolve(false)
          }else {
            resolve(true)
          }
        })
      })
    })
    return promise

  },
  updateStatus:function () {
    Model.List.findById({id:params.id},function (err,res) {
      if(null !== err || !res){
        resolve(false)
      }
      Model.List.update({articleId:params.articleId},{$set:params},function (err) {
        if(null !== err){
          resolve(false)
        }else {
          resolve(true)
        }
      })
    })
  }
}

const Classes = {
  fetch:function () {
    let promise = new Promise(function (resolve,reject) {
      Model.ClassesList.fetch(function (err,classes) {
        // assert.equal(null,err);
        if(null !== err){
          reject(err)
          return
        }
        let arr = []
        if(classes.length){
          classes.map(function (item,index) {
            let obj = {id:'',name:''}
            obj.id = item._id
            obj.name = item.name
            arr.push(obj)
          })
        }
        resolve(arr)
      })
    })
    return promise
  },
  findById:function (id) {
    let promise = new Promise(function (resolve,reject) {
      Model.ClassesList.findById(id,function (err,classes) {
        if(null !== err){
          reject(err)
          return
        }
        if(!classes){
          resolve('')
          return
        }
        resolve({
          id:classes._id,
          name:classes.name
        })
      })
    })
    return promise
  }
}
/*MongoClient.connect(Urls,function (err,db) {
  assert.equal(null,err);

  db.collection("vueTest").find({name:"admin"}).toArray(function (err,res) {
    assert.equal(null,err)
    console.log(res)
    db.close()
  })
})

MongoClient.connect(Urls,function (err,db) {
  assert.equal(null,err);

  db.collection("vueTest").update({name:"xiaoming"},{$set:{name:'zhangsan'}},function (err,res) {
    assert.equal(null,err)
    console.log(res)
    db.close()
  })
})*/

/*MongoClient.connect(Urls,function (err,db) {
  assert.equal(null,err);

  db.collection("vueTest").deleteOne({name:"kylvia"},function (err,res) {
    assert.equal(null,err)
    console.log(res)
    db.close()
  })
})*/


app.use(router.routes())
  .use(router.allowedMethods());

app.listen(port);
