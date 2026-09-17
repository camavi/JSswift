import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const ROOT = path.resolve("dist");

app.use(express.static(ROOT));

app.get("*", (req, res, next) => {
  // ignora file con estensione (.js, .css, .svg ecc.)
  if (path.extname(req.path)) return next();

  const tryFiles = [
    path.join(ROOT, req.path + ".html"),
    path.join(ROOT, req.path, "index.html")
  ];

  for (const file of tryFiles) {
    console.log("try:", file);
    if (fs.existsSync(file)) {
      return res.sendFile(file);
    }
  }

  next();
});

app.listen(5173, () =>
  console.log("JSswift → http://localhost:5173")
);