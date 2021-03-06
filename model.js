var mongoose=require('mongoose');
var userInfoSchema=require('./userInfoSchema');
var articleListSchema=require('./articleListSchema');
var classesListSchema=require('./classesListSchema');
var articleSchema=require('./articleSchema');
var sysSettingSchema=require('./sysSettingSchema');
var messageSchema=require('./messageSchema');
var photosSchema=require('./photosSchema');

var User = mongoose.model('User',userInfoSchema,'info')

// article
var List = mongoose.model('List',articleListSchema,'articleList')
var ClassesList = mongoose.model('ClassesList',classesListSchema,'classesList')
var Article = mongoose.model('Article',articleSchema,'article')
var Message = mongoose.model('Message',messageSchema,'message')

//系统设置 sysInfo
var SysSetting = mongoose.model('SysSetting',sysSettingSchema,'sysSetting')

//相册
var Photos = mongoose.model('Photos',photosSchema,'photos')



module.exports = {
  User:User,
  Article:Article,
  Message:Message,
  SysSetting:SysSetting,
  Photos:Photos,
  List:List,
  ClassesList:ClassesList,
}
