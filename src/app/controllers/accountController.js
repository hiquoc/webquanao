const e = require("express");
const db = require("../config/mysql.js");
class accountController {
  loginpage(req, res) {
    const query = "SELECT * FROM account";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      if (results.length === 0) {
        res.render("account/login", { layout: "account" });
      } else {
        res.render("account/login", {
          layout: "account",
          accounts: JSON.stringify(results),
        });
      }
    });
  }
  loginpost(req, res) {
    const query = "SELECT * FROM account";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      let isin = false;
      let id,
        admin = false;
      for (var i = 0; i < results.length; i++) {
        if (
          req.body.username == results[i].username &&
          req.body.password == results[i].password
        ) {
          id = results[i].account_id;
          if (results[i].role == "admin") admin = true;
          isin = true;
        }
      }
      if (isin == true) {
        const user = {
          username: req.body.username,
          password: req.body.password,
          id: id,
          admin: admin,
        };
        res.cookie("user", JSON.stringify(user), {
          httpOnly: true,
          maxAge: 3600000,
        });
        res.redirect("/");
      } else if (isin == false) {
        res.render("account/login", {
          layout: "account",
          err: "Sai tên tài khoản hoặc mật khẩu",
        });
      }
    });
    //res.render('account/login',{layout:'account'})
  }
  signuppage(req, res) {
    const query = "SELECT * FROM account";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      if (results.length === 0) {
        res.render("account/signup", { layout: "account" });
      } else {
        res.render("account/signup", {
          layout: "account",
          accounts: JSON.stringify(results),
        });
      }
    });
  }
  signuppost(req, res) {
    const { username, password, hovaten, sdt, email } = req.body;
    const sql =
      "INSERT INTO account (username, password, fullname, phone,email) VALUES (?, ?, ?, ?,?)";
    db.query(sql, [username, password, hovaten, sdt, email], (err) => {
      if (err) {
        return res.status(500).send("Database error.");
      }
      res.redirect("/account/login");
    });
  }
  logout(req, res) {
    res.clearCookie("user"); // Remove the 'user' cookie
    res.redirect("/");
  }
  userpage(req, res) {
    const user = JSON.parse(req.cookies.user);
    const id = user.id;
    let account, address, accounts;
    const query = "SELECT * FROM account";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      if (results.length === 0) {
        res.redirect("login");
      } else {
        const index = results.findIndex((acc) => acc.account_id === id);
        if (index !== -1) {
          account = results[index]; // Store the removed item if needed
          results.splice(index, 1); // Remove the item from results
        }
        accounts = results;
        const query1 = "SELECT * FROM address where account_id =?";
        db.query(query1, [id], (err, results) => {
          if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Server error");
          }
          if (results.length != 0) {
            address = results[0];
          }
          const query2 = `
              SELECT cart.*, product.name, product.image
              FROM cart
              JOIN product ON cart.product_id = product.product_id
              WHERE cart.account_id = ? AND (cart.status = ? OR cart.status = ? OR cart.status = ?)
              order by date DESC;
            `;
          db.query(
            query2,
            [id, "đang giao hàng", "đã hủy", "đã giao"],
            (err, cartresults) => {
              if (err) {
                console.error("Database query error:", err);
                return res.status(500).send("Server error");
              }
              cartresults.forEach((product) => {
                const images = product.image.split(",");
                const mainImage =
                  images.find((img) => img.includes("main")) || images[0];
                product.mainImage = mainImage;

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
                product.ngay = `${hours}:${minutes} ${day}/${month}/${year}`;
              });
              if (!address || Object.keys(address).length === 0) {
                res.render("account/user", {
                  account: account,
                  accounts: JSON.stringify(accounts),
                  length: cartresults.length,
                  user: user,
                  products: cartresults,
                });
              } else {
                res.render("account/user", {
                  account: account,
                  accounts: JSON.stringify(accounts),
                  pw: JSON.stringify(account.password),
                  address: address,
                  length: cartresults.length,
                  user: user,
                  products: cartresults,
                });
              }
            }
          );
        });
      }
    });
  }
  info(req, res) {
    const user = JSON.parse(req.cookies.user);
    const id = user.id;
    const { hovaten, email, sdt } = req.body;
    const sql =
      "UPDATE account SET fullname= ?, phone=?,email=? WHERE account_id = ?";
    db.query(sql, [hovaten, sdt, email, id], (err) => {
      if (err) {
        return res.status(500).send("Database error.");
      }
      res.redirect("/account/user");
    });
  }
  address(req, res) {
    const user = JSON.parse(req.cookies.user);
    const id = user.id;
    const { tinh, quan, phuong, nha, ghichu } = req.body;
    const query1 = "SELECT * FROM address where account_id =?";
    db.query(query1, [id], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      if (results.length === 0) {
        const sql =
          "INSERT INTO address (account_id, tinh, quan, phuong,nha,ghichu) VALUES (?, ?, ?, ?,?,?)";
        db.query(sql, [id, tinh, quan, phuong, nha, ghichu], (err) => {
          if (err) {
            return res.status(500).send("Database error." + err);
          }
          res.redirect("/account/user");
        });
      } else {
        const sql =
          "UPDATE address set tinh=?, quan=?, phuong=?,nha=?,ghichu=? where account_id=?";
        db.query(sql, [tinh, quan, phuong, nha, ghichu, id], (err) => {
          if (err) {
            return res.status(500).send("Database error.");
          }
          res.redirect("/account/user");
        });
      }
    });
  }
  password(req, res) {
    const user = JSON.parse(req.cookies.user);
    const id = user.id;
    const pw = req.body.newPassword;
    const sql = "UPDATE account SET password=? WHERE account_id = ?";
    db.query(sql, [pw, id], (err) => {
      if (err) {
        return res.status(500).send("Database error.");
      }
      res.redirect("/account/user");
    });
  }
  cartpage(req, res) {
    const user = req.cookies.user;
    if (!user) {
      res.redirect("/account/login");
    } else {
      let cart;
      const id = JSON.parse(req.cookies.user).id;
      const sql = "SELECT * FROM cart where account_id=? and status=? order by id desc";
      db.query(sql, [id, "trong giỏ"], (err, results1) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (results1.length === 0) {
          res.render("account/cart", {
            user: user ? JSON.parse(user) : null,
            note: "Giỏ hàng rỗng!",
          });
        } else {
          cart = results1;
          const productIds = cart.map((item) => item.product_id);
          const sql1 =
            "SELECT product_id, image, name FROM product WHERE product_id IN (?)";
          db.query(sql1, [productIds], (err, results2) => {
            if (err) {
              console.error("Database query error:", err);
              return res.status(500).send("Server error");
            }
            results2.forEach((product) => {
              const images = product.image.split(",");
              const mainImage =
                images.find((img) => img.includes("main")) || images[0];
              product.mainImage = mainImage;
            });
            const productMap = results2.reduce((acc, product) => {
              acc[product.product_id] = {
                mainImage: product.mainImage,
                name: product.name,
              };
              return acc;
            }, {});
            const updatedCart = cart.map((item) => ({
              ...item,
              mainImage: productMap[item.product_id]?.mainImage || null,
              name: productMap[item.product_id]?.name || null,
            }));
            const nop = updatedCart.reduce((sum, item) => sum + item.number, 0);
            const pop = updatedCart.reduce((sum, item) => sum + item.price, 0);
            res.render("account/cart", {
              user: user ? JSON.parse(user) : null,
              products: updatedCart,
              nop: nop,
              pop: pop,
            });
          });
        }
      });
    }
  }
  cartxoa(req, res) {
    const id = req.body.id;
    const sql = "DELETE FROM cart where id=?";
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.redirect("/account/cart");
    });
  }
  checkoutpage(req, res) {
    const user = req.cookies.user;
    if (!user) {
      res.redirect("/account/login");
    } else {
      const id = JSON.parse(req.cookies.user).id;
      let account, address, accounts;

      // Query to fetch account information
      const query2 = "SELECT * FROM account";
      db.query(query2, (err, accountResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (accountResults.length === 0) {
          res.redirect("/account/login");
        } else {
          const index = accountResults.findIndex(
            (acc) => acc.account_id === id
          );
          if (index !== -1) {
            account = accountResults[index]; // Store the removed item if needed
            accountResults.splice(index, 1); // Remove the item from results
          }
          accounts = accountResults;
        }
      });

      // Query to fetch address information
      const query1 = "SELECT * FROM address WHERE account_id = ?";
      db.query(query1, [id], (err, addressResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (addressResults.length !== 0) {
          address = addressResults[0];
        }
      });
      const deleteQuery = "DELETE FROM cart WHERE account_id = ? and status=?";
      db.query(deleteQuery, [id, "đang xử lý"], (err, result) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
      });
      // Query to fetch cart items
      const query = "SELECT * FROM cart WHERE account_id = ? AND status = ?";
      db.query(query, [id, "trong giỏ"], (err, cartResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (cartResults.length == 0) {
          res.redirect("/account/user");
        } else {
          // Combine the cart results with product details
          const productQueries = cartResults.map((cartItem, index) => {
            return new Promise((resolve, reject) => {
              const query3 = "SELECT * FROM product WHERE product_id = ?  ";
              db.query(query3, [cartItem.product_id], (err, productResults) => {
                if (err) {
                  return reject("Database query error: " + err);
                }
                const product = productResults[0];
                const images = product.image.split(",");
                const mainImage =
                  images.find((img) => img.includes("main")) || images[0];

                // Combine cart item and product data
                cartResults[index].name = product.name;
                cartResults[index].mainImage = mainImage;

                resolve();
              });
            });
          });

          // After all product queries have resolved, render the checkout page
          Promise.all(productQueries)
            .then(() => {
              const numberofproducts = parseInt(
                cartResults.reduce(
                  (total, cartItem) => total + cartItem.number,
                  0
                ),
                10
              );
              const priceofproducts = cartResults.reduce(
                (total, cartItem) => total + cartItem.price,
                0
              );
              res.render("account/checkout", {
                user: user ? JSON.parse(user) : null,
                account: account,
                accounts: JSON.stringify(accounts),
                address: address,
                cartItems: cartResults,
                nop: numberofproducts,
                pop: priceofproducts,
              });
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send("Server error");
            });
        }
      });
    }
  }
  checkoutPost(req, res) {
    const user = JSON.parse(req.cookies.user);
    const account_id = user.id;
    const { hovaten, email, sdt, tinh, quan, phuong, nha, ghichu } = req.body;
    let ids = req.body.id;

    const numericIds = ids.map((id) => parseInt(id, 10));
    const sql = "UPDATE account SET fullname= ?, phone=?, email=? WHERE account_id = ?";

    const updateAccount = () => {
        return new Promise((resolve, reject) => {
            db.query(sql, [hovaten, sdt, email, account_id], (err) => {
                if (err) reject("Database error: " + err);
                else resolve();
            });
        });
    };

    const updateAddress = () => {
        const sql2 = "UPDATE address SET tinh= ?, quan=?, phuong=?, nha=?, ghichu=? WHERE account_id = ?";
        return new Promise((resolve, reject) => {
            db.query(sql2, [tinh, quan, phuong, nha, ghichu, account_id], (err) => {
                if (err) reject("Database error: " + err);
                else resolve();
            });
        });
    };

    const updateCartStatus = () => {
        const updatePromises = ids.map((id) => {
            const updateSql = "UPDATE cart SET status=? WHERE id=?";
            return new Promise((resolve, reject) => {
                db.query(updateSql, ["đang giao hàng", id], (err) => {
                    if (err) reject("Database error: " + err);
                    else resolve();
                });
            });
        });
        return Promise.all(updatePromises);
    };

    const getCartItems = () => {
        const selectSql = "SELECT product_id, number FROM cart WHERE id IN (?)";
        return new Promise((resolve, reject) => {
            db.query(selectSql, [numericIds], (err, results) => {
                if (err) reject("Database error: " + err);
                else resolve(results);
            });
        });
    };

    const updateProductSold = (items) => {
        const updatePromises = items.map((item) => {
            const updateSql = "UPDATE product SET sold = sold + ? WHERE product_id = ?";
            return new Promise((resolve, reject) => {
                db.query(updateSql, [item.number, item.product_id], (err) => {
                    if (err) reject("Database error: " + err);
                    else resolve();
                });
            });
        });
        return Promise.all(updatePromises);
    };

    // Execute the promises in sequence
    updateAccount()
        .then(updateAddress)
        .then(updateCartStatus)
        .then(getCartItems)
        .then(updateProductSold)
        .then(() => {
            res.redirect("/account/user");
        })
        .catch((error) => {
            res.status(500).send(error);
        });
}


  buynowpage(req, res) {
    const user = req.cookies.user;
    if (!user) {
      res.redirect("/account/login");
    } else {
      const id = JSON.parse(req.cookies.user).id;
      let account, address;

      // Query to fetch account information
      const query2 = "SELECT * FROM account WHERE account_id = ?";
      db.query(query2, [id], (err, accountResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (accountResults.length === 0) {
          res.redirect("account/login");
        } else {
          account = accountResults[0];
        }
      });

      // Query to fetch address information
      const query1 = "SELECT * FROM address WHERE account_id = ?";
      db.query(query1, [id], (err, addressResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (addressResults.length !== 0) {
          address = addressResults[0];
        }
      });
      // Query to fetch cart items
      const query = "SELECT * FROM cart WHERE account_id = ? AND status = ?";
      db.query(query, [id, "đang xử lý"], (err, cartResults) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send("Server error");
        }
        if (cartResults.length == 0) {
          res.redirect("account/cart");
        } else {
          // Combine the cart results with product details
          const productQueries = cartResults.map((cartItem, index) => {
            return new Promise((resolve, reject) => {
              const query3 = "SELECT * FROM product WHERE product_id = ?  ";
              db.query(query3, [cartItem.product_id], (err, productResults) => {
                if (err) {
                  return reject("Database query error: " + err);
                }
                const product = productResults[0];
                const images = product.image.split(",");
                const mainImage =
                  images.find((img) => img.includes("main")) || images[0];

                // Combine cart item and product data
                cartResults[index].name = product.name;
                cartResults[index].mainImage = mainImage;

                resolve();
              });
            });
          });

          // After all product queries have resolved, render the checkout page
          Promise.all(productQueries)
            .then(() => {
              const numberofproducts = parseInt(
                cartResults.reduce(
                  (total, cartItem) => total + cartItem.number,
                  0
                ),
                10
              );
              const priceofproducts = cartResults.reduce(
                (total, cartItem) => total + cartItem.price,
                0
              );
              res.render("account/checkout", {
                user: user ? JSON.parse(user) : null,
                account: account,
                address: address,
                cartItems: cartResults,
                nop: numberofproducts,
                pop: priceofproducts,
              });
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send("Server error");
            });
        }
      });
    }
  }
  huyorder(req, res) {
    const id = req.body.id;
    const sql = `UPDATE cart set status="đã hủy" where id=?`;
    db.query(sql, [id], (err) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Server error");
      }
      res.redirect("/account/user");
    });
  }
}
module.exports = new accountController();
