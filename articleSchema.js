var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var articleSchema = new Schema({
  classes: String, //分类 0、1
  classesLabel: String, //分类名字 前端、ios..
  comment_disabled: Boolean, //开启评论
  content: String, //正文
  content_short: String, //摘要
  display_time: Number, //发布时间
  pageviews: Number, //浏览量
  image_uri: String, //图片链接
  articleType: Number, //文章类型 原创、转载
  status: String, //发布状态  发布、草稿
  title: String, //标题
  createAt:Date,
  updateAt:Date
})

articleSchema.pre('save',function (next) {
  var currentDate = (new Date())-0;
  this.updateAt = currentDate;
  if(!this.createAt){
    this.createAt = currentDate
  }
  next()
})
articleSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .sort('meta.updateAt')
      .exec(cb);
  },
  findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  }
};
module.exports = articleSchema

