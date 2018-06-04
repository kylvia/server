var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var articleListSchema = new Schema({
  timestamp: Number,
  articleId:String,
  title: String,
  status: String,
  classes: String,
  classesLabel: String,
  display_time: String,
  introduction: String,
  content_short: String,
  articleType: Number,
  pageviews: Number,
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
  findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  }
};
module.exports = articleListSchema

