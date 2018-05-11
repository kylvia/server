var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var userInfoSchema = new Schema({
  name:{type: String, required: true, unique: true},
  pwd:String,
  email:String,
  birthday:String,
  sex:String,
  roles:Array,
  introduction:String,
  avatar:String,
  createAt:Date,
  updateAt:Date,
  token:Number
})

userInfoSchema.pre('save',function (next) {
  var currentDate = (new Date())-0;
  this.updateAt = currentDate;
  if(!this.createAt){
    this.createAt = currentDate
  }
  next()
})
userInfoSchema.statics={
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
module.exports = userInfoSchema

