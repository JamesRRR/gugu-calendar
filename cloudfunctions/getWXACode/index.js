const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { path, width = 430 } = event
  
  if (!path) {
    return { error: 'path 参数必填' }
  }
  
  try {
    // 解析 path，格式: "pages/event/detail?id=xxx&mode=payment"
    const [pagePath, queryString] = (path || '').split('?')
    
    console.log('=== getWXACode Debug ===')
    console.log('path:', path)
    console.log('pagePath:', pagePath)
    console.log('queryString:', queryString)
    console.log('width:', width)
    
    // scene 必须是字符串，不能是 undefined
    const scene = queryString || ''
    
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: scene,
      page: pagePath || 'pages/event/detail',
      width: parseInt(width) || 430
    })
    
    console.log('wxacode success, fileID:', result.fileID)
    
    return {
      buffer: result.buffer ? '[BUFFER]' : undefined,
      contentType: result.contentType,
      fileID: result.fileID
    }
  } catch (err) {
    console.error('wxacode error:', err)
    return { 
      error: err.message, 
      errCode: err.errCode,
      errMsg: err.errMsg
    }
  }
}
