const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorite');
const authenticate = require('../authenticate');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.get(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: {_id: req.user._id} })
    .populate(['user', 'dishes'])
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: {_id: req.user._id} })
    .then((favorite) => {
        if (favorite == null) {
            Favorites.create({ "user": req.user._id, "dishes" : req.body })
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
        } else {
            req.body.forEach(dish => {
                if (favorite.dishes.indexOf(dish._id) < 0) {
                    favorite.dishes.push(dish._id);
                }
            });

            favorite.save()
            .then(favo => {
                console.log('Dishes added to favorite ', favo);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favo);
            }, (err) => next(err))
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.deleteMany({ user: {_id: req.user._id} })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
 .post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: {_id: req.user._id} })
    .then(favorite => {
        const dishId = req.params.dishId;
        if (favorite == null) {
            Favorites.create({ user: req.user._id, dishes: [{ _id: dishId}]})
            .then((favorite) => {
                console.log('Favorite created', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
        } else {
            if (favorite.dishes && favorite.dishes.find(dish => dish._id == dishId)) {
                err = new Error(`Dish ${dishId} is already in the favorite list`);
                err.status = 404;
                return next(err);
            }

            favorite.dishes.push({ _id: dishId});
            favorite.save()
            .then(favo => {
                console.log('Dish added to favorite ', favo);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favo);
            }, (err) => next(err))
        }
    })
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: {_id: req.user._id} })
    .then(favorite => {
        const dishId = req.params.dishId;
        if (favorite == null) {
            err = new Error(`No favorites found`);
            err.status = 404;
            return next(err);
        }
        if (favorite.dishes.find(dish => dish._id == dishId) == null) {
            err = new Error(`Dish ${dishId} not found on favorites`);
            err.status = 404;
            return next(err);
        }
        favorite.dishes = favorite.dishes.filter(dish => dish._id != dishId)
        if (favorite.dishes.length == 0) {
            favorite.remove()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);  
            }, (err) => next(err))
        } else {
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .then((favo) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favo);  
                })     
            }, (err) => next(err))
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;