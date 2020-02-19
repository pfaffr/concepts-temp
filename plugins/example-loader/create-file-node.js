const path = require(`path`)
const fs = require(`fs-extra`)
const mime = require(`mime`)
const prettyBytes = require(`pretty-bytes`)
const { promisify } = require('util')

const md5File = require(`bluebird`).promisify(require(`md5-file`))
const { createContentDigest, slash } = require(`gatsby-core-utils`)

exports.createFileNode = async (
  pathToFile,
  createNodeId,
  pluginOptions = {}
) => {
  const slashed = slash(pathToFile)
  const parsedSlashed = path.parse(slashed)
  const slashedFile = {
    ...parsedSlashed,
    absolutePath: slashed,
    // Useful for limiting graphql query with certain parent directory
    relativeDirectory: slash(
      path.relative(pluginOptions.path || process.cwd(), parsedSlashed.dir)
    ),
  }

  const stats = await fs.stat(slashedFile.absolutePath)
  const isString = (obj) => (Object.prototype.toString.call(obj) === '[object String]')

  let internal

  // let nodeData

  // const processTextContent = (text) => {
  // //   const nodeContent = JSON.stringify(content)
  //   console.log('zzz')
  //   console.log(text)
  //   const str = isString(text) ? text : ` `
  //   // const nodeData = Object.assign({}, content, {
  //   //   id: `${content.Id}`,
  //   //   parent: `${nodeContent.parentId}`,
  //   //   children: [],
  //   //   internal: {
  //   //     type: `SN${content.Type}Markdown`,
  //   //     content: str,
  //   //     mediaType: `text/markdown`,
  //   //     contentDigest: createContentDigest(str),
  //   //   },
  //   // })
  //   return str
  // }

  if (stats.isDirectory()) {
    const contentDigest = createContentDigest({
      stats: stats,
      absolutePath: slashedFile.absolutePath,
    })
    internal = {
      contentDigest,
      type: `Folder`,
      description: `Folder "${path.relative(process.cwd(), slashed)}"`,
    }
  } else {

    const content = await fs.readFile(slashedFile.absolutePath, 'utf8')
    // .then((content) => {

    //   console.log('xxx')
    //   console.log(content)
    //   return processTextContent(stats, content)
    // })

    const contentDigest = await md5File(slashedFile.absolutePath)
    const mediaType = mime.getType(slashedFile.ext)
    internal = {
      contentDigest,
      type: `Example`,
      mediaType: mediaType ? mediaType : `application/octet-stream`,
      description: `Example "${path.relative(process.cwd(), slashed)}"`,
      content: content
    }
  }

  // Stringify date objects.
  return JSON.parse(
    JSON.stringify({
      // Don't actually make the File id the absolute path as otherwise
      // people will use the id for that and ids shouldn't be treated as
      // useful information.
      id: createNodeId(pathToFile),
      children: [],
      parent: null,
      internal,
      sourceInstanceName: pluginOptions.name || `__PROGRAMMATIC__`,
      absolutePath: slashedFile.absolutePath,
      relativePath: slash(
        path.relative(
          pluginOptions.path || process.cwd(),
          slashedFile.absolutePath
        )
      ),
      extension: slashedFile.ext.slice(1).toLowerCase(),
      size: stats.size,
      prettySize: prettyBytes(stats.size),
      modifiedTime: stats.mtime,
      accessTime: stats.atime,
      changeTime: stats.ctime,
      birthTime: stats.birthtime,
      ...slashedFile,
      ...stats,
    })
  )
}