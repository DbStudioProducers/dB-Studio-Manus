#pragma once

#include <cstddef>
#include <string>

namespace dbstudio::host {

enum class Backend { Portable, Asio, CoreAudio, Oboe, AudioUnit };

struct HostStatus {
  Backend backend = Backend::Portable;
  bool available = false;
  bool running = false;
  int sample_rate = 48000;
  int buffer_frames = 128;
  std::size_t xruns = 0;
  std::string detail;
};

class AudioHost {
 public:
  virtual ~AudioHost() = default;
  virtual HostStatus status() const = 0;
  virtual bool start() = 0;
  virtual void stop() = 0;
};

class PortableHost final : public AudioHost {
 public:
  HostStatus status() const override;
  bool start() override;
  void stop() override;
};

}  // namespace dbstudio::host
