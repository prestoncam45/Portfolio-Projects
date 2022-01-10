const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const Joi = require('joi');
const { activitySchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Activity = require('./models/todolist');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

mongoose.connect('mongodb://localhost:27017/todolist', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const validateActivity = (req, res, next) => {
    const { error } = activitySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    next();
}

const isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    if (!activity.author.equals(req.user._id)) {
        req.flash('error', 'You did not create this activity!');
        return res.redirect('/todolist');
    }
    next();
}


app.get('/todolist', isLoggedIn, catchAsync(async (req, res) => {
    const activity = await Activity.findById(req.params.id).populate('author');
    const activities = await Activity.find({});
    res.render('activities/index', { activities })
}));
app.get('/todolist/new', isLoggedIn, (req, res) => {
    res.render('activities/new');
});

app.post('/todolist', isLoggedIn, validateActivity, catchAsync(async (req, res) => {
    const activity = new Activity(req.body);
    activity.author = req.user._id;
    await activity.save();
    req.flash('success', 'Successfully made a new activity!')
    res.redirect(`/todolist/`)
}))

app.get('/todolist/:id', isLoggedIn, isAuthor, catchAsync(async (req, res,) => {
    const activity = await Activity.findById(req.params.id).populate('author');
    if (!activity) {
        req.flash('error', 'Cannot find that activity!');
        return res.redirect('/todolist');
    }
    res.render('activities/show', { activity })
}));

app.get('/todolist/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const activity = await Activity.findById(req.params.id).populate('author');
    if (!activity) {
        req.flash('error', 'Cannot find that activity!');
        return res.redirect('/todolist');
    }
    res.render('activities/edit', { activity })
}));

app.put('/todolist/:id', isLoggedIn, isAuthor, validateActivity, catchAsync(async (req, res) => {
    const { id } = req.params;
    const act = await Activity.findByIdAndUpdate(id, { ...req.body })
    req.flash('success', 'Successfully updated activity!')
    res.redirect(`/todolist`)
}));

app.delete('/todolist/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Activity.findByIdAndDelete(id);
    req.flash('success', 'You completed the activity!')
    res.redirect('/todolist');
}));

app.get('/register', (req, res) => {
    res.render('users/register');
});

app.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to your To Do List!');
            res.redirect('/todolist');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}));

app.get('/login', (req, res) => {
    res.render('users/login');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/todolist'
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged out!')
    res.redirect('/login');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
});




app.listen(3000, () => {
    console.log('Serving on port 3000')
})