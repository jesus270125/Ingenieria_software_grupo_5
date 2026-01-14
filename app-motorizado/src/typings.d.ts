declare module 'socket.io-client' {
  const io: any;
  type Socket = any;
  export { io, Socket };
  export default io;
}

declare module '@capacitor/browser' {
  export const Browser: {
    open(options: { url: string }): Promise<void>;
    close?(): Promise<void>;
  };
  export default Browser;
}
