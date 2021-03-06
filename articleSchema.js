var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var articleSchema = new Schema({
  content: String, //正文
  messageId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
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
  /*findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  },*/
  findMessages:function (id,cb) {
    return this
      .findOne({_id:id}).populate('messageId')  //关联查询
      .exec(cb);
  }
};
module.exports = articleSchema

