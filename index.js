const express = require( 'express');
//const bodyParser = require('body-parser');
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

//app.use(bodyParser.json());

require('./auth')(app);

//logs into the Terminal
app.use(morgan('common'));

app.use(express.static('public'));

//const uuid = require('uuid');
require('dotenv').config();
app.use(express.json());

//Cors (Cross-Origin Resource Sharing) allow requests from other domains

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
origin: (origin, callback) => {
if(!origin) return callback(null, true);
if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
return callback(new Error(message ), false);
}
return callback(null, true);
}
}));


app.get("/", (req, res) => {
  res.send("Here is a movie list of movies!");
});

//Return the documentation html
app.get('/documentation', (req, res) => {
   res.sendFile('public/documentation.html', {root: __dirname});
});


 //Creates a user with requested data

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



// Creates a Movie with requested data.

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


//Get all movies from database

app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

 
//Get all users

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


// Gets and display users by username

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

// Gets and display of selected movie


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


// Update users by name    

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


//Update movies by Title

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


//Delete users by username

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


//Delete selected movies 

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

//Update favorite movies of users

app.post('/users/:Username/Movies/:movieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavMovies: req.params.MovieID }
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


  /*

  
//From this GET you can get all animation movies.
app.get('/animationMovies', (req, res) => {
   res.json(animationMovies);
  });

//Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by TITLE to the user
app.get('/animationMovies/:title', (req, res) => {
  res.json(animationMovies.find((animatedMovie) =>
    { return animatedMovie.title === req.params.title }));
  });

//Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie by DIRECTOR to the user
app.get('/animationMovies/director/:director', (req, res) => {
  res.json(animationMovies.filter((animatedMovie) =>
    { return animatedMovie.director === req.params.director }));
  });

//adds new movie to the list
  app.post('/addAnimationMovie', (req, res) => {
    let newMovie = req.body;
  
    if (!newMovie.title) {
      const message = 'Missing name in request body';
      res.status(400).send(message);
    } else {
      newMovie.name = uuid.v4();
      animationMovies.push(newMovie);
      res.status(201).send(newMovie);
    }
  });
  

// Creates users for movie catalog
app.post('/newMovieUsers', (req, res) => {
    let newUser = req.body;
  
    if (!newUser.name) {
      const message = 'Missing name in request body';
      res.status(400).send(message);
    } else {
      newUser.name = uuid.v4();
      movieUsers.push(newUser);
      res.status(201).send(newUser);
    }
  });

//allow edit data; usernames
app.put('/movieUsers/:username', (req, res) => {
    let user = movieUsers.find((user) => { return user.username === req.params.username });
    let newUserName = req.body.username;
    if (user) {
      user.username = newUserName;
      res.status(201).send(user);
    } else {
      res.status(404).send('Student with the name ' + req.params.name + ' was not found.');
    }
  });
*/