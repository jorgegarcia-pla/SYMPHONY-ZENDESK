export default class WebSocketClient {
  constructor(url, id_user, messageHandler, openHandler, closeHandler, errorHandler) {
    this.url = url;
    this.id_user = id_user;
    this.socket = new WebSocket(`${this.url}?idUser=${this.id_user}`);
    this.messageHandler = messageHandler;
    this.openHandler = openHandler;
    this.closeHandler = closeHandler;
    this.errorHandler = errorHandler;

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      if (typeof this.openHandler === 'function') {
        this.openHandler();
      }
    };

    this.socket.onmessage = (event) => {
      console.log('Message received:', event.data);
      if (typeof this.messageHandler === 'function') {
        this.messageHandler(event.data);
      } else {
        console.error('No message handler function provided.');
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
      if (typeof this.closeHandler === 'function') {
        this.closeHandler();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (typeof this.errorHandler === 'function') {
        this.errorHandler(error);
      }
    };
  }

  send(message) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error('WebSocket connection is not open.');
    }
  }

  close() {
    this.socket.close();
  }
}
