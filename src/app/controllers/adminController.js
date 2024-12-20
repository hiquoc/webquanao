const db = require("../config/mysql.js");
const fs = require("fs");
const path = require("path");
// const upload = require("../config/multer.js");

class adminController {
  main(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    const sort = req.query.sort;
    let query = "SELECT * FROM product";

    if (sort === "thap-den-cao") {
      query += " ORDER BY price ASC LIMIT 20"; // Sort low to high
    } else if (sort === "cao-den-thap") {
      query += " ORDER BY price DESC LIMIT 20"; // Sort high to low
    } else if (sort === "moi-nhap") {
      query += " ORDER BY product_id DESC LIMIT 20"; // Sort by newest
    } else if (sort === "mua-nhieu") {
      query += " ORDER BY sold DESC LIMIT 20"; // Sort by newest
    } else {
      query += " ORDER BY product_id DESC LIMIT 20";
    }

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }

      if (results.length === 0) {
        res.render("admin/main");
      }

      // Process each product's images
      results.forEach((product) => {
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        const otherImages = images.filter((img) => img !== mainImage);
        // Add the mainImage and otherImages to each product object
        product.mainImage = mainImage;
        product.otherImages = otherImages;
      });

      // Pass the products array to Handlebars for rendering
      res.render("admin/main", {
        products: results,
        user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
      });
    });
  }
  status(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    let { status, id } = req.body;
    status = status === "het-hang" ? "Hết hàng" : "Còn hàng";
    const query = "UPDATE product SET status= ? WHERE product_id = ?";
    db.query(query, [status, id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      } else {
        res.redirect("/admin");
      }
    });
  }
  editpage(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    const id = req.params.id;
    const query = "SELECT * FROM product WHERE product_id = ?";
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }

      if (results.length === 0) {
        return res.status(404).send("Product not found");
      }

      const product = results[0];
      const images = product.image.split(",");
      const mainImage = images.find((img) => img.includes("main")) || images[0];
      const otherImages = images.filter((img) => img !== mainImage);
      product.mainImage = mainImage;
      product.otherImages = otherImages;

      const colors = product.color.split(",");
      product.color = colors; // This will be passed to the template
      const query = "SELECT * FROM category order by category_id asc";
      db.query(query, (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        res.render("admin/edit", {
          product: product,
          category: results,
          user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
        });
      });
    });
  }
  editPost(req, res) {
    req.firstFileProcessed = false;
    const { id, ten, price, danhmuc, color, details } = req.body;
    const parsedPrice = parseInt(price, 10);
    const parsedDanhmuc = parseInt(danhmuc, 10);
    const colors = Array.isArray(color) ? color.join(",") : color;
    const imagePaths = req.files.map((file) => file.path).join(",");

    const getImageSql = `SELECT image FROM product WHERE product_id = ?`;
    db.query(getImageSql, [id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Database error.");
      }

      if (results.length > 0) {
        const imagedelete = results[0].image;
        const sql = `
      UPDATE product 
      SET name = ?, image = ?, description = ?, price = ?, color = ?, category_id = ? 
      WHERE product_id = ?`;
        db.query(
          sql,
          [ten, imagePaths, details, parsedPrice, colors, parsedDanhmuc, id],
          (err) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).send("Database error.");
            }
          }
        );
        // 3. Delete the images
        if (imagedelete) {
          const imagedeletes = imagedelete.split(",");
          imagedeletes.forEach((image) => {
            const cleanImagePath = image.trim().replace(/^uploads\//, "");
            const fullImagePath = path.join(
              __dirname,
              "..",
              "..",
              "..",
              cleanImagePath
            );

            // Delete the file
            fs.unlink(fullImagePath, (err) => {
              if (err) {
                console.error("Error deleting image file:", err);
              } else {
                console.log("Image file deleted:", fullImagePath);
              }
            });
          });
        }

        res.redirect("/admin");
      }
    });
  }
  edit1Post(req, res) {
    req.firstFileProcessed = false;
    const { id, ten, price, danhmuc, color, details } = req.body;
    const parsedPrice = parseInt(price, 10);
    const parsedDanhmuc = parseInt(danhmuc, 10);
    const colors = Array.isArray(color) ? color.join(",") : color;
    const sql = `
      UPDATE product 
      SET name = ?,  description = ?, price = ?, color = ?, category_id = ? WHERE product_id = ?`;
    db.query(
      sql,
      [ten, details, parsedPrice, colors, parsedDanhmuc, id],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).send("Database error.");
        }
        res.redirect("/admin");
      }
    );
  }
  deletePost(req, res) {
    const id = req.body.id;

    // 1. Retrieve the image path from the database
    const getImageSql = `SELECT image FROM product WHERE product_id = ?`;
    db.query(getImageSql, [id], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).send("Database error.");
      }

      if (results.length > 0) {
        const imagePath = results[0].image;

        // 2. Delete the product from the database
        const deleteSql = `DELETE FROM product WHERE product_id = ?`;
        db.query(deleteSql, [id], (err) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Database error.");
          }

          // 3. Delete the images
          if (imagePath) {
            const imagePaths = imagePath.split(",");
            imagePaths.forEach((image) => {
              const cleanImagePath = image.trim().replace(/^uploads\//, "");
              const fullImagePath = path.join(
                __dirname,
                "..",
                "..",
                "..",
                cleanImagePath
              );

              // Delete the file
              fs.unlink(fullImagePath, (err) => {
                if (err) {
                  console.error("Error deleting image file:", err);
                } else {
                  console.log("Image file deleted:", fullImagePath);
                }
              });
            });
          }

          res.redirect("/admin");
        });
      } else {
        console.error("Product not found");
        res.status(404).send("Product not found.");
      }
    });
  }

  upload(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    const query = "SELECT * FROM category";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.render("admin/upload", {
        category: results,
        user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
      });
    });
  }

  uploadPost(req, res) {
    req.firstFileProcessed = false;
    const { ten, price, danhmuc, color, details } = req.body;
    const parsedPrice = parseInt(price, 10);
    const parsedDanhmuc = parseInt(danhmuc, 10);
    const colors = Array.isArray(color) ? color.join(",") : color;
    const imagePaths = req.files.map((file) => file.path).join(",");

    const sql =
      "INSERT INTO product (name, image, description, price, color, category_id) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(
      sql,
      [ten, imagePaths, details, parsedPrice, colors, parsedDanhmuc],
      (err) => {
        if (err) {
          console.error("Database error:", err); // Log the error for debugging
          return res.status(500).send("Database error.");
        }
        res.redirect("/admin");
      }
    );
  }
  account(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    if (req.query.tentaikhoan != null) {
      const sql = `SELECT account.*, address.address_id, address.tinh, address.quan, address.phuong, address.nha, address.ghichu 
                  FROM account
                  LEFT JOIN address ON account.account_id = address.account_id
                  WHERE account.username LIKE ?
                  `;
      db.query(sql, [`%${req.query.tentaikhoan}%`], (err, results) => {
        if (results.length === 0) {
          res.render("admin/account", {
            user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
            note: "Không tìm thấy tài khoản!",
          });
        } else {
          res.render("admin/account", {
            user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
            accounts: results,
          });
        }
      });
    } else {
      const sql = `SELECT account.*, address.address_id, address.tinh, address.quan, address.phuong, address.nha, address.ghichu 
                  FROM account
                  LEFT JOIN address ON account.account_id = address.account_id;
                  `;
      db.query(sql, (err, results) => {
        if (err) {
          console.error("Database error:", err); // Log the error for debugging
          return res.status(500).send("Database error." + err);
        }
        res.render("admin/account", {
          user: req.cookies.user ? JSON.parse(req.cookies.user) : null,
          accounts: results,
        });
      });
    }
  }
  xoaaccount(req, res) {
    const id = req.body.id;
    const sql = "DELETE from account where account_id=?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database error:", err); // Log the error for debugging
        return res.status(500).send("Database error.");
      }
      res.redirect("/admin/tai-khoan");
    });
  }
  role(req, res) {
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    }
    let { role, id } = req.body;
    role = role === "user" ? "user" : "admin";
    const query = "UPDATE account SET role= ? WHERE account_id = ?";
    db.query(query, [role, id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      } else {
        res.redirect("/admin/tai-khoan");
      }
    });
  }
  search(req, res) {
    const text = req.query.tensanpham;
    const user = req.cookies.user;
    const sort = req.query.sort;
    let sql = "SELECT * FROM product WHERE name LIKE ?";
    if (sort === "thap-den-cao") {
      sql += " ORDER BY price ASC LIMIT 20"; // Sort low to high
    } else if (sort === "cao-den-thap") {
      sql += " ORDER BY price DESC LIMIT 20"; // Sort high to low
    } else if (sort === "moi-nhap") {
      sql += " ORDER BY product_id DESC LIMIT 20"; // Sort by newest
    } else if (sort === "mua-nhieu") {
      sql += " ORDER BY sold DESC LIMIT 20"; // Sort by newest
    }
    db.query(sql, [`%${text}%`], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      if (results.length == 0) {
        res.render("admin/search", {
          text: text,
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

      res.render("admin/search", {
        text: text,
        products: results,
        user: user ? JSON.parse(user) : null,
      });
    });
  }
  order(req, res) {
    const user = req.cookies.user;
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    } else {
      const id = req.params.id;
      let sql = `SELECT cart.*, product.name AS product_name, product.image AS product_image, 
          account.*, address.address_id, address.tinh, address.quan, address.phuong, address.nha, address.ghichu 
          FROM cart
          JOIN product ON cart.product_id = product.product_id
          JOIN account ON cart.account_id = account.account_id
          LEFT JOIN address ON account.account_id = address.account_id
          WHERE cart.account_id = ?
          `;
      const sort = req.query.sort;
      if (sort === "dang-giao") {
        sql += " AND cart.status = 'đang giao hàng' ORDER BY cart.date DESC";
      } else if (sort === "da-giao") {
        sql += " AND cart.status = 'đã giao' ORDER BY cart.date DESC";
      } else {
        sql +=
          " AND (cart.status = 'đang giao hàng' OR cart.status = 'đã giao') ORDER BY cart.date DESC";
      }
      db.query(sql, [id], (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (results.length == 0) {
          res.render(`admin/order`, {
            note: "Lịch sử đơn hàng trống!",
            user: user ? JSON.parse(user) : null,
          });
          return;
        }
        results.forEach((product) => {
          const images = product.product_image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          product.mainImage = mainImage;

          const dateObj = new Date(product.date);
          const day = dateObj.getDate();
          const month = dateObj.getMonth() + 1;
          const year = dateObj.getFullYear();
          const hours = dateObj.getHours();
          const minutes = dateObj.getMinutes().toString().padStart(2, "0");
          product.ngay = `${hours}:${minutes} ${day}/${month}/${year}`;
        });

        res.render(`admin/order`, {
          products: results,
          user: user ? JSON.parse(user) : null,
        });
      });
    }
  }
  orderPost(req, res) {
    const account_id = req.params.id;
    const id = req.body.id;
    const sql = "UPDATE cart set status='đã giao' where id=?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.redirect(`/admin/tai-khoan/order/${account_id}`);
    });
  }
  allorder(req, res) {
    const user = req.cookies.user;
    if (
      req.cookies.user == null ||
      JSON.parse(req.cookies.user).admin == false
    ) {
      res.redirect("/");
    } else {
      const sort = req.query.sort;
      let sql = `
          SELECT cart.*, product.name AS product_name, product.image AS product_image, 
                account.*, address.address_id, address.tinh, address.quan, address.phuong, address.nha, address.ghichu 
          FROM cart
          JOIN product ON cart.product_id = product.product_id
          JOIN account ON cart.account_id = account.account_id
          LEFT JOIN address ON account.account_id = address.account_id
      `;
      if (sort === "dang-giao") {
        sql += " WHERE cart.status = 'đang giao hàng' ORDER BY cart.date DESC";
      } else if (sort === "da-giao") {
        sql += " WHERE cart.status = 'đã giao' ORDER BY cart.date DESC";
      } else {
        sql +=
          " WHERE (cart.status = 'đang giao hàng' OR cart.status = 'đã giao') ORDER BY cart.date DESC";
      }
      db.query(sql, (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (results.length == 0) {
          res.render(`admin/order`, {
            note: "Lịch sử đơn hàng trống!",
            user: user ? JSON.parse(user) : null,
          });
          return;
        }
        results.forEach((product) => {
          const images = product.product_image.split(",");
          const mainImage =
            images.find((img) => img.includes("main")) || images[0];
          product.mainImage = mainImage;

          const dateObj = new Date(product.date);
          const day = dateObj.getDate();
          const month = dateObj.getMonth() + 1;
          const year = dateObj.getFullYear();
          const hours = dateObj.getHours();
          const minutes = dateObj.getMinutes().toString().padStart(2, "0");
          product.ngay = `${hours}:${minutes} ${day}/${month}/${year}`;
        });
        res.render(`admin/order`, {
          products: results,
          user: user ? JSON.parse(user) : null,
        });
      });
    }
  }
  allorderPost(req, res) {
    const id = req.body.id;
    const sql = "UPDATE cart set status='đã giao' where id=?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.redirect(`/admin/order`);
    });
  }
  xoaorder(req, res) {
    const id = req.body.xoa_id;
    console.log(id);
    const sql = "DELETE from cart where id=?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.redirect(`/admin/order`);
    });
  }
  doanhthu(req, res) {
    const user = req.cookies.user;
    if(!user){
      res.redirect("/")
    }
    const sql = `SELECT c.name AS danhmuc, SUM(cart.number) AS luotmua
                 FROM cart
                 JOIN product p ON cart.product_id = p.product_id
                 JOIN category c ON p.category_id = c.category_id
                 WHERE cart.status = 'đã giao'
                 GROUP BY c.name;`;
    new Promise((resolve, reject) => {
      db.query(sql, (err, results) => {
        if (err) {
          reject("Error: " + err.message);
        } else {
          resolve(results);
        }
      });
    })
      .then((pie) => {
        const sql1 = `SELECT DATE_FORMAT(cart.date, '%Y-%u') AS tuan, 
                      SUM(cart.number) AS luotmua, 
                      SUM(cart.price) AS doanhthu
                      FROM cart
                      WHERE cart.status = 'đã giao'
                      GROUP BY tuan
                      ORDER BY tuan ASC
                      LIMIT 5;`;
  
        new Promise((resolve, reject) => {
          db.query(sql1, (err, results) => {
            if (err) {
              reject("Error: " + err.message);
            } else {
              resolve(results);
            }
          });
        })
          .then((doanhthu) => {
            res.render("admin/doanhthu", {
              user: user ? JSON.parse(user) : null,
              doanhthu: JSON.stringify(doanhthu),
              pie: JSON.stringify(pie)
            });
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  }
  
}
module.exports = new adminController();
