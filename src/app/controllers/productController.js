const db = require("../config/mysql.js");

class productController {
  main(req, res) {
    const id = req.params.id;
    let item;

    // Query for the product
    const getProduct = new Promise((resolve, reject) => {
      const query =
        "SELECT * FROM product WHERE product_id = ? and status ='Còn hàng'";
      db.query(query, [id], (err, results) => {
        if (err) {
          reject("Database query error for product: " + err);
        }
        if (results.length === 0) {
          res.redirect("/");
          return
        }
        resolve(results[0]);
      });
    });

    getProduct
      .then((product) => {
        // Process the product image and color
        const images = product.image.split(",");
        const mainImage =
          images.find((img) => img.includes("main")) || images[0];
        const otherImages = images.filter((img) => img !== mainImage);
        product.mainImage = mainImage;
        product.otherImages = otherImages;

        const colors = product.color.split(",");
        product.color = colors;
        item = product;

        // Query for similar products
        const getSimilarProducts = new Promise((resolve, reject) => {
          const query1 =
            "SELECT * FROM product WHERE category_id = ? and product_id!= ? and status ='Còn hàng' ORDER BY sold";
          db.query(query1, [product.category_id, id], (err, results1) => {
            if (err) {
              reject("Database query error for similar products: " + err);
            }
            resolve(results1);
          });
        });

        return getSimilarProducts.then((results1) => {
          // Process similar products images
          if (results1.length > 0) {
            results1.forEach((product) => {
              const images = product.image.split(",");
              const mainImage =
                images.find((img) => img.includes("main")) || images[0];
              const otherImages = images.filter((img) => img !== mainImage);
              product.mainImage = mainImage;
              product.otherImages = otherImages;

              const dateObj = new Date(product.date);
              const day = dateObj.getDate();
              const month = dateObj.getMonth() + 1;
              const year = dateObj.getFullYear();
              const hours = dateObj.getHours();
              const minutes = dateObj.getMinutes().toString().padStart(2, "0");
              // Format to '8/11/2024 20:55'
              product.ngay = `${hours}:${minutes} ${day}/${month}/${year}`;
            });
          }

          const user = req.cookies.user;
          let dacmt = false; // Flag to check if user has commented
          let commentIds = item.comment_id ? item.comment_id.split(",") : [];

          // Query for comments
          const getComments = new Promise((resolve, reject) => {
            if (commentIds.length === 0) {
              resolve([]);
            }
            const sql = `SELECT comment.*, account.username
                         FROM comment
                         JOIN account ON comment.account_id = account.account_id
                         WHERE comment.comment_id IN (?) LIMIT 10`;
            db.query(sql, [commentIds], (err, result) => {
              if (err) {
                reject("Database query error for comments: " + err);
              }
              if (result == null) {
              } else {
                if (result.length > 0) {
                  result.forEach((product) => {
                    const dateObj = new Date(product.date);
                    const day = dateObj.getDate();
                    const month = dateObj.getMonth() + 1;
                    const year = dateObj.getFullYear();
                    const hours = dateObj.getHours();
                    const minutes = dateObj
                      .getMinutes()
                      .toString()
                      .padStart(2, "0");
                    // Format to '8/11/2024 20:55'
                    product.ngay = `${day}/${month}/${year}`;
                  });
                }
              }
              resolve(result);
            });
          });

          return getComments.then((comments) => {
            if (!user) {
              return res.render("product", {
                product: product,
                similiar: results1,
                comments: comments,
              });
            }

            // Check if user has commented
            if (comments.length > 0) {
              comments.forEach((comment) => {
                if (comment.account_id === JSON.parse(user).id) {
                  dacmt = true;
                }
              });
            }

            // Query to check if the user has bought the product
            const checkIfUserHasBoughtProduct = new Promise(
              (resolve, reject) => {
                const sql =
                  "SELECT * from cart where product_id=? and account_id=? and status=?";
                db.query(
                  sql,
                  [item.product_id, JSON.parse(user).id, "đã giao"],
                  (err, result) => {
                    if (err) {
                      reject("Database query error during cart check: " + err);
                    }
                    resolve(result);
                  }
                );
              }
            );

            return checkIfUserHasBoughtProduct
              .then((result) => {
                let cmt = "duoc";
                if (result.length > 0 && !dacmt) {
                  return res.render("product", {
                    product: product,
                    similiar: results1,
                    comments: comments,
                    dccmt: cmt,
                    user: user ? JSON.parse(user) : null,
                  });
                } else {
                  return res.render("product", {
                    product: product,
                    similiar: results1,
                    comments: comments,
                    user: user ? JSON.parse(user) : null,
                  });
                }
              })
              .catch((err) => {
                console.error(err);
                res.status(500).send("Server error during cart check");
              });
          });
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Server error: " + err);
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
  comment(req, res) {
    const u = req.cookies.user;
    if (!u) {
      return res.redirect("/account/login");
    }
    const user = JSON.parse(u).id;
    const id = req.body.id;
    const rating = req.body.rating;
    const comment = req.body.comment;

    // Create a promise for the first query (inserting the comment)
    new Promise((resolve, reject) => {
      const sql =
        "INSERT INTO comment (product_id, account_id, rating, comment) VALUES (?, ?, ?, ?)";
      db.query(sql, [id, user, rating, comment], (err) => {
        if (err) {
          reject("Database query error during comment insert");
        } else {
          resolve();
        }
      });
    })
      .then(() => {
        // Create a promise for the second query (fetching comment_id)
        return new Promise((resolve, reject) => {
          const sql2 =
            "SELECT comment_id FROM comment WHERE product_id = ? AND account_id = ?";
          db.query(sql2, [id, user], (err, result) => {
            if (err) {
              reject("Database query error during comment fetch");
            } else {
              resolve(result);
            }
          });
        });
      })
      .then((result) => {
        // Create a promise for the third query (updating the product's comment_id)
        return new Promise((resolve, reject) => {
          const sql1 = `
            UPDATE product 
            SET comment_id = 
              CASE 
                WHEN comment_id = '' OR comment_id IS NULL THEN ? 
                ELSE CONCAT(comment_id, ',', ?) 
              END
            WHERE product_id = ?;
          `;
          db.query(
            sql1,
            [result[0].comment_id, result[0].comment_id, id],
            (err, results) => {
              if (err) {
                reject("Database query error during product update");
              } else {
                resolve();
              }
            }
          );
        });
      })
      .then(() => {
        // After all queries, redirect to the product page
        res.redirect(`/product/${id}`);
      })
      .catch((err) => {
        // Catch any errors in the chain of promises
        console.error("Error:", err);
        res.status(500).send("Server error");
      });
  }
}

module.exports = new productController();
