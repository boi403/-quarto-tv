import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// Player compartilhado: toca .m3u8 via hls.js (ou nativo) e mp4 direto.
// onError avisa a tela (canal fora do ar, bloqueado, sem CORS etc.) —
// sem isso o player fica com uma tela preta e parece que "não roda nada".
export default function HlsVideo({ src, onError }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return;
    let hls = null;
    const avisarErro = () => onError?.();

    if (!/\.m3u8(\?|$)/i.test(src) || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.addEventListener('error', avisarErro);
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) avisarErro();
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      avisarErro();
    }
    return () => {
      video.removeEventListener('error', avisarErro);
      if (hls) hls.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, onError]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      style={{ width: '100%', maxHeight: '70vh', background: '#000', borderRadius: 12 }}
    />
  );
}
