package expo.modules.spotifyremote

import android.util.Log
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class ExpoSpotifyRemoteModule : Module() {
  private var spotifyAppRemote: SpotifyAppRemote? = null
  private val TAG = "SpotifyRemote"

  override fun definition() = ModuleDefinition {
    Name("ExpoSpotifyRemote")

    AsyncFunction("connect") { clientId: String, redirectUri: String, promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction promise.reject("NO_CONTEXT", "React context is null", null)
      
      val connectionParams = ConnectionParams.Builder(clientId)
        .setRedirectUri(redirectUri)
        .showAuthView(true)
        .build()

      SpotifyAppRemote.connect(context, connectionParams, object : Connector.ConnectionListener {
        override fun onConnected(appRemote: SpotifyAppRemote) {
          spotifyAppRemote = appRemote
          Log.d(TAG, "Connected to Spotify!")
          promise.resolve("Connected")
        }

        override fun onFailure(throwable: Throwable) {
          Log.e(TAG, throwable.message, throwable)
          promise.reject("CONNECT_FAILED", throwable.message ?: "Unknown error", throwable)
        }
      })
    }

    Function("disconnect") {
      SpotifyAppRemote.disconnect(spotifyAppRemote)
      spotifyAppRemote = null
    }

    AsyncFunction("play") { uri: String, promise: Promise ->
      spotifyAppRemote?.let {
        it.playerApi.play(uri).setResultCallback {
          promise.resolve(null)
        }.setErrorCallback { err ->
          promise.reject("PLAY_FAILED", err.message ?: "Unknown error", err)
        }
      } ?: run {
        promise.reject("NOT_CONNECTED", "SpotifyAppRemote is not connected", null)
      }
    }

    AsyncFunction("pause") { promise: Promise ->
      spotifyAppRemote?.let {
        it.playerApi.pause().setResultCallback {
          promise.resolve(null)
        }.setErrorCallback { err ->
          promise.reject("PAUSE_FAILED", err.message ?: "Unknown error", err)
        }
      } ?: run {
        promise.reject("NOT_CONNECTED", "SpotifyAppRemote is not connected", null)
      }
    }
  }
}
