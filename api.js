var express = require('express')
var cors = require('cors')
var port = process.env.PORT || 1124;
var app = express();
var Model = require('./model')

var mongoose=require('mongoose');
var assert = require("assert");
mongoose.connect('mongodb://localhost:27017/VueDB');

var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '1mb'}));
app.use('/static',serveStatic('public'));

app.listen(port)

/*app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
  if(req.method=="OPTIONS"){
    res.send(200);/!*让options请求快速返回*!/
  }else
    next();
});*/
app.use(cors())

app.post('/login/login',function(req,res){
  let query = {name:req.body.username,pwd:req.body.password}
  Model.User.findOne(query,function (err,users) {
    assert.equal(null,err);
    if(!users){
      res.send({
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
          res.send({
            code:100,
            data:datas,
            message:'登陆成功'
          })
        })

      })
    }
    // users.close()
  })

  /*User.fetch(function (err,users) {
    assert.equal(null,err);
    res.send({data:users})
  })*/
})
app.get('/user/info',function (req,res) {
  console.log(req.query.token)
  if(req.query.token){
    Model.User.findOne({token:req.query.token},function (err,Personal) {
      assert.equal(null,err);
      console.log('[Personal]:',Personal)
      if(Personal){
        res.send({
          code:100,
          data:Personal,
          message:'登陆成功'
        })
      }else {
        res.send({
          code:104,
          data:null,
          message:'会话过期！'
        })
      }
      // users.close()
    })
  }else{
    res.send({
      code:104,
      data:null,
      message:'会话过期！'
    })
  }
})

app.post('/api/register',function(req,res){

  let data = req.body
  Model.User.find({name:data.name},function (err,users) {
    assert.equal(null,err);

    if(users.length){
      res.send({
        code:101,
        data:null,
        message:'该用户已存在'
      })
    }else {
      let newUser = new Model.User({name:data.name,pwd:data.pwd});
      newUser.save(function (err,user) {
        assert.equal(null,err)
        // db.close()
        res.send({
          code:100,
          data:null,
          message:'注册成功'
        })
      })
    }
    // users.close()
  })

  /*User.fetch(function (err,users) {
    assert.equal(null,err);
    res.send({data:users})
  })*/
})
//查询分类
app.get('/article/classesList',function (req,res) {
  console.log('[req.body]:',req.query)

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
    res.send({
      code:100,
      data:arr,
      message:'查询成功'
    })
  })
})

//新增分类
//param: {classes: 'string1'}
app.post('/article/insertClass',function (req,res) {
  console.log('[req.body]:',req.body)
  let name = req.body.classes

  Model.ClassesList.find({name:name},function (err,classes) {
    assert.equal(null,err);
    if(classes.length){
      res.send({
        code:101,
        data:null,
        message:'已存在'
      })
    }else {
      let newClasses = new Model.ClassesList({name:name});
      newClasses.save(function (err) {
        assert.equal(null,err)
        res.send({
          code:100,
          data:null,
          message:'添加成功！'
        })
      })
    }
  })
})
//文章
//param: {id: 'string1'}
app.get('/article/detail',function (req,res) {
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  Model.Article.findById(req.query.id,function (err,article) {
    // assert.equal(null,err);
    if(null !== err){
      res.send(errSend)
      return
    }
    res.send({
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
//新增文章
//param: {id: 'string1'}
app.post('/article/create',function (req,res) {
  let _data = req.body;
  let errSend = {
    code:101,
    data:null,
    message:'新增失败！'
  }
  Classes.findById(_data.classes).then(function (classRes) {
    if(!classRes){
      res.send(errSend)
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
        res.send({
          code:100,
          data:null,
          message:'添加成功！'
        })
      }else {
        res.send(errSend)
      }
    }).catch(function (err) {
      console.log(err)
      res.send(errSend)
    })

  }).catch(function (promiseErr) {
    console.log(promiseErr)
    res.send(errSend)
  })

})
//修改文章
app.post('/article/update',function (req,res) {
  let _data = req.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  console.log('_data:',_data)
  Classes.findById(_data.classes).then(function (classRes) {
    console.log('classRes:',classRes)
    if(!classRes){
      res.send(errSend)
      return
    }

    Model.Article.findById(_data.id,function (err,article) {
      // assert.equal(null,err,'查找失败');
      if(null !== err){
        res.send(errSend)
        return
      }
      if(article){
        _data.classesLabel = classRes.name
        Model.Article.update({_id:_data.id},{$set:_data},function (err,upRes) {
          if(!!err){
            res.send(errSend)
            return
          }
          if(upRes){
            res.send({
              code:100,
              data:null,
              message:'修改成功！'
            })
          }else {
            res.send(errSend)
          }
        })

      }else {
        res.send({
          code:101,
          data:null,
          message:'修改失败！'
        })
      }


    })
  }).catch(function (promiseErr) {
    console.log(promiseErr)
    res.send(errSend)
  })


})
//删除文章
app.post('/article/delete',function (req,res) {
  let id = req.body.id;
  let errSend = {
    code:101,
    data:null,
    message:'删除失败！'
  }
  Model.Article.findById(id,function (err,article) {
    // assert.equal(null,err,'查找失败');
    if(null !== err){
      res.send(errSend)
      return
    }
    if(article){
      Model.Article.findByIdAndRemove({_id:id},function (err,numberAffected) {
        assert.equal(null,err)
        if(null !== err){
          res.send(errSend)
          return
        }
        res.send({
          code:100,
          data:null,
          message:'删除成功！'
        })
      })
    }else {
      res.send(errSend)
    }

  })

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
app.post('/sysInfo/insert',function (req,res) {
  let _data = req.body;
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
    avater:[]
  },_data)
  Model.Article.fetch(function (err,article) {
    if(null !== err || article.length){
      res.send(errSend)
      return
    }

    let newSysSetting = new Model.SysSetting(_data);
    newSysSetting.save(function (err) {
      if(null !== err){
        res.send(errSend)
        return
      }
      // assert.equal(null,err)
      res.send({
        code:100,
        data:null,
        message:'添加成功！'
      })
    })
  })
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
app.post('/sysInfo/update',function (req,res) {
  let _data = req.body;
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
    avater:[]
  },_data)
  Model.SysSetting.findOne({name:_data.userName},function (err,setting) {
    console.log(setting)
    if(null !== err || !setting){
      res.send(errSend)
      return
    }

    Model.SysSetting.update({name:setting.name},{$set:_data},function (err) {
      if(null !== err){
        res.send(errSend)
        return
      }
      // assert.equal(null,err)
      res.send({
        code:100,
        data:null,
        message:'修改成功！'
      })
    })
  })
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
app.post('/sysInfo/list',function (req,res) {
  let _data = req.body;
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  Model.SysSetting.findOne({name:_data.userName},function (err,setting) {
    if(null !== err || !setting){
      res.send(errSend)
      return
    }
    res.send({
      code:100,
      data:{
        "avater": setting.avater,
        "sysName": setting.sysName,
        "motto": setting.motto,
        "aboutMe": setting.aboutMe
      },
      message:'查询成功！'
    })

  })
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
app.get('/article/list',function (req,res) {

  let query = {}
  let page = req.query.page
  let limit = req.query.limit
  let classes = req.query.classes
  let title = req.query.title
  classes && (query.classes = new RegExp(classes, 'i'))
  title && (query.title = new RegExp(title, 'i'))
  // var query= new RegExp(req.query.lName, 'i');//模糊查询参数
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

    res.send({
      code:100,
      data:{
        items:resData,
        total:list.length
      },
      message:'查询成功'
    })
  })
})
//修改
app.post('/article/updateStatus',function (req,res) {
  let _data = req.body;
  let errSend = {
    code:101,
    data:null,
    message:'修改失败！'
  }
  Model.Article.findById(_data.id,function (err,resData) {
    if(null !== err || !resData){
      res.send(errSend)
      return
    }
    Model.Article.update({_id:Object(_data.id)},{$set:{status:_data.status}},function (err) {
      if(null !== err){
        res.send(errSend)
      }else {
        res.send({
          code:100,
          data:null,
          message:'修改成功！'
        })
      }
    })
  })
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
app.get('/sysInfoFront/list',function (req,res) {
  let errSend = {
    code:101,
    data:null,
    message:'查询失败！'
  }
  Model.SysSetting.findOne({name:defaultParams.userName},function (err,setting) {
    if(null !== err || !setting){
      res.send(errSend)
      return
    }
    res.send({
      code:100,
      data:{
        "avater": setting.avater,
        "sysName": setting.sysName,
        "motto": setting.motto,
        "aboutMe": setting.aboutMe
      },
      message:'查询成功！'
    })

  })
})
app.get('/userFront/info',function (req,res) {
  Model.User.findOne({name:defaultParams.userName},function (err,Personal) {
    let errSend = {
      code:101,
      data:null,
      message:'查询失败！'
    }
    assert.equal(null,err);
    if(Personal){
      res.send({
        code:100,
        data:Personal,
        message:'登陆成功'
      })
    }else {
      res.send(errSend)
    }
    // users.close()
  })
})
app.get('/articleFront/list',function (req,res) {
  let page = req.query.page || 1
  let limit = req.query.limit || 10
  Model.Article.find(function (err,list) {
    assert.equal(null,err);
    let len = list.length
    let arr = []
    if(len){
      arr = list.filter(function (value, index) {
        return index>=limit*(page-1) && index<(limit*page-1)
      })
      let resData = []
      arr.map(function (item, index) {
        !(+item.status) && resData.push({
          id:item.id,
          timestamp:item.display_time,
          articleType:item.articleType,
          title:item.title,
          content_short:item.content_short,
          classesLabel:item.classesLabel,
          pageviews:item.pageviews || 0
        })
      })
      res.send({
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

