package com.example.livekitcall

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import io.livekit.android.LiveKit
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.renderer.SurfaceViewRenderer
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val room by lazy { LiveKit.create(applicationContext) }
    private lateinit var renderer: SurfaceViewRenderer
    private lateinit var status: TextView
    private lateinit var join: Button
    private lateinit var publish: Button
    private lateinit var leave: Button
    private var remoteVideo: VideoTrack? = null
    private var connected = false

    private val permissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        if (hasMediaPermissions()) publishMedia()
        else {
            publish.isEnabled = connected
            status.text = "Allow camera and microphone to publish"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = EditText(this).apply {
            hint = "Server URL"
            setText("ws://10.0.2.2:7880")
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_URI
        }
        val token = EditText(this).apply {
            hint = "Room token"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        status = TextView(this).apply { text = "Disconnected" }
        join = Button(this).apply { text = "Join" }
        publish = Button(this).apply { text = "Publish camera and microphone"; isEnabled = false }
        leave = Button(this).apply { text = "Leave"; isEnabled = false }
        renderer = SurfaceViewRenderer(this)
        room.initVideoRenderer(renderer)

        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            fitsSystemWindows = true
            setPadding(24, 24, 24, 24)
            for (view in listOf(url, token, join, publish, leave, status)) addView(view)
            addView(renderer, LinearLayout.LayoutParams(-1, 0, 1f))
        })

        lifecycleScope.launch(start = CoroutineStart.UNDISPATCHED) {
            room.events.collect { event ->
                when (event) {
                    is RoomEvent.TrackSubscribed -> {
                        val video = event.track as? VideoTrack
                        if (video != null) {
                            detachVideo()
                            remoteVideo = video
                            video.addRenderer(renderer)
                        }
                    }
                    is RoomEvent.TrackUnsubscribed -> if (event.track == remoteVideo) detachVideo()
                    is RoomEvent.Disconnected -> if (connected) showDisconnected()
                    else -> Unit
                }
            }
        }

        join.setOnClickListener {
            join.isEnabled = false
            status.text = "Connecting…"
            lifecycleScope.launch {
                try {
                    room.connect(url.text.toString().trim(), token.text.toString().trim())
                    token.text.clear()
                    connected = true
                    status.text = "Connected. Waiting for remote media."
                    publish.isEnabled = true
                    leave.isEnabled = true
                } catch (error: CancellationException) {
                    throw error
                } catch (error: Exception) {
                    showDisconnected()
                    status.text = error.message ?: "Join failed"
                }
            }
        }
        publish.setOnClickListener {
            publish.isEnabled = false
            if (hasMediaPermissions()) publishMedia()
            else permissions.launch(arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO))
        }
        leave.setOnClickListener { room.disconnect(); showDisconnected() }
    }

    private fun hasMediaPermissions() =
        listOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO).all {
            checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED
        }

    private fun publishMedia() {
        if (!connected) return
        lifecycleScope.launch {
            try {
                val audio = room.localParticipant.setMicrophoneEnabled(true)
                val video = room.localParticipant.setCameraEnabled(true)
                check(audio && video) { "Camera or microphone could not be published" }
                status.text = "Camera and microphone published"
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                publish.isEnabled = connected
                status.text = error.message ?: "Publish failed"
            }
        }
    }

    private fun detachVideo() {
        remoteVideo?.removeRenderer(renderer)
        remoteVideo = null
        renderer.clearImage()
    }

    private fun showDisconnected() {
        detachVideo()
        connected = false
        join.isEnabled = true
        publish.isEnabled = false
        leave.isEnabled = false
        status.text = "Disconnected"
    }

    override fun onDestroy() {
        super.onDestroy()
        detachVideo()
        room.disconnect()
        renderer.release()
        room.release()
    }
}
