#!/opt/homebrew/bin/node

import { resolve, basename } from "path"
import fs from "fs"
import figlet from "figlet"
import gradient from "gradient-string"
import { createSpinner } from "nanospinner"
import glob from "glob"
import { exec } from "child_process"

const cwd = process.cwd()

const loadConfig = async () => {
  const logSpinner = createSpinner("Checking for spark.config.js")
  try {
    const { default: config } = await import(`${cwd}/spark.config.js`)
    if (config.srcDirs && config.includeDirs && config.outputDir){
      logSpinner.success() // Log success
      return config
    }
  } catch (err) {
    console.log(err)
  }
  logSpinner.error() // Log error
  process.exit(1)
}

const compileFile = async (fpath, include, outputPath = "build") => {
  const filename = basename(fpath)
  const status = createSpinner(`Compiling file: ${filename}`).start()
  const cmd = `g++ -std=c++17 ${include} -c ${fpath} -o ${outputPath}/${filename}.o`
  
  await new Promise((resolve, reject) => exec(
    cmd, (err, stdout, stderr) => {
      if (err) {
        status.error();
        console.log(stderr)
        process.exit(1)
      }
      status.success()
      resolve(stdout)
    }
  ))
}

const compile = async (config) => {
  const outputDir = resolve(config.outputDir)
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
  
  const include = config.includeDirs.join(' -I')
  config.srcDirs.forEach((dir) => glob(dir, (err, files) => {
    files.forEach(file => compileFile(resolve(file), include))
  }))
}

const main = async () => {
  await new Promise ((resolve, reject) => figlet("Spark Compiler", (err, res) => {
    console.log(gradient.pastel.multiline(res))
    resolve()
  }))
  
  const config = await loadConfig()
  await compile(config)
}

main()
