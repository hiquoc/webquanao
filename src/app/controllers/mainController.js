const db = require("../config/mysql.js");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

class mainController {
  main(req, res) {
    const query = "SELECT * FROM product where status='Còn hàng'";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      // Process each product's images
      results.forEach((product) => {
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        const otherImages = images.filter((img) => img !== mainImage);
        product.mainImage = mainImage;
        product.otherImages = otherImages;
      });
      const hots = [...results].sort((a, b) => b.sold - a.sold).slice(0, 4);
      const ao_thun = results
        .filter((product) => product.category_id === 2)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 4);
      const quan_tay = results
        .filter((product) => product.category_id === 5)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 4);
      const ao_so_mi = results
        .filter((product) => product.category_id === 1)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 4);

      // Example usage or response
      const user = req.cookies.user;
      if (user) {
        res.render("home", {
          hots: hots,
          ao_thun: ao_thun,
          quan_tay: quan_tay,
          ao_so_mi: ao_so_mi,
          user: user ? JSON.parse(user) : null,
        });
      } else {
        res.render("home", {
          hots: hots,
          ao_thun: ao_thun,
          quan_tay: quan_tay,
          ao_so_mi: ao_so_mi,
        });
      }
    });
  }
  category(req, res) {
    const category = req.params.category;
    let type, name;
    switch (category) {
      case "ao-so-mi":
        type = 1;
        name = "Áo sơ mi";
        break;
      case "ao-thun":
        type = 2;
        name = "Áo thun";
        break;
      case "ao-polo":
        type = 3;
        name = "Áo polo";
        break;
      case "ao-khoac":
        type = 4;
        name = "Áo khoác";
        break;
      case "quan-tay":
        type = 5;
        name = "Quần tây";
        break;
      case "quan-kaki":
        type = 6;
        name = "Quần kaki";
        break;
      case "quan-jeans":
        type = 7;
        name = "Quần jeans";
        break;
      case "quan-short":
        type = 8;
        name = "Quần short";
        break;
      default:
        return res.redirect("/");
    }
    const sort = req.query.sort;
    let sql =
      "SELECT * FROM product WHERE category_id=(?) and status='Còn hàng'";

    if (sort === "thap-den-cao") {
      sql += " ORDER BY price ASC"; // Sort low to high
    } else if (sort === "cao-den-thap") {
      sql += " ORDER BY price DESC"; // Sort high to low
    } else if (sort === "moi-nhap") {
      sql += " ORDER BY product_id DESC"; // Sort by newest
    } else if (sort === "mua-nhieu") {
      sql += " ORDER BY sold DESC"; // Sort by newest
    }
    db.query(sql, [type], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      } else {
        results.forEach((product) => {
          const images = product.image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          const otherImages = images.filter((img) => img !== mainImage);
          product.mainImage = mainImage;
          product.otherImages = otherImages;
        });
        const sql2 =
          "SELECT * FROM product where status='Còn hàng' ORDER BY sold DESC LIMIT 4;";
        db.query(sql2, (err, results1) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Server error");
          }
          results1.forEach((product) => {
            const images = product.image.split(",");
            const mainImage =
              images.find((img) => img.includes("main")) || images[0];
            product.mainImage = mainImage;
          });
          const user = req.cookies.user;
          res.render("category", {
            name: name,
            products: results,
            hot: results1,
            user: user ? JSON.parse(user) : null,
          });
        });
      }
    });
  }
  search(req, res) {
    const text = req.query.text;
    const user = req.cookies.user;
    const sql2 =
      "SELECT * FROM product where status='Còn hàng' ORDER BY sold DESC LIMIT 4;";
    db.query(sql2, (err, results1) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      results1.forEach((product) => {
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        product.mainImage = mainImage;
      });
      const sort = req.query.sort;
      let sql =
        "SELECT * FROM product WHERE (name LIKE ? or color LIKE ?) and status='Còn hàng'";
      if (sort === "thap-den-cao") {
        sql += " ORDER BY price ASC"; // Sort low to high
      } else if (sort === "cao-den-thap") {
        sql += " ORDER BY price DESC"; // Sort high to low
      } else if (sort === "moi-nhap") {
        sql += " ORDER BY product_id DESC"; // Sort by newest
      } else if (sort === "mua-nhieu") {
        sql += " ORDER BY sold DESC"; // Sort by newest
      }
      db.query(sql, [`%${text}%`, `%${text}%`], (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (results.length == 0) {
          res.render("search", {
            text: text,
            hot: results1,
            none: "Không có kết quả",
            user: user ? JSON.parse(user) : null,
          });
          return;
        }
        results.forEach((product) => {
          const images = product.image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          const otherImages = images.filter((img) => img !== mainImage);
          product.mainImage = mainImage;
          product.otherImages = otherImages;
        });

        res.render("search", {
          text: text,
          hot: results1,
          products: results,
          user: user ? JSON.parse(user) : null,
        });
      });
    });
  }
  new(req, res) {
    let text = "Sản phẩm";
    const sort = req.query.sort;
    let sql = "SELECT * FROM product where status='Còn hàng'";
    if (sort === "thap-den-cao") {
      sql += " ORDER BY price ASC LIMIT 12"; // Sort low to high
    } else if (sort === "cao-den-thap") {
      sql += " ORDER BY price DESC LIMIT 12"; // Sort high to low
    } else if (sort === "moi-nhat") {
      sql += " ORDER BY product_id DESC LIMIT 12"; // Sort by newest
      text = "Hàng mới về";
    } else if (sort === "mua-nhieu") {
      sql += " ORDER BY sold DESC LIMIT 12"; // Sort by newest
      text = "Hot nhất";
    }

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      } else {
        results.forEach((product) => {
          const images = product.image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          const otherImages = images.filter((img) => img !== mainImage);
          product.mainImage = mainImage;
          product.otherImages = otherImages;
        });
        const sql2 = "SELECT * FROM product ORDER BY sold DESC LIMIT 4;";
        db.query(sql2, (err, results1) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Server error");
          }
          results1.forEach((product) => {
            const images = product.image.split(",");
            const mainImage =
              images.find((img) => img.includes("main")) || images[0];
            product.mainImage = mainImage;
          });
          const user = req.cookies.user;
          res.render("category", {
            products: results,
            hot: results1,
            name: text,
            user: user ? JSON.parse(user) : null,
          });
        });
      }
    });
  }
  guess(req, res) {
    const user = req.cookies.user;
    const sql2 =
      "SELECT * FROM product where status='Còn hàng' ORDER BY sold DESC LIMIT 4;";
    db.query(sql2, (err, results1) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      results1.forEach((product) => {
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        product.mainImage = mainImage;
      });
      res.render("guess", {
        hot: results1,
        user: user ? JSON.parse(user) : null,
      });
    });
  }
  guessPost(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    const text1 = req.body.text;
    const text = text1.replace(/_/g, " ");
    console.log(req.body);

    const user = req.cookies.user;
    const sql2 =
      "SELECT * FROM product where status='Còn hàng' ORDER BY sold DESC LIMIT 4;";
    db.query(sql2, (err, results1) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      results1.forEach((product) => {
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        product.mainImage = mainImage;
      });
      const img = "../up/img.jpg";
      const sort = req.query.sort;
      let sql =
        "SELECT * FROM product WHERE (name LIKE ? or color LIKE ?) and status='Còn hàng'";
      if (sort === "thap-den-cao") {
        sql += " ORDER BY price ASC"; // Sort low to high
      } else if (sort === "cao-den-thap") {
        sql += " ORDER BY price DESC"; // Sort high to low
      } else if (sort === "moi-nhap") {
        sql += " ORDER BY product_id DESC"; // Sort by newest
      } else if (sort === "mua-nhieu") {
        sql += " ORDER BY sold DESC"; // Sort by newest
      }
      db.query(sql, [`%${text}%`, `%${text}%`], (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (results.length == 0) {
          res.render("guessearch", {
            text: text,
            img: img,
            hot: results1,
            none: "Không có kết quả",
            user: user ? JSON.parse(user) : null,
          });
          return;
        }
        results.forEach((product) => {
          const images = product.image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          const otherImages = images.filter((img) => img !== mainImage);
          product.mainImage = mainImage;
          product.otherImages = otherImages;
        });

        res.render("guessearch", {
          text: text,
          img: img,
          hot: results1,
          products: results,
          user: user ? JSON.parse(user) : null,
        });
      });
    });
  }

  async save(req, res) {
    try {
      const { img, type } = req.body;
      if (!img || !type) {
        return res.status(400).json({ message: "Thiếu file hay type" });
      }
      const fileExtension = path.extname(img);
      if (
        ![".jpg", ".jpeg", ".png", ".gif"].includes(fileExtension.toLowerCase())
      ) {
        return res
          .status(400)
          .json({
            message: "File ko đc hỗ trợ.",
          });
      }

      const imageName = Date.now() + fileExtension;

      const folderPath = path.join(__dirname, "../../../save", type);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, imageName);

      const response = await axios({
        method: "get",
        url: img,
        responseType: "stream",
      });

      await pipeline(response.data, fs.createWriteStream(filePath));

      res.json({
        message: "Lưu thành công",
        savedImagePath: filePath,
      });
    } catch (error) {
      console.error("Err:", error);
      res.status(500).json({ message: "Error" });
    }
  }
}
module.exports = new mainController();
