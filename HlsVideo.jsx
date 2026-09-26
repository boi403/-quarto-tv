import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// Player compartilhado: toca .m3u8 via hls.js (ou nativo) e mp4 direto.
export default function HlsVideo({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return;
    let hls = null;

    if (!/\.m3u8(\?|$)/i.test(src) || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    }
    return () => {
      if (hls) hls.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      style={{ width: '100%', maxHeight: '70vh', background: '#000', borderRadius: 12 }}
    />
  );
}
