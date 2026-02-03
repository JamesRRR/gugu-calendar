const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { path, width = 430 } = event
  
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: path.split('?')[1] || '',
      page: path.split('?')[0] || 'pages/event/detail',
      width
    })
    
    return {
      buffer: result.buffer,
      contentType: result.contentType,
      fileID: result.fileID
    }
  } catch (err) {
    return { error: err.message }
  }
}
