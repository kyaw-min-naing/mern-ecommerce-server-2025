import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "uploads");
  },
  filename(req, file, callback) {
    const id = uuid();
    const ext = path.extname(file.originalname);
    const fileName = `${id}.${ext}`;
    callback(null, fileName);
  },
});

export const singleUpload = multer({ storage }).single("photo");
