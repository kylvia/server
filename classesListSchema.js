var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var classesListSchema = new Schema({
  name:String,
  id:String
})

classesListSchema.statics={
  fetch:function (cb) {
    return this
      .find({})
      .exec(cb);
  },
  findById:function (id,cb) {
    return this
      .findOne({_id:id})
      .exec(cb);
  }
};
module.exports = classesListSchema

