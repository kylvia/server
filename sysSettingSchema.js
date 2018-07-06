var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var sysSettingSchema = new Schema({
  name:{type: String, required: true, unique: true},
  sysName:{type: String, required: true, unique: true},
  motto:String,
  aboutMe:String,
  avatar:String,
  createAt:Date,
  updateAt:Date
})

sysSettingSchema.pre('save',function (next) {
  var currentDate = (new Date())-0;
  this.updateAt = currentDate;
  if(!this.createAt){
    this.createAt = currentDate
  }
  next()
})
sysSettingSchema.statics={
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
module.exports = sysSettingSchema

