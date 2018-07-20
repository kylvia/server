var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var photosSchema = new Schema({
  src:String,
  createAt:Date,
  updateAt:Date
})

photosSchema.pre('save',function (next) {
  var currentDate = (new Date())-0;
  this.updateAt = currentDate;
  if(!this.createAt){
    this.createAt = currentDate
  }
  next()
})
photosSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .sort({'updateAt':-1})
      .exec(cb);
  },
  findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  },
  deleteById:function (id,cb) {
    return this
      .remove({_id:id})
      .exec(cb);
  }
};
module.exports = photosSchema
