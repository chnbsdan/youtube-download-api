import play from 'play-dl';
import cors from 'cors';

const corsHandler = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

export default async function handler(req, res) {
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
    // 获取视频信息
    const info = await play.video_info(videoUrl);
    
    // 获取可下载的视频格式
    const formats = await info.download_formats();
    
    // 筛选最高画质（mp4 + 音视频组合）
    const videoFormats = formats
      .filter(f => f.mimeType?.includes('mp4') && f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.quality || 0) - (a.quality || 0));

    const bestFormat = videoFormats[0] || formats[0];

    res.json({
      success: true,
      title: info.title || info.name || '未知',
      downloadUrl: bestFormat?.url || null,
      quality: bestFormat?.qualityLabel || bestFormat?.quality || 'unknown',
      duration: info.durationInSec || 0,
      thumbnail: info.thumbnail?.url || info.thumbnails?.pop()?.url || null
    });

  } catch (error) {
    console.error('解析失败:', error.message);
    
    res.status(500).json({
      success: false,
      error: '解析失败',
      message: error.message
    });
  }
}
