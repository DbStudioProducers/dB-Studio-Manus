#include "audio_host.hpp"

#if defined(_WIN32) && defined(DBSTUDIO_ENABLE_ASIO)
#include <asio.h>
#endif

namespace dbstudio::host {

class AsioHost final : public AudioHost {
 public:
  HostStatus status() const override {
#if defined(_WIN32) && defined(DBSTUDIO_ENABLE_ASIO)
    return {Backend::Asio, true, false, 48000, 128, 0,
            "ASIO SDK adapter compiled; device enumeration pending"};
#else
    return {Backend::Asio, false, false, 48000, 128, 0,
            "ASIO adapter requires Windows and DBSTUDIO_ENABLE_ASIO"};
#endif
  }

  bool start() override { return false; }
  void stop() override {}
};

}  // namespace dbstudio::host
