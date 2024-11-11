const http = require("http");
const port = 3000;
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { createGzip } = require("zlib");
const gzip = createGzip();

//event module
const EventEmitter = require("events");
const Emitter = new EventEmitter();

function getFromBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (error) {
      callback(error);
    }
  });
}

const server = http.createServer((req, res) => {
  //!----------------- Start Path Module Questions -----------------!
  //! ---------------- Start Question 1 Task 1.1 -----------------!
  if (req.method === "POST" && req.url === "/path-info") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { file_path: filePath } = data;
      if (filePath) {
        const response = {
          ParsedPath: {
            root: path.parse(filePath).root,
            directory: path.dirname(filePath),
            base: path.basename(filePath),
            name: path.basename(filePath, path.extname(filePath)),
            extension: path.extname(filePath),
          },
          formattedpath: filePath,
        };

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(response));
      }

      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid path" }));
    });
  }
  //! ---------------- End Question 1 Task 1.1 -----------------!
  //! ---------------- Start Question 1 Task 1.2 -----------------!
  else if (req.method === "POST" && req.url === "/path-check") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { Absolute_path: filePath } = data;
      if (filePath) {
        const response = {
          is_Absolute: path.isAbsolute(filePath),
          base: path.basename(filePath),
          extension: path.extname(filePath),
          joinedPath: path.normalize(filePath),
          resolvedPath: path.resolve(filePath),
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(response));
      }
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid path" }));
    });
  }
  //! ---------------- End Question 1 Task 1.2  -----------------!
  //!----------------- End Path Module Questions -----------------!
  //!----------------- Start Event Module Questions -----------------!
  //!----------------- Start Question 2 task 2.1 -----------------!
  else if (req.method === "POST" && req.url === "/create-file") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { fileName, content } = data;
      if (fileName && content) {
        try {
          fs.appendFileSync(fileName, content);
          console.log(`File created with name: ${fileName}`);
          Emitter.emit("createFile", { fileName, content });
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: `Event Emitted & File Created with Name: ${fileName}`,
            })
          );
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: `Error creating file: ${error.message}` })
          );
        }
      }
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing file name or content" }));
    });
  }
  //!----------------- End Question 2 task 2.1 -----------------!
  //!----------------- Start Question 2 task 2.2 -----------------!
  else if (req.method === "DELETE" && req.url === "/delete-file") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { fileName } = data;
      if (fileName) {
        try {
          fs.unlinkSync(fileName);
          console.log(`File deleted with name: ${fileName}`);
          Emitter.emit("deleteFile", { fileName });
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: `Event Emitted & File Deleted with Name: ${fileName}`,
            })
          );
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: `Error deleting file: ${error.message} or File Already Deleted`,
            })
          );
        }
      }
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing file name" }));
    });
  }
  //!----------------- End Question 2 task 2.2 -----------------!
  //!------------------ End Event Module Questions -----------------!
  //!----------------- Start OS Module Questions -----------------!
  //!----------------- Start Question 3 -----------------!
  else if (req.method === "GET" && req.url === "/system-info") {
    const systemInfo = {
      Architecture: os.arch(),
      Platform: os.platform(),
      FreeMemory: os.freemem(),
      TotalMemory: os.totalmem(),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ systemInfo: systemInfo }));
  }
  //!----------------- End Question 3 -----------------!
  //!----------------- End OS Module Questions -----------------!
  //!----------------- Start File Module Questions -----------------!
  //!----------------- Start Question 4 -----------------!
  //!----------------- Task 4.1 for create and Delete is same as Question 2  -----------------!
  //!----------------- Task 4.2.1 for updating file asynchronously and if does not exists then create  -----------------!
  else if (req.method === "POST" && req.url === "/append-async") {
    getFromBody(req, async (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { fileName, content } = data;
      if (fileName && content) {
        try {
          const filePath = path.join(__dirname, fileName);
          const absolutePath = path.resolve(filePath);
          try {
            //! Check if file exists
            await fsp.access(absolutePath);
            console.log(`File exists, appending content to ${absolutePath}`);
          } catch (err) {
            //! File does not exist then create it with empty string and then append content
            console.log(`File does not exist, creating ${absolutePath}`);
            await fsp.appendFile(absolutePath, "");
          }
          await fsp.appendFile(absolutePath, content);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: "Ok",
              response: {
                msg: `${fileName} The file is written or read asynchronously,`,
              },
            })
          );
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: `Error creating or appending to file: ${error.message}`,
            })
          );
        }
      }
    });
  }
  //!----------------- Task 4.2.1 for reading file asynchronously  -----------------!
  else if (req.method === "POST" && req.url === "/read-async") {
    getFromBody(req, async (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { fileName } = data;
      if (fileName) {
        try {
          const filePath = path.join(__dirname, fileName);
          const absolutePath = path.resolve(filePath);
          try {
            //! Check if file exists
            await fsp.access(absolutePath);
            console.log(`File exists, appending content to ${absolutePath}`);
          } catch (err) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(
              JSON.stringify({
                error: `404 File Not Found ${absolutePath}`,
              })
            );
          }
          const content = await fsp.readFile(absolutePath, "utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              message: "Ok",
              response: {
                file_content: content,
              },
            })
          );
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              error: `Error creating or appending to file: ${error.message}`,
            })
          );
        }
      }
    });
  }
  //!----------------- End File Module Questions -----------------!
  //!----------------- Start Streams Module Questions -----------------!
  //!----------------- Task 5.1 Create Stream for reading from file -----------------!
  else if (req.method === "POST" && req.url === "/stream-file") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { fileName } = data;
      if (fileName) {
        const filePath = path.join(__dirname, fileName);

        const readStream = fs.createReadStream(filePath, {
          highWaterMark: 16,
          autoClose: true,
        });

        res.writeHead(200, { "Content-Type": "text/plain" });

        readStream.on("open", () => {
          console.log(`Stream opened for file: ${filePath}`);
          console.log("=============================================");
        });

        readStream.on("data", (chunk) => {
          console.log(`Chunk received: ${chunk.toString()}`);
          console.log("=============================================");
          res.write(chunk.toString());
        });

        readStream.on("end", () => {
          console.log(`Stream closed for file: ${filePath}`);
          console.log("=============================================");
          res.end();
        });

        readStream.on("error", (error) => {
          console.error(`Error reading file: ${error.message}`);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: `Error reading file: ${error.message}` })
          );
        });
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing file name" }));
      }
    });
  }
  //!----------------- Task 5.2 Copy content from one file to another -----------------!
  else if (req.method === "POST" && req.url === "/copy-file") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
      const { sourceFile: sourceFile, destinationFile: destinationFile } = data;
      if (sourceFile && destinationFile) {
        const sourceFilePath = path.join(__dirname, sourceFile);
        const destinationFilePath = path.join(__dirname, destinationFile);
        const readStream = fs.createReadStream(sourceFilePath);
        const writeStream = fs.createWriteStream(destinationFilePath);
        readStream.pipe(writeStream);
        readStream.on("end", () => {
          console.log(
            `File copied from ${sourceFilePath} to ${destinationFilePath}`
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ message: "Done! File copied successfully" })
          );
        });
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing sourceFile or destinationFile" })
        );
      }
    });
  }
  //!----------------- Task 5.2 Read content from one file and compress it -----------------!
  else if (req.method === "POST" && req.url === "/compress-file") {
    getFromBody(req, (error, data) => {
      if (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      const { fileName } = data;
      if (!fileName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "File name is missing" }));
      }

      const filePath = path.join(__dirname, fileName);
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(`${filePath}.gz`);

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on("finish", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "done" }));
        })
        .on("error", (err) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: `Compression error: ${err.message}` })
          );
        });
    });
  }
  //!----------------- End Streams Module Questions -----------------!
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//!----------------- Bonus Question -----------------!

fs.writeFileSync(
  "./bonus.js",
  `
  function findMissing(arr, k) {
    let missingCount = 0;
    let current = 1;
    
    for (let num of arr) {
        while (current < num) {
            missingCount++;
            if (missingCount === k) return current;
            current++;
        }
        current = num + 1;
    }
    while (missingCount < k) {
        missingCount++;
        current++;
    }
    
    return current - 1;
}

console.log(findMissing([2, 3, 4, 7, 11], 5));
  `,
  "utf-8"
);
