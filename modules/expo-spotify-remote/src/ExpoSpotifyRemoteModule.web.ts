import { registerWebModule, NativeModule } from 'expo';

class ExpoSpotifyRemoteModule extends NativeModule<{}> {}

export default registerWebModule(ExpoSpotifyRemoteModule, 'ExpoSpotifyRemoteModule');
