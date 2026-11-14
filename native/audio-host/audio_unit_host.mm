#include "audio_host.hpp"

#if defined(__APPLE__) && defined(DBSTUDIO_ENABLE_AUDIO_UNIT)
#include <AudioToolbox/AudioToolbox.h>
#endif

namespace dbstudio::host {

class AudioUnitHost final : public AudioHost {
 public:
  HostStatus status() const override {
#if defined(__APPLE__) && defined(DBSTUDIO_ENABLE_AUDIO_UNIT)
    return {Backend::AudioUnit, true, false, 48000, 128, 0,
            "RemoteIO/Audio Unit adapter compiled; session activation pending"};
#else
    return {Backend::AudioUnit, false, false, 48000, 128, 0,
            "Audio Unit adapter requires Apple SDK and DBSTUDIO_ENABLE_AUDIO_UNIT"};
#endif
  }

  bool start() override { return false; }
  void stop() override {}
};

}  // namespace dbstudio::host
