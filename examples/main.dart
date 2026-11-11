import 'dart:async';

import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';

void main() => runApp(const MaterialApp(home: FirstCall()));

class FirstCall extends StatefulWidget {
  const FirstCall({super.key});

  @override
  State<FirstCall> createState() => _FirstCallState();
}

class _FirstCallState extends State<FirstCall> {
  final room = Room();
  final url = TextEditingController(text: 'ws://127.0.0.1:7880');
  final token = TextEditingController();
  late final EventsListener<RoomEvent> listener;
  final remoteVideos = <VideoTrack>[];
  var status = 'Disconnected';
  var connected = false;
  var busy = false;

  @override
  void initState() {
    super.initState();
    listener = room.createListener()
      ..on<TrackSubscribedEvent>((event) {
        final track = event.track;
        if (mounted && track is VideoTrack && !remoteVideos.contains(track)) {
          setState(() => remoteVideos.add(track));
        }
      })
      ..on<TrackUnsubscribedEvent>((event) {
        if (mounted) setState(() => remoteVideos.remove(event.track));
      })
      ..on<RoomDisconnectedEvent>((event) {
        if (mounted) {
          setState(() {
            connected = false;
            status = 'Disconnected';
            remoteVideos.clear();
          });
        }
      });
  }

  Future<void> perform(Future<void> Function() action) async {
    setState(() => busy = true);
    try {
      await action();
    } catch (error) {
      if (mounted) setState(() => status = error.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> join() async {
    await room.connect(url.text.trim(), token.text.trim());
    if (!mounted) return;
    token.clear();
    setState(() {
      connected = true;
      status = 'Connected. Waiting for remote media.';
    });
  }

  Future<void> publish() async {
    final local = room.localParticipant;
    if (local == null) return;
    await local.setMicrophoneEnabled(true);
    await local.setCameraEnabled(true);
    if (mounted) setState(() => status = 'Camera and microphone published');
  }

  @override
  void dispose() {
    url.dispose();
    token.dispose();
    unawaited(closeRoom());
    super.dispose();
  }

  Future<void> closeRoom() async {
    await listener.dispose();
    await room.disconnect();
    await room.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('First Flutter call')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
                controller: url,
                decoration: const InputDecoration(labelText: 'Server URL')),
            TextField(
                controller: token,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Room token')),
            Wrap(
              spacing: 12,
              children: [
                FilledButton(
                    onPressed: busy || connected ? null : () => perform(join),
                    child: const Text('Join')),
                FilledButton(
                    onPressed:
                        busy || !connected ? null : () => perform(publish),
                    child: const Text('Publish camera and microphone')),
                TextButton(
                    onPressed: busy || !connected
                        ? null
                        : () => perform(room.startAudio),
                    child: const Text('Play audio')),
                TextButton(
                    onPressed: busy || !connected
                        ? null
                        : () => perform(room.disconnect),
                    child: const Text('Leave')),
              ],
            ),
            Text(status),
            for (final track in remoteVideos)
              AspectRatio(
                key: ObjectKey(track),
                aspectRatio: 16 / 9,
                child: VideoTrackRenderer(track),
              ),
          ],
        ),
      );
}
