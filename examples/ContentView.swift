import LiveKit
import SwiftUI

struct ContentView: View {
    @StateObject private var room = Room()
    @State private var url = "ws://127.0.0.1:7880"
    @State private var token = ""
    @State private var status = "Disconnected"
    @State private var busy = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("First iOS call").font(.title)
                TextField("Server URL", text: $url)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField("Room token", text: $token)
                HStack {
                    Button("Join") {
                        perform {
                            try await room.connect(
                                url: url.trimmingCharacters(in: .whitespacesAndNewlines),
                                token: token.trimmingCharacters(in: .whitespacesAndNewlines)
                            )
                            token = ""
                            status = "Connected. Waiting for remote media."
                        }
                    }
                    .disabled(busy || room.connectionState != .disconnected || token.isEmpty)
                    Button("Publish camera and microphone") {
                        perform {
                            try await room.localParticipant.setMicrophone(enabled: true)
                            try await room.localParticipant.setCamera(enabled: true)
                            status = "Camera and microphone published"
                        }
                    }
                    .disabled(busy || room.connectionState != .connected)
                    Button("Leave") {
                        perform {
                            await room.disconnect()
                            status = "Disconnected"
                        }
                    }
                    .disabled(busy || room.connectionState == .disconnected)
                }
                Text(status)
                Text("Remote video").font(.headline)
                ForEach(Array(room.remoteParticipants.values), id: \.identity) { participant in
                    RemoteParticipantVideos(participant: participant)
                }
            }
            .textFieldStyle(.roundedBorder)
            .padding()
        }
    }

    private func perform(_ operation: @escaping @MainActor () async throws -> Void) {
        busy = true
        Task { @MainActor in
            defer { busy = false }
            do { try await operation() }
            catch { status = error.localizedDescription }
        }
    }
}

private struct RemoteParticipantVideos: View {
    @ObservedObject var participant: RemoteParticipant

    var body: some View {
        ForEach(participant.videoTracks, id: \.sid) { publication in
            RemoteVideo(publication: publication)
        }
    }
}

private struct RemoteVideo: View {
    @ObservedObject var publication: TrackPublication

    var body: some View {
        if let video = publication.track as? VideoTrack {
            SwiftUIVideoView(video, layoutMode: .fit)
                .aspectRatio(16 / 9, contentMode: .fit)
                .background(.black)
        }
    }
}
