import cors from 'cors';

const corsHandler = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

// 改成可用的下载站
const YT_DOWNLOAD_URL = 'https://www.y2mate.is/youtube';

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

  let videoId = '';
  let match = videoUrl.match(/[?&]v=([^&]+)/);
  if (match) { videoId = match[1]; }
  match = videoUrl.match(/youtu\.be\/([^?&]+)/);
  if (match) { videoId = match[1]; }

  if (!videoId) {
    return res.status(400).json({ 
      success: false, 
      error: '无法解析视频 ID' 
    });
  }

  res.json({
    success: true,
    title: 'YouTube 视频',
    downloadUrl: `${YT_DOWNLOAD_URL}/${videoId}`,
    quality: '点击链接后选择画质下载',
    isExternal: true
  });
}
