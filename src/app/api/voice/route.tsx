// src/app/api/voice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRealtimeSession } from '@/lib/realtime/session';

export async function POST(req: NextRequest) {
  console.log('>> SDP');
  // 1) Lee el SDP crudo
  const sdp = await req.text();
  console.log(
    '>> SDP recibido (preview):',
    sdp.slice(0, 80).replace(/\r?\n/g, '\\n'),
    '…'
  );

  // 2) Crea/recupera la sesión
  const ephemeralKey = await createRealtimeSession();

  // 3) Reenvía SDP a OpenAI Voice API
  const openaiRes = await fetch(
    'https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      },
      body: sdp
    }
  );

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    console.error('❌ OpenAI Voice API error:', err);
    return NextResponse.json({ error: err }, { status: openaiRes.status });
  }

  // 4) Devuelve el SDP answer
  const answerSdp = await openaiRes.text();
  return NextResponse.json({ sdp: answerSdp });
}
