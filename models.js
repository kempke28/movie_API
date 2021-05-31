const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

//schema or templates for different lists.

let moviesSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },    
    Director: {
    Name: String,
    Bio: String
    },
    ImagePath: String,
    featured: Boolean
});


//Schema or template for users

let usersSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    FavMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};
  
userSchema.methods.validatePassword = function(password) {
return bcrypt.compareSync(password, this.Password);
};

let Movies = mongoose.model('Movies', moviesSchema);
let Users = mongoose.model('Users', usersSchema);

module.exports.Movies = Movies;
module.exports.Users = Users;