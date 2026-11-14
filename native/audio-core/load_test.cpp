#include "audio_core.hpp"

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <vector>

using dbstudio::audio::ChannelState;
using dbstudio::audio::StereoMixEngine;

static std::size_t env_size(const char* name, std::size_t fallback) {
  const char* value = std::getenv(name);
  if (!value) return fallback;
  char* end = nullptr;
  const auto parsed = std::strtoull(value, &end, 10);
  return end != value && *end == '\0' && parsed > 0 ? parsed : fallback;
}

static double percentile(std::vector<double> values, double fraction) {
  const auto index = static_cast<std::size_t>(
      std::ceil(fraction * static_cast<double>(values.size())) - 1.0);
  std::sort(values.begin(), values.end());
  return values[std::min(index, values.size() - 1)];
}

int main() {
  const std::size_t sample_rate = env_size("AUDIO_SAMPLE_RATE", 48000);
  const std::size_t buffer_frames = env_size("AUDIO_BUFFER_FRAMES", 128);
  const std::size_t mixes = env_size("AUDIO_MIXES", 16);
  const std::size_t seconds = env_size("AUDIO_LOAD_SECONDS", 30);
  if (buffer_frames > 128) {
    std::cerr << "FAIL: AUDIO_BUFFER_FRAMES cannot exceed 128 in this harness\n";
    return 2;
  }
  const std::size_t blocks = (sample_rate * seconds) / buffer_frames;
  const double budget_ms = 1000.0 * static_cast<double>(buffer_frames) /
                           static_cast<double>(sample_rate);

  std::vector<StereoMixEngine> engines(mixes);
  std::vector<std::array<float, 16 * 128>> inputs(mixes);
  std::vector<std::array<float, 2 * 128>> outputs(mixes);
  for (std::size_t mix = 0; mix < mixes; ++mix) {
    for (std::size_t channel = 0; channel < 16; ++channel) {
      engines[mix].set_channel(
          channel, ChannelState{0.25f + 0.01f * static_cast<float>(channel),
                                (static_cast<float>(channel % 5) - 2.0f) / 2.0f,
                                false});
    }
    for (std::size_t sample = 0; sample < inputs[mix].size(); ++sample) {
      inputs[mix][sample] =
          std::sin(static_cast<float>(sample + mix) * 0.013f) * 0.05f;
    }
  }

  std::vector<double> callback_ms;
  callback_ms.reserve(blocks);
  const auto started = std::chrono::steady_clock::now();
  for (std::size_t block = 0; block < blocks; ++block) {
    const auto callback_start = std::chrono::steady_clock::now();
    for (std::size_t mix = 0; mix < mixes; ++mix) {
      engines[mix].process(inputs[mix].data(), 16, outputs[mix].data(),
                           buffer_frames);
    }
    const auto callback_end = std::chrono::steady_clock::now();
    callback_ms.push_back(std::chrono::duration<double, std::milli>(
                              callback_end - callback_start)
                              .count());
  }
  const auto ended = std::chrono::steady_clock::now();
  const double wall_ms = std::chrono::duration<double, std::milli>(ended - started).count();
  const double p50 = percentile(callback_ms, 0.50);
  const double p95 = percentile(callback_ms, 0.95);
  const double p99 = percentile(callback_ms, 0.99);
  const double max = *std::max_element(callback_ms.begin(), callback_ms.end());
  const auto frames_processed = engines.front().metrics().frames_processed;

  std::cout << std::fixed << std::setprecision(4)
            << "{\"ok\":true,\"sampleRate\":" << sample_rate
            << ",\"bufferFrames\":" << buffer_frames << ",\"mixes\":" << mixes
            << ",\"simulatedSeconds\":" << seconds << ",\"blocks\":" << blocks
            << ",\"callbackBudgetMs\":" << budget_ms << ",\"p50Ms\":" << p50
            << ",\"p95Ms\":" << p95 << ",\"p99Ms\":" << p99
            << ",\"maxMs\":" << max << ",\"wallMs\":" << wall_ms
            << ",\"framesPerMix\":" << frames_processed << "}\n";

  // Keep margin for OS scheduling and native driver work.
  if (p99 > budget_ms * 0.80) {
    std::cerr << "FAIL: p99 callback time exceeds 80% of the buffer budget\n";
    return 1;
  }
  return 0;
}
