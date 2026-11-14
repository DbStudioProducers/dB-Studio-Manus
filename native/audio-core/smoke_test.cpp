#include "audio_core.hpp"

#include <cmath>
#include <cstdlib>
#include <iostream>

using dbstudio::audio::ChannelState;
using dbstudio::audio::StereoMixEngine;

static void expect(bool condition, const char* message) {
  if (!condition) {
    std::cerr << "FAIL: " << message << "\n";
    std::exit(1);
  }
}

int main() {
  constexpr std::size_t frames = 4;
  const float input[] = {1.0f, 0.5f, -1.0f, -0.5f};
  float output[frames * 2]{};
  StereoMixEngine engine;
  engine.process(input, 1, output, frames);
  expect(std::abs(output[0] - 1.0f) < 0.001f, "center left output");
  expect(std::abs(output[1] - 1.0f) < 0.001f, "center right output");
  expect(engine.metrics().frames_processed == frames, "frame counter");

  engine.set_channel(0, ChannelState{1.0f, -1.0f, false});
  engine.set_master(0.5f);
  engine.process(input, 1, output, frames);
  expect(std::abs(output[0] - 0.5f) < 0.001f, "panned left output");
  expect(std::abs(output[1]) < 0.001f, "right channel muted by pan");

  engine.set_channel(0, ChannelState{1.0f, 0.0f, true});
  engine.process(input, 1, output, frames);
  expect(std::abs(output[0]) < 0.001f && std::abs(output[1]) < 0.001f,
         "muted channel");

  engine.record_xrun();
  expect(engine.metrics().xruns == 1, "xrun counter");
  std::cout << "audio-core smoke: ok\n";
}
