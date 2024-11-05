const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql2");

const app = express();

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "web",
});
// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder to store uploaded images
  },
  filename: (req, file, cb) => {
    // Use a flag to check if the file is the first uploaded
    if (!req.firstFileProcessed) {
      req.firstFileProcessed = true; // Set the flag to true after processing the first file
      cb(null, "main-" + Date.now() + "-" + file.originalname); // Rename the first uploaded file to 'main'
    } else {
      cb(null, Date.now() + "-" + file.originalname); // Default naming for other files
    }
  },
});
const upload = multer({ storage });

// Handle form submissions to /upload
app.post("/upload", upload.array("product-images"), (req, res) => {
  req.firstFileProcessed = false;
  const { ten, price, danhmuc, color, details } = req.body;
  const colors = Array.isArray(color) ? color.join(",") : color;
  const imagePaths = req.files.map((file) => file.path).join(",");

  const sql =
    "INSERT INTO product (name, image, description, price, color, category_id) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(sql, [ten, imagePaths, details, 100, colors, 1], (err) => {
    if (err) {
      console.error("Database error:", err); // Log the error details
      console.log("ten:", ten);
      console.log("imagePaths:", imagePaths);
      console.log("details:", details);
      console.log("price:", 100);
      console.log("colors:", colors);
      console.log("category_id:", 1);
      return res.status(500).send(`Database error: ${err.message}`); // Send error message to client for debugging
    }
    res.status(200).send("Product uploaded successfully!");
  });
});

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// ----------------//
// add view template engine
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "resources\\views"));
// ----------------//
app.use(express.static(path.join(__dirname, "public")));

const route = require("./routes/main");
route(app);

const port = 8080;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
