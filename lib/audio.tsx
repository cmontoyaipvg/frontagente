// src/lib/audio.ts
export function decodeBase64Audio(
    base64String: string,
    mimeType = 'audio/mpeg',
    sampleRate = 44100,
    numChannels = 1
  ): Uint8Array {
    const byteString = atob(base64String);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const dataLength = byteArray.length;
    const blockAlign = numChannels * 2;
    const byteRate = sampleRate * blockAlign;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
  
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
  
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
  
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);
  
    return new Uint8Array(header);
  }
  