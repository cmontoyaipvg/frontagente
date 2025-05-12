import { executeToolCall, type ToolCall } from "./tools"

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private onTranscriptUpdate: (transcript: string, isUser: boolean) => void
  private onStatusChange: (status: string) => void
  private onToolCall: (toolName: string) => void

  constructor(
    onTranscriptUpdate: (transcript: string, isUser: boolean) => void,
    onStatusChange: (status: string) => void,
    onToolCall: (toolName: string) => void,
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate
    this.onStatusChange = onStatusChange
    this.onToolCall = onToolCall
  }

  async initialize() {
    try {
      this.onStatusChange("Initializing…")
  
      // 1) Crea el RTCPeerConnection
      this.peerConnection = new RTCPeerConnection()
  
      // 2) Captura el micrófono
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  
      // 3) Añade las pistas al PeerConnection
      this.localStream.getAudioTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })
  
      // 4) Prepara el stream remoto
      this.remoteStream = new MediaStream()
      this.peerConnection.ontrack = (evt) => {
        evt.streams[0].getTracks().forEach((t) => this.remoteStream!.addTrack(t))
      }
  
      // 5) Data channel para recibir transcripciones y tool calls
      this.peerConnection.ondatachannel = (evt) => {
        this.dataChannel = evt.channel
        this.dataChannel.onmessage = this.handleDataChannelMessage.bind(this)
      }
  
      this.onStatusChange("Initialized")
      return true
    } catch (e) {
      console.error("Error initializing WebRTC:", e)
      this.onStatusChange("Error initializing")
      return false
    }
  }
  

  private async handleDataChannelMessage(event: MessageEvent) {
    try {
      console.log("RAW DATA CHANNEL MESSAGE:", event.data);
      const data = JSON.parse(event.data);
  
      // 1) Transcripciones
      if (data.type === "transcript") {
        const isUser = data.role === "user";
        this.onTranscriptUpdate(data.text, isUser);
        return;
      }
  
      // 2) Llamadas directas (legacy)
      if (data.type === "tool_calls" || data.type === "tool_call") {
        const raw = data.tool_calls ?? data.tool_call;
        const calls: ToolCall[] = Array.isArray(raw) ? raw : [raw];
        await this._processToolCalls(calls);
        return;
      }
  
      // 3) Nuevo caso: al completar la respuesta
      if (data.type === "response.done" && Array.isArray(data.response?.output)) {
        // Filtramos solo los function_call
        const calls: ToolCall[] = data.response.output
          .filter((item: any) => item.type === "function_call")
          .map((item: any) => ({
            id:   item.call_id,
            type: item.type,
            name: item.name,
            arguments: item.arguments,
          }));
  
        await this._processToolCalls(calls);
        return;
      }
  
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  }
  
  /**
   * Extraemos la lógica de ejecución en un método privado
   */
  private async _processToolCalls(calls: ToolCall[]) {
    for (const call of calls) {
      this.onToolCall(call.name);
      const result = await executeToolCall(call);
  
      if (this.dataChannel?.readyState === "open") {
        // 1) Insertamos el resultado de la función en el history
        this.dataChannel.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id:    result.tool_call_id,
            // stringify your result object or text
            output:     JSON.stringify(result.output),
          },
        }));
      
        // 2) Disparamos la inferencia del modelo para que continúe
        this.dataChannel.send(JSON.stringify({
          type: "response.create",
        }));
      }
      
    }
  }
  

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized")
    }

    this.onStatusChange("Creating offer...")

    // Create data channel for sending tool results
    this.dataChannel = this.peerConnection.createDataChannel("transcript")
    this.dataChannel.onmessage = this.handleDataChannelMessage.bind(this)

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (!this.peerConnection) return resolve()

      if (this.peerConnection.iceGatheringState === "complete") {
        resolve()
      } else {
        const checkState = () => {
          if (this.peerConnection && this.peerConnection.iceGatheringState === "complete") {
            this.peerConnection.removeEventListener("icegatheringstatechange", checkState)
            resolve()
          }
        }

        this.peerConnection.addEventListener("icegatheringstatechange", checkState)
      }
    })

    return this.peerConnection.localDescription?.sdp
  }

  async setRemoteDescription(sdp: string) {
    if (!this.peerConnection) throw new Error("Peer connection not initialized");
    this.onStatusChange("Connecting...");
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription({
      type: "answer",
      sdp,
    }));
    this.onStatusChange("Connected");
  
    // Enviamos el saludo apenas estemos “Connected”
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "text",
          role: "assistant",
          text: "Hola En que puedo ayudar hoy!!"
        }
      }));
      this.dataChannel.send(JSON.stringify({ type: "response.create" }));
    }
  
    return this.remoteStream;
  }
  

  async connect() {
    const offerSdp = await this.createOffer();
    if (!offerSdp) throw new Error("Failed to create offer");

    // 1) Envío SDP puro a tu route
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offerSdp,
    });
     console.log(response) 
    // 2) Si falla, extrae el texto de error
  
    // 3) Parsea el JSON { sdp } que devuelve tu route
    const { sdp: answerSdp } = await response.json();
    return this.setRemoteDescription(answerSdp);
  }
  disconnect() {
    // Stop all tracks in the local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    // Close the peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
    this.dataChannel = null
    this.onStatusChange("Disconnected")
  }
}