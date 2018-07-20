var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var articleListSchema = new Schema({
  articleId:{
    type: mongoose.Schema.ObjectId,
    ref: 'Article'
  },
  title: String, //标题
  status: String, //发布状态  发布、草稿
  classes: String, //分类 0、1
  classesLabel: String, //分类名字 前端、ios..
  display_time: String, //发布时间
  image_uri: String, //图片链接
  content_short: String, //摘要
  articleType: Number, //文章类型 原创、转载
  pageviews: Number, //浏览量
  createAt:Date,
  updateAt:Date
})

articleListSchema.pre('save',function (next) {
  var currentDate = (new Date()) - 0;
  this.updateAt = currentDate;
  if(!this.createAt){
    this.createAt = currentDate
  }
  next()
})
articleListSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .sort('meta.updateAt')
      .exec(cb);
  },
  /*findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  },*/
  findDetail:function (id,cb) {
    return this
      .findOne({_id:id}).populate('articleId')  //关联查询
      .exec(cb);
  }
};
module.exports = articleListSchema

