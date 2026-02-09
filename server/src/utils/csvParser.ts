import fs from "fs";
import csvParser from "csv-parser";

export const parseCSV = <T>(filePath: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => results.push(row))
      .on("end", () => {
        fs.unlinkSync(filePath); // cleanup
        resolve(results);
      })
      .on("error", reject);
  });
};
