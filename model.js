var mongoose=require('mongoose');
var userInfoSchema=require('./userInfoSchema');
var articleListSchema=require('./articleListSchema');
var classesListSchema=require('./classesListSchema');
var articleSchema=require('./articleSchema');
var sysSettingSchema=require('./sysSettingSchema');
var messageSchema=require('./messageSchema');

var User = mongoose.model('User',userInfoSchema,'info')

// article
var List = mongoose.model('List',articleListSchema,'articleList')
var ClassesList = mongoose.model('ClassesList',classesListSchema,'classesList')
var Article = mongoose.model('Article',articleSchema,'article')
var Message = mongoose.model('Message',messageSchema,'message')

//系统设置 sysInfo
var SysSetting = mongoose.model('SysSetting',sysSettingSchema,'sysSetting')


module.exports = {
  User:User,
  Article:Article,
  Message:Message,
  SysSetting:SysSetting,
  List:List,
  ClassesList:ClassesList,
}
/*
var User = require('./schema')
var assert = require("assert");

var loginUser = new User({
  name:'kylvia1',
  pwd:'125788'
})

/!*loginUser.save(function (err) {
  assert.equal(null,err);
  console.log('User saved successfully!')
})*!/

User.find({},function (err,users) {
  assert.equal(null,err);
  console.log(users);
    // users.close()
})*/
