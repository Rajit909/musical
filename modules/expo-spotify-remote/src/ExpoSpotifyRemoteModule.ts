import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoSpotifyRemoteModule extends NativeModule {
  connect(clientId: string, redirectUri: string): Promise<string>;
  disconnect(): void;
  play(uri: string): Promise<void>;
  pause(): Promise<void>;
}

export default requireNativeModule<ExpoSpotifyRemoteModule>('ExpoSpotifyRemote');
