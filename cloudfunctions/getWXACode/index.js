const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { path, width = 430 } = event
  
  try {
    // 解析 path
    const [pagePath, queryString] = path.split('?')
    
    console.log('=== getWXACode Debug ===')
    console.log('path:', path)
    console.log('pagePath:', pagePath)
    console.log('queryString:', queryString)
    console.log('width:', width)
    
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: queryString || '',
      page: pagePath || 'pages/event/detail',
      width
    })
    
    console.log('wxacode result keys:', Object.keys(result || {}))
    console.log('fileID:', result.fileID)
    
    return {
      buffer: result.buffer ? '[BUFFER]' : undefined,
      contentType: result.contentType,
      fileID: result.fileID
    }
  } catch (err) {
    console.error('wxacode error:', err)
    return { error: err.message, errCode: err.errCode }
  }
}
