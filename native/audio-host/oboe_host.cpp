#include "audio_host.hpp"

#if defined(__ANDROID__) && defined(DBSTUDIO_ENABLE_OBOE)
#include <oboe/Oboe.h>
#endif

namespace dbstudio::host {

class OboeHost final : public AudioHost {
 public:
  HostStatus status() const override {
#if defined(__ANDROID__) && defined(DBSTUDIO_ENABLE_OBOE)
    return {Backend::Oboe, true, false, 48000, 128, 0,
            "Oboe/AAudio adapter compiled; stream open pending"};
#else
    return {Backend::Oboe, false, false, 48000, 128, 0,
            "Oboe adapter requires Android and DBSTUDIO_ENABLE_OBOE"};
#endif
  }

  bool start() override { return false; }
  void stop() override {}
};

}  // namespace dbstudio::host
