const express = require( 'express');
const bodyParser = require('body-parser');
const morgan = require ( 'morgan' );
const mongoose = require('mongoose');
const Models = require('./models'); //Brings the models or templates from the js file
const passport = require('passport');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

require('./passport');

// call the models from model.js 
const Movies = Models.Movies;
const Users = Models.Users;

//mongoose.connect('mongodb://localhost:27017/myMoviesDB', { useNewUrlParser: true, useUnifiedTopology: true });
//mongoose.connect('mongodb+srv://mymovie_database:cz6JInSOerzkTSLp@movie-api.04s6s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(morgan('common'));

app.use(cors());

app.use(bodyParser.json());

require('./auth')(app);

//logs into the Terminal
app.use(morgan('common'));

app.use(express.static('public'));

//const uuid = require('uuid');
require('dotenv').config();
app.use(express.json());

//Cors (Cross-Origin Resource Sharing) allow requests from other domains

// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', http://localhost:1" 'https://my-flix-app-movies.netlify.app'];

/**
 * This function/method call the first html page, a welcome page
 */
app.get("/", (req, res) => {
  res.send("Here is a movie list of movies!");
});


//Return the documentation html
app.get('/documentation', (req, res) => {
   res.sendFile('public/documentation.html', {root: __dirname});
});


/**Creates a user with requested data
  * This function creates a new user inside de app
  * doesnt require an Authentication
  * @method addUser
  * @param {string} username endpoint https://movie-api-1.herokuapp.com/users
  * @param {string} username validates the input using express-package
  * @param {string} password creates a password through the input
  * @param {string} email get the email of the user.
  */
app.post('/users', 
[
  //These are characteristics that a password must have. Or this must me hashed.
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], (req, res) => { 
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword, //here you call the hashed password
            Email: req.body.Email,
            Birthday: req.body.Birthday,
            FavMovie: [req.body.FavMovie]
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});



/**
 * Creates a Movie with requested data.
 * @param {func} passportAuthetication using a webtoken
 * @param {Return} if movie already exists in database will not do anything if it doesn't will create some data about it.
 */

app.post('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.body.Title })
    .then((movie) => {
      if (movie) {
        return res.status(400).send(req.body.Title + 'already exists');
      } else {
        Movies
          .create({
            Title: req.body.Title,
            Description: req.body.Description,
            Genre: {
                Name: req.body.Name,
                Description: req.body.Description
            },    
            Director: {
            Name: req.body.Name,
            Bio: req.body.Bio
            },
            ImagePath:req.body.ImagePath,
            featured: req.body.featured
        })
          .then((movie) =>{res.status(201).json(movie) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


/**
 * makes a call to get all movies from DB
 * @param {string} get movies from endpoint https://movie-api-1.herokuapp.com/movies
 * @param {func} passportAuthetication is required to call movies with web token.
 * @param {func} uses "find" to find movies the movie list
 * @param {array} returns lists of movies.
 */

//Get all movies from database  

app.get("/movies", passport.authenticate('jwt', { session: false }), function (req, res) {
  Movies.find()
    .then(function (movies) {
      res.status(201).json(movies);
    })
    .catch(function (error) {
      console.error(error);
      res.status(500).send("Error: " + error);
    });
});

 

/**
 *  Gets all users
 * @param {string} get users from endpoint https://movie-api-1.herokuapp.com/users
 * @param {func} passportAuthetication is required to call movies with web token.
 * @param {func} uses "find" to find movies the users list
 * @param {array} returns lists of users.
 */

app.get('/users', passport.authenticate('jwt', { session: false }),  (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
 *  Gets an specific user from the list
 * @param {string} get users from endpoint https://movie-api-1.herokuapp.com/users/:username
 * @param {func} passportAuthetication is required to call movies with web token.
 * @param {func} uses "find" to find user the users list
 * @param {array} returns lists of users.
 */

app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 *  Gets an specific movie from the list
 * @param {string} get users from endpoint https://movie-api-1.herokuapp.com/Movies/:Title
 * @param {func} passportAuthetication is required to call movies with web token.
 * @param {func} uses "find" to find movies the users list
 * @param {array} returns lists of users.
 */

app.get('/Movies/:Title', passport.authenticate('jwt', { session: false }),  (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
* Update a users info by username.
* @method updateUser
* @param {string} userNameEndpoint - https://movie-api-1.herokuapp.com/users/:Username
* @param {Array} passportAuthetication is required to call movies with web token
* @param {func} update user with new input data
 */

app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true },
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});


/**
* Update a movies by Title.
* @method updateMovie
* @param {string} userNameEndpoint - https://movie-api-1.herokuapp.com/Movies/:Title
* @param {Array} passportAuthetication is required to call movies with web token
* @param {func} update movie with new input data
 */

app.put('/Movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOneAndUpdate({ Title: req.params.Title }, { $set:
    {
      Title: req.body.Title,
      Description: req.body.Description,
      Genre: {
          Name: req.body.Name,
          Description: req.body.Description
      },    
      Director: {
      Name: req.body.Name,
      Bio: req.body.Bio
      },
      ImagePath:req.body.ImagePath,
      featured: req.body.featured
    }
  },
  { new: true },
  (err, updatedMovie) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedMovie);
    }
  });
});


/**
  * Function to remove user from the list
  * @function deleteuser
  * @param {string} userNameMoviesEndpoint - https://movie-api-1.herokuapp.com/users/:username
  * @param {Array} passportAuthetication is required to call movies with web token.
  * @param {func} user removed.
   */

app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
  * Function to remove user from the list
  * @function deletemovie
  * @param {string} userNameMoviesEndpoint - https://movie-api-1.herokuapp.com/Movies/:tittle
  * @param {Array} passportAuthetication is required to call movies with web token.
  * @param {func} movie removed.
   */

app.delete('/Movies/:Title', passport.authenticate('jwt', { session: false }),  (req, res) => {
  Movies.findOneAndRemove({ Title: req.params.Title })
    .then((movie) => {
      if (!movie) {
        res.status(400).send(req.params.Title + ' was not found');
      } else {
        res.status(200).send(req.params.Title + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
* Function to add movie to favorite list of user
* @function addToFavorites
* @param {string} userNameMoviesEndpoint - https://movie-api-1.herokuapp.com/users/:username/favorites/:MovieID
* @param {Array} passportAuthetication is required to call movies with web token.
* @param {func} movie is addded to user favorites.
 */

app.patch('/users/:Username/favorites/:movieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $addToSet: { FavMovies: req.params.movieID }
   },
   { new: true }, 
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

/**
* Function to remove movie from favorite list of user
* @function removefromFavorites
* @param {string} userNameMoviesEndpoint - https://movie-api-1.herokuapp.com/users/:username/favorites/:MovieID
* @param {Array} passportAuthetication is required to call movies with web token.
* @param {func} movie is removed to user favorites.
 */

app.delete('/users/:Username/favorites/:movieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $pull: { FavMovies: req.params.movieID }
   },
   { new: true }, 
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
    res.status(500).send('Something wrong!');
  });


  const port = process.env.PORT || 8080;
  app.listen(port, '0.0.0.0',() => {
   console.log('Listening on Port ' + port);
  });