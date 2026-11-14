#include "audio_core.hpp"

#include <algorithm>
#include <cmath>

namespace dbstudio::audio {

StereoMixEngine::StereoMixEngine() = default;

void StereoMixEngine::set_channel(std::size_t channel, ChannelState state) {
  if (channel >= kMaxChannels) return;
  state.gain = std::clamp(state.gain, 0.0f, 4.0f);
  state.pan = std::clamp(state.pan, -1.0f, 1.0f);
  channels_[channel] = state;
}

void StereoMixEngine::set_master(float gain) {
  master_ = std::clamp(gain, 0.0f, 4.0f);
}

void StereoMixEngine::record_xrun() { metrics_.xruns += 1; }

void StereoMixEngine::process(const float* input, std::size_t input_channels,
                              float* output, std::size_t frames) noexcept {
  if (!output || frames == 0) return;
  const std::size_t channels = std::min(input_channels, kMaxChannels);
  float sum_square_left = 0.0f;
  float sum_square_right = 0.0f;
  float peak_left = 0.0f;
  float peak_right = 0.0f;

  for (std::size_t frame = 0; frame < frames; ++frame) {
    float left = 0.0f;
    float right = 0.0f;
    for (std::size_t channel = 0; channel < channels; ++channel) {
      const ChannelState& state = channels_[channel];
      if (state.muted || !input) continue;
      const float sample = input[frame * input_channels + channel] * state.gain;
      const float left_gain = state.pan <= 0.0f ? 1.0f : 1.0f - state.pan;
      const float right_gain = state.pan >= 0.0f ? 1.0f : 1.0f + state.pan;
      left += sample * left_gain;
      right += sample * right_gain;
    }

    left *= master_;
    right *= master_;
    output[frame * 2] = left;
    output[frame * 2 + 1] = right;
    peak_left = std::max(peak_left, std::abs(left));
    peak_right = std::max(peak_right, std::abs(right));
    sum_square_left += left * left;
    sum_square_right += right * right;
  }

  metrics_.peak_left = peak_left;
  metrics_.peak_right = peak_right;
  metrics_.rms_left = std::sqrt(sum_square_left / static_cast<float>(frames));
  metrics_.rms_right = std::sqrt(sum_square_right / static_cast<float>(frames));
  metrics_.frames_processed += frames;
}

}  // namespace dbstudio::audio
