import ytdl from 'ytdl-core';
import cors from 'cors';

const corsHandler = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

export default async function handler(req, res) {
  // 处理 CORS
  await new Promise((resolve, reject) => {
    corsHandler(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少视频链接参数 ?url=xxx' 
    });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    
    // 获取最高画质（音视频组合）
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highest',
      filter: 'audioandvideo'
    });
    
    if (!format) {
      const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
      const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
      
      return res.json({
        success: true,
        title: info.videoDetails.title,
        videoUrl: videoFormat?.url || null,
        audioUrl: audioFormat?.url || null,
        duration: info.videoDetails.lengthSeconds,
        thumbnail: info.videoDetails.thumbnails?.pop()?.url || null,
        message: '音视频分离，分别下载'
      });
    }

    res.json({
      success: true,
      title: info.videoDetails.title,
      downloadUrl: format.url,
      quality: format.qualityLabel || format.quality || 'unknown',
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails?.pop()?.url || null
    });

  } catch (error) {
    console.error('解析失败:', error.message);
    
    if (error.message.includes('Video unavailable')) {
      return res.status(404).json({
        success: false,
        error: '视频不存在或已被删除'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '解析失败',
      message: error.message
    });
  }
}
