var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var articleSchema = new Schema({
  classes: String,
  classesLabel: String,
  source_name: String,
  comment_disabled: Boolean,
  content: String,
  content_short: String,
  display_time: Number,
  image_uri: String,
  articleType: Number,
  status: String,
  tags: Array,
  title: String,
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

