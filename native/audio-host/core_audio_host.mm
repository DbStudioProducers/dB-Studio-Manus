#include "audio_host.hpp"

#if defined(__APPLE__) && defined(DBSTUDIO_ENABLE_CORE_AUDIO)
#include <AudioToolbox/AudioToolbox.h>
#endif

namespace dbstudio::host {

class CoreAudioHost final : public AudioHost {
 public:
  HostStatus status() const override {
#if defined(__APPLE__) && defined(DBSTUDIO_ENABLE_CORE_AUDIO)
    return {Backend::CoreAudio, true, false, 48000, 128, 0,
            "Core Audio HAL adapter compiled; device open pending"};
#else
    return {Backend::CoreAudio, false, false, 48000, 128, 0,
            "Core Audio adapter requires macOS and DBSTUDIO_ENABLE_CORE_AUDIO"};
#endif
  }

  bool start() override { return false; }
  void stop() override {}
};

}  // namespace dbstudio::host
