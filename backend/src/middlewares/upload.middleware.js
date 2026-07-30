import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

// Memory storage for Excel files (no disk writes)
const storage = multer.memoryStorage();

const excelFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/csv",
    "application/vnd.ms-excel", // .xls (older)
  ];
  const allowedExts = [".xlsx", ".csv", ".xls"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only .xlsx and .csv files are allowed"), false);
  }
};

export const uploadExcel = multer({
  storage,
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("file");
