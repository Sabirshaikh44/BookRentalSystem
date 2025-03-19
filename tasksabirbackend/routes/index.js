// routes/index.js
const express = require('express');
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require('../mongooseSchema/user'),
      Rental = require('../mongooseSchema/rentals'),
       Book = require('../mongooseSchema/book');

const authenticateMiddleware = require("../middleware/authenticate");

const formatDate = require("../helpers/dateHelper")

const mongoose= require("mongoose")

// Get all users
router.get('/getUsers',authenticateMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    if(users.length > 0){

      res.json(users);
    }else{
      res.json({message : "users not found"})
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new user
router.post('/createUser', async (req, res) => {

  const userExists = await User.findOne({username : req.body.username});
  try {

    if(userExists == null){
      const user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      const newUser = await user.save();
      res.status(201).json(newUser);
    }else{
      res.status(403).json({ message: "user exists pls login to continue..." });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//login user
router.post('/login', async (req, res) => {
  try {
    // Find user by username
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please register." });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = user.password == req.body.password ? true : false;

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials. Please try again." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,  // Secret key for JWT signing (store in .env)
      { expiresIn: '1h' }
    );

    // Send the token as response
    res.status(200).json({
      message: "Login successful",
      token: token,  // The token can be used for subsequent requests
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all books
router.get('/books',authenticateMiddleware, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// add books
router.post('/add-books',authenticateMiddleware, async (req, res) => {
  // res.json(req.body);

  const book =  await Book.findOne({bookId :  req.body.bookId});
  try {
    if(!book) {
      const book = new Book({
        title: req.body.title,
        bookId: req.body.bookId,
        author: req.body.author,
        genre: req.body.genre,
        pricePerDay : req.body.pricePerDay
      });
      const newBook = await book.save();
      res.status(201).json({message : "new book added successfully",
        newBook});
    }else{
      res.status(403).json({message : "book already exists with this BookId"});
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific book by ID
router.get('/books/:id',authenticateMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({bookId : req.params.id});
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific book by ID
router.post('/book/update/:id',authenticateMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({bookId : req.params.id});
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }else{
      book.title= req.body.title;
      book.author= req.body.author;
      book.genre= req.body.genre;
      book.pricePerDay = req.body.pricePerDay;
      book.save();
      res.json(book);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific book by ID
router.post('/book/delete/:id',authenticateMiddleware, async (req, res) => {
  try {
    const book = await Book.findOne({bookId : req.params.id});
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }else{
      await book.deleteOne({bookId : req.params.id});
      res.json({
        message : "book deleted sucessfully",
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rent a book
router.post('/rent',authenticateMiddleware, async (req, res) => {
  const { bookId, rentedBy } = req.body;
  const returnDate = req.body.returnDate ? formatDate(req.body.returnDate) : new Date();
  const rentalDate = req.body.rentalDate ? formatDate(req.body.rentalDate) : new Date();

  try {
    const book = await Book.findOne({ bookId: bookId });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No available copies for rental' });
    }

    const rentalDays = Math.ceil((returnDate - rentalDate) / (1000 * 3600 * 24)); 

    if (rentalDays <= 0) {
      return res.status(400).json({ message: 'Return date must be after the rental date' });
    }

    // Calculate the total price based on rental days
    const totalPrice = rentalDays * book.pricePerDay;

    const rental = new Rental({
      book: bookId,
      rentedBy,
      rentalDate,
      returnDate,
      totalPrice,
    });

    book.availableCopies -= 1;
    await book.save();

    const newRental = await rental.save();

    res.status(201).json({
      rental: newRental,
      rentalDays,
      totalPrice,
      returnDate: returnDate, 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return a rented book
router.post('/return/:rentalId',authenticateMiddleware, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.rentalId).populate('book');
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (rental.status === 'returned') {
      return res.status(400).json({ message: 'This book has already been returned' });
    }

    // Update rental status to 'returned'
    rental.status = 'returned';
    await rental.save();

    // Increase the available copies of the book
    rental.book.availableCopies += 1;
    await rental.book.save();

    res.json({ message: 'Book returned successfully', rental });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all rentals (for administrative purposes)
router.get('/rentals',authenticateMiddleware, async (req, res) => {
  try {
    const rentals = await Rental.find().populate('book');
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
