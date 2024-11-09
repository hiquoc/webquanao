const db = require("../config/mysql.js");

class productController {
  main(req, res) {
    const id = req.params.id;
    const query = "SELECT * FROM product WHERE product_id = ? and status ='Còn hàng'";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }

      if (results.length === 0) {
        return res.redirect("/");
      }

      const product = results[0];
      const images = product.image.split(",");
      const mainImage = images.find((img) => img.includes("main")) || images[0];
      const otherImages = images.filter((img) => img !== mainImage);
      product.mainImage = mainImage;
      product.otherImages = otherImages;

      const colors = product.color.split(",");
      product.color = colors;
      const query1 =
        "SELECT * FROM product WHERE category_id = ? and product_id!= ? and status ='Còn hàng' ORDER BY sold";
      db.query(query1, [product.category_id, id], (err, results1) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        results1.forEach((product) => {
          const images = product.image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          const otherImages = images.filter((img) => img !== mainImage);
          product.mainImage = mainImage;
          product.otherImages = otherImages;
        });
        const user = req.cookies.user;
        if (user) {
          res.render("product", {
            product: product,
            similiar: results1,
            user: user ? JSON.parse(user) : null,
          });
        } else {
          res.render("product", { product: product, similiar: results1 });
        }
      });
    });
  }

  order(req, res) {
    let { type, product, price, size, color, quantity } = req.body;
    price = price * quantity;
    color = color.trim();
    quantity = quantity.trim();
    const user = req.cookies.user;
    if (!user) {
      res.redirect("/account/login");
    }
    if (type == "them") {
      const id = JSON.parse(req.cookies.user).id;
      const query =
        "INSERT INTO cart (product_id, account_id, price,size, color, number) VALUES (?, ?, ?, ?, ?, ?)";
      db.query(
        query,
        [product, id, price, size, color, quantity],
        (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Server error");
          }
          res.redirect("/account/cart");
        }
      );
    } else {
      const id = JSON.parse(req.cookies.user).id;
      const deleteQuery = "DELETE FROM cart WHERE account_id = ? and status=?";
      db.query(deleteQuery, [id, "đang xử lý"], (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        const query =
          "INSERT INTO cart (product_id, account_id, price,size, color, number,status) VALUES (?, ?, ?, ?, ?, ?,?)";
        db.query(
          query,
          [product, id, price, size, color, quantity, "đang xử lý"],
          (err, results) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Server error");
            }
            res.redirect("/account/buynow");
          }
        );
      });
    }
  }
}

module.exports = new productController();
