#pragma once

#include <array>
#include <cstddef>

namespace dbstudio::audio {

constexpr std::size_t kMaxChannels = 16;

struct ChannelState {
  float gain = 1.0f;
  float pan = 0.0f;
  bool muted = false;
};

struct Metrics {
  float peak_left = 0.0f;
  float peak_right = 0.0f;
  float rms_left = 0.0f;
  float rms_right = 0.0f;
  std::size_t frames_processed = 0;
  std::size_t xruns = 0;
};

class StereoMixEngine {
 public:
  StereoMixEngine();

  void set_channel(std::size_t channel, ChannelState state);
  void set_master(float gain);
  void record_xrun();

  // input is interleaved mono channels: frames * input_channels samples.
  // output is interleaved stereo: frames * 2 samples.
  // The callback performs no allocation, locking, I/O or UI work.
  void process(const float* input, std::size_t input_channels, float* output,
               std::size_t frames) noexcept;

  const Metrics& metrics() const noexcept { return metrics_; }

 private:
  std::array<ChannelState, kMaxChannels> channels_{};
  float master_ = 1.0f;
  Metrics metrics_{};
};

}  // namespace dbstudio::audio
